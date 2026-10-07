import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @ts-expect-error -- paket midtrans-client tidak menyertakan tipe TypeScript resmi
import midtransClient from 'midtrans-client';

export interface CreateSnapTransactionParams {
  orderNumber: string;
  grossAmount: number;
  customerName: string;
  customerPhone: string;
}

export interface SnapTransactionResult {
  token: string;
  redirectUrl: string;
}

/**
 * Pembungkus tipis di atas SDK midtrans-client, supaya PaymentsService tidak
 * bergantung langsung pada SDK pihak ketiga (gampang diganti/di-mock saat tes).
 */
@Injectable()
export class MidtransClientService {
  private readonly snap: {
    createTransaction: (payload: unknown) => Promise<{ token: string; redirect_url: string }>;
  };
  readonly serverKey: string;
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    this.serverKey = config.getOrThrow<string>('MIDTRANS_SERVER_KEY');
    this.isProduction = config.get('MIDTRANS_IS_PRODUCTION') === 'true';
    this.snap = new midtransClient.Snap({
      isProduction: this.isProduction,
      serverKey: this.serverKey,
      clientKey: config.get<string>('MIDTRANS_CLIENT_KEY'),
    });
  }

  /**
   * Mutasi saldo akun Midtrans dalam satu rentang waktu. Dipakai endpoint
   * admin/midtrans/balance -- TIDAK dipanggil lewat SDK midtrans-client karena
   * paket itu tidak membungkus Balance API, jadi di sini kita panggil langsung
   * lewat fetch dengan Basic Auth yang sama formatnya dengan panggilan Midtrans lain.
   */
  async getBalanceMutation(params: {
    startTime: Date;
    endTime: Date;
    currency?: string;
  }): Promise<unknown> {
    const base = this.isProduction
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';
    const qs = new URLSearchParams({
      currency: params.currency ?? 'IDR',
      start_time: params.startTime.toISOString(),
      end_time: params.endTime.toISOString(),
    });
    const auth = Buffer.from(`${this.serverKey}:`).toString('base64');

    const res = await fetch(`${base}/v1/balance/mutation?${qs.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new BadRequestException(`Midtrans balance API error (${res.status}): ${body}`);
    }
    return res.json();
  }

  async createSnapTransaction(params: CreateSnapTransactionParams): Promise<SnapTransactionResult> {
    const result = await this.snap.createTransaction({
      transaction_details: {
        order_id: params.orderNumber,
        gross_amount: Math.round(params.grossAmount),
      },
      customer_details: {
        first_name: params.customerName,
        phone: params.customerPhone,
      },
    });
    return { token: result.token, redirectUrl: result.redirect_url };
  }
}
