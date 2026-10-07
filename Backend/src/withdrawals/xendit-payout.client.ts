import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Xendit } from 'xendit-node';

/**
 * Pembungkus Xendit Payout v3 API ("send money at scale to bank accounts &
 * e-wallets"), dipakai sebagai alternatif Iris untuk menarik saldo ke
 * rekening bisnis. Field dicocokkan terhadap tipe asli
 * xendit-node/payout/models/CreatePayoutRequest.d.ts dan
 * DigitalPayoutChannelProperties.d.ts.
 *
 * !! PERBEDAAN PENTING DARI IRIS (BACA SEBELUM DIPAKAI) !!
 * Berdasarkan tipe SDK ini, Payout v3 Xendit TIDAK punya langkah approve
 * terpisah seperti Iris (tidak ada method "approvePayout" di PayoutApi --
 * yang ada hanya create, getById, getChannels, getPayouts, cancelPayout).
 * Berarti begitu createPayout() dipanggil, dana KEMUNGKINAN BESAR langsung
 * diproses (cuma bisa dibatalkan SEBELUM terkirim lewat cancelPayout).
 * Artinya tindakan admin menekan tombol "buat withdrawal" di aplikasi kita
 * SENDIRI SUDAH menjadi persetujuan akhir untuk Xendit -- tidak ada
 * pemisahan Creator/Approver seperti di Midtrans Iris. Pertimbangkan ini
 * sebelum memakai provider XENDIT untuk withdrawal nilai besar.
 *
 * Juga BELUM diverifikasi: apakah Payout v3 butuh aktivasi akun terpisah
 * seperti Iris (dokumentasi publik yang sempat saya baca menyinggung soal
 * "account harus diaktifkan" untuk Payouts API, tanpa merinci caranya).
 */
@Injectable()
export class XenditPayoutClientService {
  private readonly client: Xendit;

  constructor(config: ConfigService) {
    const secretKey = config.getOrThrow<string>('XENDIT_SECRET_KEY');
    this.client = new Xendit({ secretKey });
  }

  async createPayout(params: {
    referenceId: string; // dipakai juga sebagai idempotency key
    channelCode: string; // kode channel bank/e-wallet Xendit, mis. "ID_BCA"
    accountNumber: string;
    accountHolderName: string;
    amount: number;
    description?: string;
  }): Promise<unknown> {
    return this.client.Payout.createPayout({
      idempotencyKey: params.referenceId,
      data: {
        referenceId: params.referenceId,
        channelCode: params.channelCode,
        channelProperties: {
          accountNumber: params.accountNumber,
          accountHolderName: params.accountHolderName,
        },
        amount: Math.round(params.amount),
        currency: 'IDR',
        description: params.description,
      },
    });
  }

  async getPayoutById(id: string): Promise<unknown> {
    return this.client.Payout.getPayoutById({ id });
  }
}
