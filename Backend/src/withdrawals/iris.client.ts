import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Pembungkus tipis untuk Midtrans Payouts (dulu disebut Iris) API.
 *
 * !! BELUM PERNAH DIPANGGIL KE SERVER SUNGGUHAN !!
 * Akun Iris TIDAK bisa didaftarkan sendiri lewat dashboard Sandbox biasa --
 * harus menghubungi tim aktivasi Midtrans dulu (lihat https://midtrans.com/contact-us)
 * untuk mendapat IRIS_API_KEY. Karena saya tidak punya kredensial itu, nama field
 * di body request/response di bawah ini disusun dari dokumentasi publik Iris
 * (https://iris-docs.midtrans.com) yang sempat berubah struktur halamannya saat
 * saya baca, BUKAN dari pengujian langsung. WAJIB diverifikasi ulang terhadap
 * dokumentasi API Reference resmi begitu kredensial Iris sudah didapat, sebelum
 * dipakai dengan uang sungguhan.
 *
 * Referensi dasar (per dokumentasi publik):
 * - Base URL sandbox : https://iris.sandbox.midtrans.com
 * - Base URL production: https://app.midtrans.com/iris
 * - Auth: HTTP Basic, API Key Iris sebagai username, password kosong
 *   (pola sama seperti Server Key Core API, TAPI key-nya BEDA, bukan MIDTRANS_SERVER_KEY)
 * - POST /api/v1/beneficiaries  -- daftarkan rekening tujuan
 * - POST /api/v1/payouts        -- buat payout (role: Creator)
 * - POST /api/v1/payouts/approve -- setujui payout (role: Approver, SENGAJA
 *   TIDAK dipanggil otomatis dari sini -- lihat catatan keamanan di withdrawals.service.ts)
 * - GET  /api/v1/payouts/{reference_no} -- cek status satu payout
 */
@Injectable()
export class IrisClientService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('IRIS_API_KEY');
    this.baseUrl =
      config.get('IRIS_IS_PRODUCTION') === 'true'
        ? 'https://app.midtrans.com/iris'
        : 'https://iris.sandbox.midtrans.com';
  }

  async createBeneficiary(params: {
    name: string;
    account: string;
    bank: string;
    aliasName: string;
    email?: string;
  }): Promise<unknown> {
    return this.request('POST', '/api/v1/beneficiaries', {
      name: params.name,
      account: params.account,
      bank: params.bank,
      alias_name: params.aliasName,
      email: params.email,
    });
  }

  async listBeneficiaries(): Promise<unknown> {
    return this.request('GET', '/api/v1/beneficiaries');
  }

  // referenceNo WAJIB unik di sisi kita -- dipakai Iris untuk mencegah payout
  // terkirim dobel kalau request accidentally diulang (idempotency key).
  async createPayout(params: {
    referenceNo: string;
    beneficiaryName: string;
    beneficiaryAccount: string;
    beneficiaryBank: string;
    amount: number;
    notes?: string;
  }): Promise<unknown> {
    return this.request('POST', '/api/v1/payouts', {
      payouts: [
        {
          beneficiary_name: params.beneficiaryName,
          beneficiary_account: params.beneficiaryAccount,
          beneficiary_bank: params.beneficiaryBank,
          amount: String(Math.round(params.amount)),
          notes: params.notes ?? 'Penarikan saldo ke rekening perusahaan',
          reference_no: params.referenceNo,
        },
      ],
    });
  }

  async getPayoutDetail(referenceNo: string): Promise<unknown> {
    return this.request('GET', `/api/v1/payouts/${encodeURIComponent(referenceNo)}`);
  }

  private async request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64');
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new BadRequestException(`Iris API error (${res.status}): ${text}`);
    }
    return text ? JSON.parse(text) : null;
  }
}
