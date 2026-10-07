import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { IrisClientService } from './iris.client.js';
import { XenditPayoutClientService } from './xendit-payout.client.js';
import { CreateWithdrawalDto, WithdrawalProvider } from './dto/create-withdrawal.dto.js';

@Injectable()
export class WithdrawalsService {
  constructor(
    private prisma: PrismaService,
    private iris: IrisClientService,
    private xenditPayout: XenditPayoutClientService,
  ) {}

  /**
   * Membuat payout di Midtrans Iris untuk menarik saldo ke rekening bisnis.
   *
   * CATATAN KEAMANAN YANG DISENGAJA: method ini hanya sampai tahap MEMBUAT
   * payout (role Creator di sisi Iris). TIDAK ada pemanggilan otomatis ke
   * endpoint approve, dan TIDAK AKAN pernah ditambahkan di method ini --
   * walau secara teknis bisa, itu meniadakan maksud pemisahan Creator/Approver
   * yang memang dirancang Midtrans supaya tidak ada satu alur otomatis tanpa
   * pengawasan manusia yang bisa mencairkan dana sendirian. Approval tetap
   * harus dilakukan terpisah: lewat dashboard Iris, atau endpoint approve
   * dengan kredensial approver yang berbeda dari yang dipakai di sini.
   */
  async create(adminUserId: string, dto: CreateWithdrawalDto) {
    const provider = dto.provider ?? WithdrawalProvider.IRIS;
    const referenceNo = this.generateReferenceNo();

    const record = await this.prisma.withdrawal.create({
      data: {
        referenceNo,
        provider,
        beneficiaryName: dto.beneficiaryName,
        bankCode: dto.bankCode,
        bankAccountNumber: dto.bankAccountNumber,
        amount: String(dto.amount),
        notes: dto.notes,
        status: 'pending',
        requestedBy: adminUserId,
      },
    });

    try {
      const result =
        provider === WithdrawalProvider.XENDIT
          ? ((await this.xenditPayout.createPayout({
              referenceId: referenceNo,
              channelCode: dto.bankCode,
              accountNumber: dto.bankAccountNumber,
              accountHolderName: dto.beneficiaryName,
              amount: dto.amount,
              description: dto.notes,
            })) as { status?: string } | null)
          : ((await this.iris.createPayout({
              referenceNo,
              beneficiaryName: dto.beneficiaryName,
              beneficiaryAccount: dto.bankAccountNumber,
              beneficiaryBank: dto.bankCode,
              amount: dto.amount,
              notes: dto.notes,
            })) as { status?: string } | null);

      return this.prisma.withdrawal.update({
        where: { id: record.id },
        data: {
          status: result?.status ?? 'submitted',
          submittedAt: new Date(),
        },
      });
    } catch (err) {
      // Request ke provider gagal (kredensial salah, saldo kurang, dll) -- catat
      // tetap di DB sebagai 'failed' supaya tidak hilang jejak percobaannya,
      // tapi lempar lagi errornya supaya admin tahu di response API.
      await this.prisma.withdrawal.update({
        where: { id: record.id },
        data: { status: 'failed', notes: `${dto.notes ?? ''}\n[error] ${(err as Error).message}`.trim() },
      });
      throw new BadRequestException(
        `Gagal membuat payout di ${provider}: ${(err as Error).message}`,
      );
    }
  }

  async listAll() {
    return this.prisma.withdrawal.findMany({ orderBy: { createdAt: 'desc' } });
  }

  // Tarik status terbaru dari Iris dan sinkronkan ke DB lokal -- status payout
  // bisa berubah di sisi Iris (menunggu approve, approved, completed, rejected)
  // tanpa ada notifikasi ke kita, jadi ini dipanggil manual saat admin mengecek.
  async refreshStatus(id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) throw new NotFoundException('Withdrawal tidak ditemukan');

    const result =
      withdrawal.provider === WithdrawalProvider.XENDIT
        ? ((await this.xenditPayout.getPayoutById(withdrawal.referenceNo)) as {
            status?: string;
          } | null)
        : ((await this.iris.getPayoutDetail(withdrawal.referenceNo)) as {
            status?: string;
          } | null);

    if (!result?.status) return withdrawal;

    return this.prisma.withdrawal.update({
      where: { id },
      data: { status: result.status, lastCheckedAt: new Date() },
    });
  }

  private generateReferenceNo(): string {
    const time = Date.now().toString(36).toUpperCase();
    const rand = randomBytes(3).toString('hex').toUpperCase();
    return `WD-${time}-${rand}`;
  }
}
