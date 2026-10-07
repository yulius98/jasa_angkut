import { Injectable } from '@nestjs/common';
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

  constructor(config: ConfigService) {
    const secretKey = config.getOrThrow<string>('XENDIT_SECRET_KEY');
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
