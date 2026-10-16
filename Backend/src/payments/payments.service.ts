import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from '../generated/prisma/enums.js';
import type { AuthUser } from '../common/auth-user.js';
import { MidtransClientService } from './midtrans.client.js';
import { XenditClientService } from './xendit.client.js';
import { mapMidtransStatus } from './midtrans-signature.js';
import { mapXenditInvoiceStatus } from './xendit-signature.js';
import { CreatePaymentDto, PaymentProvider } from './dto/create-payment.dto.js';
import type {
  XenditInvoiceNotificationBody,
  XenditSessionNotificationBody,
} from './dto/xendit-notification.dto.js';
import { ListPaymentsQuery } from './dto/list-payments.query.js';
import type { MidtransNotificationBody } from './dto/midtrans-notification.dto.js';
import {
  PaymentGatewayMode,
  cashEnabledForMode,
  gatewayForMode,
  isPaymentGatewayMode,
} from './payment-gateway-mode.js';

const DEFAULT_COMMISSION_RATE = 0.15;

// Masa berlaku sesi pembayaran online (Snap / Xendit Session) dalam menit.
// Dipakai juga sebagai batas bawah "kedaluwarsa" di UI pelanggan.
const SESSION_TTL_MINUTES = 30;

// Xendit hanya mengizinkan huruf/angka (dan spasi) di nama customer.
function sanitizeXenditName(name: string): string {
  const cleaned = (name ?? '').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  return cleaned.length > 0 ? cleaned.slice(0, 50) : 'Pelanggan';
}

// Xendit membatasi email maksimal 50 karakter; kalau lebih/aneh, kosongkan
// saja (field ini opsional) daripada membuat request ditolak.
function normalizeXenditEmail(email: string | null | undefined): string | null {
  const value = (email ?? '').trim();
  if (!value || value.length > 50 || !value.includes('@')) return null;
  return value;
}

// Xendit minta format E.164 (+62...). Nomor kita biasanya lokal (08xx).
function normalizeXenditPhone(phone: string | null | undefined): string | null {
  const raw = (phone ?? '').replace(/[^\d+]/g, '');
  if (!raw) return null;
  let digits = raw.startsWith('+') ? raw.slice(1) : raw;
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  if (!digits.startsWith('62')) return null;
  if (digits.length < 10 || digits.length > 15) return null;
  return `+${digits}`;
}

// Key penyimpanan mode metode pembayaran di tabel system_settings.
// Nilainya salah satu dari PaymentGatewayMode.
const SETTING_PAYMENT_GATEWAY_MODE = 'payment_gateway_mode';
// Key lama (MIDTRANS | XENDIT) -- dibaca untuk kompatibilitas & dijaga sinkron
// saat admin mengubah setting supaya integrasi lama tidak salah baca.
const LEGACY_SETTING_PAYMENT_GATEWAY = 'payment_gateway';
// Default lama = Midtrans + tunai selalu tersedia.
const DEFAULT_PAYMENT_GATEWAY_MODE = PaymentGatewayMode.MIDTRANS_CASH;

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private midtrans: MidtransClientService,
    private xendit: XenditClientService,
    private config: ConfigService,
  ) {}

  // Mode metode pembayaran global yang dipilih admin. Kalau belum pernah
  // disimpan, turunkan dari setting lama (payment_gateway) supaya perilaku lama
  // tetap sama; kalau tidak ada juga, pakai default (Midtrans + Cash).
  async getPaymentGatewayMode(): Promise<PaymentGatewayMode> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: SETTING_PAYMENT_GATEWAY_MODE },
    });
    if (setting && isPaymentGatewayMode(setting.value)) {
      return setting.value;
    }

    const legacy = await this.prisma.systemSetting.findUnique({
      where: { key: LEGACY_SETTING_PAYMENT_GATEWAY },
    });
    if (legacy?.value === PaymentProvider.XENDIT) return PaymentGatewayMode.XENDIT_CASH;
    if (legacy?.value === PaymentProvider.MIDTRANS) return PaymentGatewayMode.MIDTRANS_CASH;

    return DEFAULT_PAYMENT_GATEWAY_MODE;
  }

  async updatePaymentGatewayMode(mode: PaymentGatewayMode): Promise<PaymentGatewayMode> {
    await this.prisma.systemSetting.upsert({
      where: { key: SETTING_PAYMENT_GATEWAY_MODE },
      update: { value: mode },
      create: { key: SETTING_PAYMENT_GATEWAY_MODE, value: mode },
    });

    // Jaga key lama tetap sinkron (kalau mode punya gateway online).
    const gateway = gatewayForMode(mode);
    if (gateway) {
      await this.prisma.systemSetting.upsert({
        where: { key: LEGACY_SETTING_PAYMENT_GATEWAY },
        update: { value: gateway },
        create: { key: LEGACY_SETTING_PAYMENT_GATEWAY, value: gateway },
      });
    }

    return mode;
  }

  // Ringkasan setting metode pembayaran: dipakai UI admin (GET/PATCH
  // /payments/settings) dan app pelanggan (GET /payments/methods) untuk tahu
  // metode mana yang sedang diizinkan. Bonus untuk app pelanggan: kunci
  // publik Midtrans (client key) + env, supaya bisa memuat Snap.js untuk mode
  // embedded tanpa endpoint tambahan. Client key Memang dipakai di browser.
  async getPaymentMethodSettings(): Promise<{
    mode: PaymentGatewayMode;
    gateway: PaymentProvider | null;
    cashEnabled: boolean;
    midtransClientKey: string;
    midtransIsProduction: boolean;
    midtransSnapJsUrl: string;
  }> {
    const mode = await this.getPaymentGatewayMode();
    return {
      mode,
      gateway: gatewayForMode(mode),
      cashEnabled: cashEnabledForMode(mode),
      midtransClientKey: this.midtrans.clientKey,
      midtransIsProduction: this.midtrans.isProduction,
      midtransSnapJsUrl: this.midtrans.snapJsUrl,
    };
  }

  // Membuat / memperbarui pembayaran untuk sebuah order.
  //
  // Berbeda dari sebelumnya, di sini pembayaran boleh dibuat ULANG selama belum
  // PAID (status PENDING/FAILED). Ini yang membuat pelanggan "tidak stuck":
  // kalau pembayaran online gagal atau popup ditutup, ia bisa mencoba lagi atau
  // ganti metode (mis. ke tunai) tanpa tertahan constraint unik Payment.orderId.
  //
  // Mode embedded:
  // - MIDTRANS -> buat Snap token, app pelanggan memanggil snap.embed().
  // - XENDIT   -> buat Payment Session (mode COMPONENTS), app pelanggan
  //               menginisialisasi xendit-components-web dengan components_sdk_key.
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
    if (existing?.status === PaymentStatus.PAID) {
      throw new ConflictException('Order ini sudah dibayar');
    }
    if (existing?.status === PaymentStatus.REFUNDED) {
      throw new ConflictException('Pembayaran order ini sudah dikembalikan (refund)');
    }

    const amount = Number(order.finalPrice);
    const mode = await this.getPaymentGatewayMode();
    const gateway = gatewayForMode(mode);

    // CASH: cukup dicatat, pelunasan fisik di lapangan dikonfirmasi lewat
    // markCashPaid(). gatewayProvider/gatewayRefId sengaja dikosongkan supaya
    // webhook gateway yang mungkin telat tidak keliru menandai lunas.
    if (dto.method === PaymentMethod.CASH) {
      if (!cashEnabledForMode(mode)) {
        throw new BadRequestException('Pembayaran tunai sedang tidak tersedia');
      }
      return this.persistPayment(dto.orderId, existing?.id, {
        method: PaymentMethod.CASH,
        amount,
        gatewayProvider: null,
        gatewayRefId: null,
      });
    }

    // Non-cash: gateway ditentukan setting global yang dipilih admin.
    if (!gateway) {
      throw new BadRequestException('Pembayaran online sedang tidak tersedia');
    }
    if (dto.provider && dto.provider !== gateway) {
      throw new BadRequestException(`Gateway pembayaran sedang diatur ke ${gateway}`);
    }

    if (gateway === PaymentProvider.XENDIT) {
      const session = await this.xendit.createComponentsSession({
        referenceId: order.orderNumber,
        amount,
        customerRefId: `cust${order.id.replace(/-/g, '')}`,
        customerName: sanitizeXenditName(customer.user.name),
        customerEmail: normalizeXenditEmail(customer.user.email),
        customerPhone: normalizeXenditPhone(customer.user.phone),
        origins: this.xenditComponentsOrigins(),
        returnUrl: this.xenditReturnUrl(order.id),
        expiresAt: new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000),
      });

      const payment = await this.persistPayment(dto.orderId, existing?.id, {
        method: dto.method,
        amount,
        gatewayProvider: 'xendit',
        gatewayRefId: order.orderNumber,
      });

      return {
        ...payment,
        componentsSdkKey: session.componentsSdkKey,
        paymentSessionId: session.paymentSessionId,
        expiresAt: session.expiresAt,
      };
    }

    const snap = await this.midtrans.createSnapTransaction({
      orderNumber: order.orderNumber,
      grossAmount: amount,
      customerName: customer.user.name,
      customerPhone: customer.user.phone,
    });

    const payment = await this.persistPayment(dto.orderId, existing?.id, {
      method: dto.method,
      amount,
      gatewayProvider: 'midtrans',
      gatewayRefId: order.orderNumber,
    });

    return { ...payment, snapToken: snap.token, redirectUrl: snap.redirectUrl };
  }

  // Simpan pembayaran sebagai PENDING. Update baris lama bila ada (retry/ganti
  // metode), atau buat baris baru bila belum ada sama sekali.
  private async persistPayment(
    orderId: string,
    existingId: string | undefined,
    fields: {
      method: PaymentMethod;
      amount: number;
      gatewayProvider: string | null;
      gatewayRefId: string | null;
    },
  ) {
    const data = {
      method: fields.method,
      status: PaymentStatus.PENDING,
      amount: fields.amount,
      commissionRate: DEFAULT_COMMISSION_RATE,
      gatewayProvider: fields.gatewayProvider,
      gatewayRefId: fields.gatewayRefId,
      paidAt: null,
    };

    if (existingId) {
      return this.prisma.payment.update({ where: { id: existingId }, data });
    }
    return this.prisma.payment.create({ data: { orderId, ...data } });
  }

  // Origin app pelanggan untuk validasi CORS Xendit Components. Bisa dipisah
  // dari CORS_ORIGIN lewat XENDIT_COMPONENTS_ORIGINS (dipisah koma).
  private xenditComponentsOrigins(): string[] {
    const raw =
      this.config.get<string>('XENDIT_COMPONENTS_ORIGINS') ||
      this.config.get<string>('CORS_ORIGIN') ||
      '';
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  // URL kembali setelah pembayaran. Hanya dikirim bila HTTPS, karena Xendit
  // mensyaratkan begitu; di dev (http) biarkan Xendit memakai halaman defaultnya.
  private xenditReturnUrl(orderId: string): string | undefined {
    const base = this.config.get<string>('CUSTOMER_APP_URL');
    if (!base) return undefined;
    const url = `${base.replace(/\/+$/, '')}/orders/${orderId}/payment?checkout=resume`;
    return url.startsWith('https://') ? url : undefined;
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
    if (!payment || payment.gatewayProvider !== 'midtrans') {
      // Jangan lempar error -- Midtrans akan retry terus kalau responnya bukan 2xx.
      // Order ini mungkin bukan dari sistem kita atau sudah dihapus.
      return { received: true, action: 'ignored', reason: 'payment not found' };
    }
    // Pembayaran yang sudah final (lunas/refund) tidak diubah lagi oleh webhook.
    if (
      payment.status === PaymentStatus.PAID ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      return { received: true, action: 'ignored', reason: 'already settled' };
    }

    // PAID boleh menimpa PENDING maupun FAILED: pelanggan bisa mencoba ulang
    // pembayaran (Snap token baru untuk order yang sama), dan notifikasi
    // "expire" dari percobaan lama bisa datang lebih dulu.
    if (mapped === 'PAID') {
      await this.settlePayment(payment.id, Number(payment.amount), Number(payment.commissionRate));
      return { received: true, action: 'updated', status: 'PAID' };
    }
    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: mapped } });
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
    if (!payment || payment.gatewayProvider !== 'xendit') {
      return { received: true, action: 'ignored', reason: 'payment not found' };
    }
    // Sudah final: jangan diubah lagi (lihat catatan di handler Midtrans).
    if (
      payment.status === PaymentStatus.PAID ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      return { received: true, action: 'ignored', reason: 'already settled' };
    }

    if (mapped === 'PAID') {
      await this.settlePayment(payment.id, Number(payment.amount), Number(payment.commissionRate));
      return { received: true, action: 'updated', status: 'PAID' };
    }
    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: mapped } });
    return { received: true, action: 'updated', status: mapped };
  }

  // Webhook Payment Session (mode COMPONENTS) dari Xendit. Event final:
  // payment_session.completed (lunas) / payment_session.expired (kedaluwarsa).
  // Sama seperti handler lain, keasliannya sudah divalidasi x-callback-token
  // di controller.
  async handleXenditSessionNotification(body: XenditSessionNotificationBody) {
    const referenceId = body.data?.reference_id;
    if (!referenceId) {
      return { received: true, action: 'ignored', reason: 'missing reference_id' };
    }

    // reference_id sesi kita isi dengan orderNumber (sama seperti gatewayRefId).
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayRefId: referenceId },
    });
    if (!payment || payment.gatewayProvider !== 'xendit') {
      return { received: true, action: 'ignored', reason: 'payment not found' };
    }
    // Sudah final: jangan diubah lagi (lihat catatan di handler Midtrans).
    if (
      payment.status === PaymentStatus.PAID ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      return { received: true, action: 'ignored', reason: 'already settled' };
    }

    const sessionStatus = body.data?.status;
    const isCompleted =
      body.event === 'payment_session.completed' || sessionStatus === 'COMPLETED';
    const isExpired =
      body.event === 'payment_session.expired' ||
      sessionStatus === 'EXPIRED' ||
      sessionStatus === 'CANCELED';

    // Completed boleh menimpa PENDING maupun FAILED: sesi lama untuk order yang
    // sama bisa kedaluwarsa lebih dulu sebelum percobaan terbaru selesai.
    if (isCompleted) {
      await this.settlePayment(payment.id, Number(payment.amount), Number(payment.commissionRate));
      return { received: true, action: 'updated', status: 'PAID' };
    }
    if (isExpired) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      return { received: true, action: 'updated', status: 'FAILED' };
    }
    return { received: true, action: 'ignored', reason: body.event };
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
