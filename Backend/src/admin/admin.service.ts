import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MidtransClientService } from '../payments/midtrans.client.js';
import { XenditClientService } from '../payments/xendit.client.js';
import { OrderStatus, PartnerStatus, PaymentStatus } from '../generated/prisma/enums.js';
import { ListDisputesQuery } from './dto/list-disputes.query.js';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto.js';
import { BalanceQueryDto } from './dto/balance-query.dto.js';
import { ListXenditTransactionsQuery } from './dto/list-xendit-transactions.query.js';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private midtrans: MidtransClientService,
    private xendit: XenditClientService,
  ) {}

  async getMidtransBalance(query: BalanceQueryDto) {
    return this.midtrans.getBalanceMutation({
      startTime: new Date(query.startTime),
      endTime: new Date(query.endTime),
      currency: query.currency,
    });
  }

  async getXenditBalance() {
    return this.xendit.getBalance();
  }

  async listXenditTransactions(query: ListXenditTransactionsQuery) {
    return this.xendit.listTransactions(query);
  }

  async dashboard() {
    const [
      ordersByStatus,
      totalCustomers,
      partnersByStatus,
      gmvAgg,
      commissionAgg,
      openDisputes,
    ] = await this.prisma.$transaction([
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.customerProfile.count(),
      this.prisma.partner.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { commissionAmount: true },
      }),
      this.prisma.dispute.count({ where: { status: 'open' } }),
    ]);

    // groupBy mengembalikan array acak urutannya & cuma status yang ADA datanya --
    // diratakan jadi object supaya FE tidak perlu cari-cari / status kosong tetap muncul 0.
    const toCountMap = (rows: { status: string; _count: { _all: number } }[]) =>
      Object.fromEntries(rows.map((r) => [r.status, r._count._all]));

    return {
      orders: {
        total: ordersByStatus.reduce((sum: number, r: { _count: { _all: number } }) => sum + r._count._all, 0),
        byStatus: {
          PENDING: 0,
          CONFIRMED: 0,
          DRIVER_ASSIGNED: 0,
          EN_ROUTE_TO_PICKUP: 0,
          ARRIVED_AT_PICKUP: 0,
          LOADING: 0,
          IN_TRANSIT: 0,
          ARRIVED_AT_DROPOFF: 0,
          UNLOADING: 0,
          COMPLETED: 0,
          CANCELLED: 0,
          DISPUTED: 0,
          ...toCountMap(ordersByStatus),
        },
      },
      customers: { total: totalCustomers },
      partners: {
        byStatus: {
          PENDING: 0,
          APPROVED: 0,
          REJECTED: 0,
          SUSPENDED: 0,
          ...toCountMap(partnersByStatus),
        },
      },
      revenue: {
        gmv: Number(gmvAgg._sum.amount ?? 0),
        totalCommission: Number(commissionAgg._sum.commissionAmount ?? 0),
      },
      disputes: { open: openDisputes },
    };
  }

  async listDisputes(query: ListDisputesQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.status ? { status: query.status } : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.dispute.findMany({
        where,
        include: { order: { select: { orderNumber: true, status: true, finalPrice: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dispute.count({ where }),
    ]);
    return { data, meta: { page, limit, total } };
  }

  async resolveDispute(adminUserId: string, disputeId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute tidak ditemukan');
    if (dispute.status !== 'open') {
      throw new ConflictException(`Dispute ini sudah berstatus ${dispute.status}`);
    }

    // Menyelesaikan dispute TIDAK otomatis mengubah status order (mis. balik ke
    // COMPLETED atau ke CANCELLED untuk refund) -- itu keputusan kasus-per-kasus
    // yang sengaja diserahkan ke admin untuk dilakukan manual lewat endpoint order
    // / payment yang relevan, bukan diasumsikan oleh sistem.
    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: dto.outcome,
        resolution: dto.resolution,
        resolvedBy: adminUserId,
        resolvedAt: new Date(),
      },
    });
  }
}
