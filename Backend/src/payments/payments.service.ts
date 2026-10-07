import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from '../generated/prisma/enums.js';
import type { AuthUser } from '../common/auth-user.js';
import { MidtransClientService } from './midtrans.client.js';
import { XenditClientService } from './xendit.client.js';
import { verifyMidtransSignature, mapMidtransStatus } from './midtrans-signature.js';
import { mapXenditInvoiceStatus } from './xendit-signature.js';
import { CreatePaymentDto, PaymentProvider } from './dto/create-payment.dto.js';
import type { XenditInvoiceNotificationBody } from './dto/xendit-notification.dto.js';
import { ListPaymentsQuery } from './dto/list-payments.query.js';
import type { MidtransNotificationBody } from './dto/midtrans-notification.dto.js';

const DEFAULT_COMMISSION_RATE = 0.15;

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private midtrans: MidtransClientService,
    private xendit: XenditClientService,
  ) {}

  async create(userId: string, dto: CreatePaymentDto) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, phone: true, email: true } } },
    });
    if (!customer) throw new NotFoundException('Profil customer tidak ditemukan');

    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.customerId !== customer.id) throw new ForbiddenException('Order ini bukan milikmu');
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order ini sudah dibatalkan');
    }
    if (!order.finalPrice) {
      throw new BadRequestException('Order ini belum punya harga final');
    }

    const existing = await this.prisma.payment.findUnique({ where: { orderId: dto.orderId } });
    if (existing) throw new ConflictException('Order ini sudah punya pembayaran');

    const amount = Number(order.finalPrice);

    // CASH: cukup dicatat, pelunasan terjadi fisik di lapangan, dikonfirmasi
    // manual lewat markCashPaid(). Tidak ada panggilan ke Midtrans sama sekali.
    if (dto.method === PaymentMethod.CASH) {
      return this.prisma.payment.create({
        data: {
          orderId: dto.orderId,
          method: PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
          amount,
          commissionRate: DEFAULT_COMMISSION_RATE,
        },
      });
    }

    // Non-cash: pilih provider (default MIDTRANS kalau tidak diisi), minta dia
    // buatkan transaksi, simpan Payment PENDING -- status sebenarnya baru
    // dikonfirmasi lewat webhook masing-masing provider.
    const provider = dto.provider ?? PaymentProvider.MIDTRANS;

    if (provider === PaymentProvider.XENDIT) {
      const invoice = await this.xendit.createInvoice({
        orderNumber: order.orderNumber,
        amount,
        customerName: customer.user.name,
        customerEmail: customer.user.email,
      });

      const payment = await this.prisma.payment.create({
        data: {
          orderId: dto.orderId,
          method: dto.method,
          status: PaymentStatus.PENDING,
          amount,
          commissionRate: DEFAULT_COMMISSION_RATE,
          gatewayProvider: 'xendit',
          gatewayRefId: order.orderNumber,
        },
      });

      return { ...payment, invoiceUrl: invoice.invoiceUrl };
    }

    const snap = await this.midtrans.createSnapTransaction({
      orderNumber: order.orderNumber,
      grossAmount: amount,
      customerName: customer.user.name,
      customerPhone: customer.user.phone,
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        method: dto.method,
        status: PaymentStatus.PENDING,
        amount,
        commissionRate: DEFAULT_COMMISSION_RATE,
        gatewayProvider: 'midtrans',
        gatewayRefId: order.orderNumber,
      },
    });

    return { ...payment, snapToken: snap.token, redirectUrl: snap.redirectUrl };
  }

  // Partner yang mengerjakan order (atau admin) mengonfirmasi pembayaran tunai
  // sudah diterima fisik. Hanya berlaku untuk method CASH yang masih PENDING.
  async markCashPaid(user: AuthUser, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');
    if (payment.method !== PaymentMethod.CASH) {
      throw new BadRequestException('Hanya pembayaran CASH yang bisa dikonfirmasi manual');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException(`Pembayaran ini sudah berstatus ${payment.status}`);
    }

    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      const partner = await this.prisma.partner.findUnique({ where: { userId: user.userId } });
      if (!partner || partner.id !== payment.order.partnerId) throw new ForbiddenException();
    }

    return this.settlePayment(payment.id, Number(payment.amount), Number(payment.commissionRate));
  }

  // Dipanggil oleh webhook. TIDAK melakukan pengecekan auth user (memang publik),
  // keabsahannya dijamin verifyMidtransSignature di controller sebelum method ini dipanggil.
  async handleMidtransNotification(body: MidtransNotificationBody) {
    const mapped = mapMidtransStatus(body.transaction_status, body.fraud_status);
    if (!mapped) return { received: true, action: 'ignored', reason: body.transaction_status };

    // gatewayRefId kita isi dengan orderNumber (bukan order_id UUID internal),
    // karena itu yang dikirim sebagai order_id ke Midtrans saat createTransaction.
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayRefId: body.order_id },
    });
    if (!payment) {
      // Jangan lempar error -- Midtrans akan retry terus kalau responnya bukan 2xx.
      // Order ini mungkin bukan dari sistem kita atau sudah dihapus.
      return { received: true, action: 'ignored', reason: 'payment not found' };
    }
    if (payment.status !== PaymentStatus.PENDING) {
      return { received: true, action: 'ignored', reason: 'already settled' };
    }

    if (mapped === 'PAID') {
      await this.settlePayment(payment.id, Number(payment.amount), Number(payment.commissionRate));
    } else {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: mapped } });
    }
    return { received: true, action: 'updated', status: mapped };
  }

  // Admin: daftar SEMUA payment dari database kita sendiri, bukan query ulang
  // ke Midtrans -- data ini sudah sinkron lewat webhook yang sudah berjalan,
  // jadi tidak perlu integrasi baru untuk kebutuhan "history transaksi".
  async listAll(query: ListPaymentsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: { order: { select: { orderNumber: true, customerId: true, partnerId: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, meta: { page, limit, total } };
  }

  // Sama pola & alasannya dengan handleMidtransNotification -- dipanggil
  // webhook, keasliannya sudah divalidasi di controller lewat x-callback-token.
  async handleXenditNotification(body: XenditInvoiceNotificationBody) {
    const mapped = mapXenditInvoiceStatus(body.status);
    if (!mapped) return { received: true, action: 'ignored', reason: body.status };

    const payment = await this.prisma.payment.findFirst({
      where: { gatewayRefId: body.external_id },
    });
    if (!payment) {
      return { received: true, action: 'ignored', reason: 'payment not found' };
    }
    if (payment.status !== PaymentStatus.PENDING) {
      return { received: true, action: 'ignored', reason: 'already settled' };
    }

    if (mapped === 'PAID') {
      await this.settlePayment(payment.id, Number(payment.amount), Number(payment.commissionRate));
    } else {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: mapped } });
    }
    return { received: true, action: 'updated', status: mapped };
  }

  async getForOrder(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    await this.assertOrderAccess(user, order);

    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('Order ini belum punya pembayaran');
    return payment;
  }

  private async settlePayment(paymentId: string, amount: number, commissionRate: number) {
    const commissionAmount = Math.round(amount * commissionRate);
    const partnerEarning = amount - commissionAmount;

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        commissionAmount,
        partnerEarning,
      },
    });
  }

  private async assertOrderAccess(
    user: AuthUser,
    order: { customerId: string; partnerId: string | null },
  ) {
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    if (isAdmin) return;

    if (user.role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customerProfile.findUnique({
        where: { userId: user.userId },
      });
      if (!customer || customer.id !== order.customerId) throw new ForbiddenException();
      return;
    }
    if (user.role === UserRole.PARTNER) {
      const partner = await this.prisma.partner.findUnique({ where: { userId: user.userId } });
      if (!partner || partner.id !== order.partnerId) throw new ForbiddenException();
      return;
    }
    throw new ForbiddenException();
  }
}
