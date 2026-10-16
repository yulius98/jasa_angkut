import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Xendit } from 'xendit-node';

export interface CreateInvoiceParams {
  orderNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
}

export interface InvoiceResult {
  invoiceId: string;
  invoiceUrl: string;
}

// Xendit memakai host API yang sama untuk test & production -- mode ditentukan
// oleh secret key yang dipakai (xnd_development_... vs xnd_production_...).
const XENDIT_API_BASE = 'https://api.xendit.co';

export interface CreateComponentsSessionParams {
  /** reference_id sesi; kita isi dengan orderNumber agar webhook mudah dipetakan. */
  referenceId: string;
  amount: number;
  /** reference_id customer (wajib alfanumerik, unik). */
  customerRefId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  /** Origin app pelanggan, dipakai Xendit Components untuk validasi CORS. */
  origins: string[];
  /** URL kembali setelah pembayaran (wajib HTTPS bila diisi). */
  returnUrl?: string;
  /** Masa berlaku sesi. Bila kosong, Xendit memakai default 30 menit. */
  expiresAt?: Date;
}

export interface ComponentsSessionResult {
  paymentSessionId: string;
  componentsSdkKey: string;
  expiresAt: string | null;
  status: string;
}

/**
 * Pembungkus tipis di atas SDK resmi xendit-node (v7), method Invoice API.
 * Nama field di bawah ini (externalId, amount, payerEmail, description,
 * customer, invoiceUrl) dicocokkan langsung terhadap tipe TypeScript asli
 * yang disertakan paket xendit-node@7.0.0 itu sendiri
 * (node_modules/xendit-node/invoice/models/CreateInvoiceRequest.d.ts dan
 * Invoice.d.ts) -- bukan tebakan dari dokumentasi seperti iris.client.ts.
 * Tetap belum pernah dites memanggil server Xendit sungguhan.
 */
@Injectable()
export class XenditClientService {
  private readonly client: Xendit;
  private readonly secretKey: string;

  constructor(config: ConfigService) {
    const secretKey = config.getOrThrow<string>('XENDIT_SECRET_KEY');
    this.secretKey = secretKey;
    this.client = new Xendit({ secretKey });
  }

  async createInvoice(params: CreateInvoiceParams): Promise<InvoiceResult> {
    const result = await this.client.Invoice.createInvoice({
      data: {
        externalId: params.orderNumber,
        amount: Math.round(params.amount),
        payerEmail: params.customerEmail,
        description: `Pembayaran order ${params.orderNumber}`,
        customer: { givenNames: params.customerName },
      },
    });
    return { invoiceId: result.id ?? '', invoiceUrl: result.invoiceUrl };
  }

  /**
   * Buat Payment Session mode COMPONENTS (Xendit Components) supaya pembayaran
   * bisa di-embed langsung di app pelanggan tanpa redirect ke halaman Xendit.
   *
   * Dipanggil lewat HTTP mentah, BUKAN lewat SDK xendit-node@7, karena versi
   * yang terpasang belum membungkus endpoint Sessions
   * (POST https://api.xendit.co/sessions). Request/response dicocokkan dengan
   * dokumentasi resmi:
   * https://docs.xendit.co/docs/components-one-time-payment
   *
   * Yang dipakai app pelanggan dari balikan ini hanya `componentsSdkKey`
   * (kunci sesi berumur pendek untuk inisialisasi SDK di browser); sisanya
   * untuk logging/pemetaan webhook.
   */
  async createComponentsSession(
    params: CreateComponentsSessionParams,
  ): Promise<ComponentsSessionResult> {
    const payload = {
      reference_id: params.referenceId,
      session_type: 'PAY',
      mode: 'COMPONENTS',
      amount: Math.round(params.amount),
      currency: 'IDR',
      country: 'ID',
      customer: {
        reference_id: params.customerRefId,
        type: 'INDIVIDUAL',
        ...(params.customerEmail ? { email: params.customerEmail } : {}),
        ...(params.customerPhone ? { mobile_number: params.customerPhone } : {}),
        individual_detail: { given_names: params.customerName },
      },
      description: `Pembayaran order ${params.referenceId}`,
      ...(params.expiresAt ? { expires_at: params.expiresAt.toISOString() } : {}),
      components_configuration: {
        origins: params.origins,
        ...(params.returnUrl ? { return_url: params.returnUrl } : {}),
      },
    };

    const auth = Buffer.from(`${this.secretKey}:`).toString('base64');
    const res = await fetch(`${XENDIT_API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new BadRequestException(`Xendit session API error (${res.status}): ${body}`);
    }

    const json = (await res.json()) as {
      payment_session_id?: string;
      components_sdk_key?: string;
      expires_at?: string;
      status?: string;
    };

    if (!json.payment_session_id || !json.components_sdk_key) {
      throw new BadRequestException('Xendit tidak mengembalikan components_sdk_key');
    }

    return {
      paymentSessionId: json.payment_session_id,
      componentsSdkKey: json.components_sdk_key,
      expiresAt: json.expires_at ?? null,
      status: json.status ?? 'ACTIVE',
    };
  }

  /**
   * Saldo akun Xendit. Beda dari Balance Mutation API Midtrans -- ini TIDAK
   * perlu rentang waktu, langsung angka saldo saat ini. Diverifikasi terhadap
   * tipe asli xendit-node/balance_and_transaction/apis/Balance.d.ts.
   */
  async getBalance(): Promise<{ balance: number }> {
    return this.client.Balance.getBalance();
  }

  /**
   * History transaksi LANGSUNG dari Xendit (bukan dari database kita sendiri),
   * mencakup semua jenis transaksi (PAYMENT, DISBURSEMENT, REFUND, dst) --
   * beda dari pendekatan "pakai DB sendiri" yang dipakai untuk Midtrans,
   * karena endpoint ini bisa diakses dengan Secret Key yang sama, tanpa
   * onboarding tambahan seperti BI-SNAP di Midtrans.
   * Diverifikasi terhadap balance_and_transaction/apis/Transaction.d.ts.
   */
  async listTransactions(params: {
    limit?: number;
    afterId?: string;
    beforeId?: string;
  }): Promise<{ hasMore: boolean; data: unknown[] }> {
    return this.client.Transaction.getAllTransactions({
      limit: params.limit,
      afterId: params.afterId,
      beforeId: params.beforeId,
    });
  }
}
