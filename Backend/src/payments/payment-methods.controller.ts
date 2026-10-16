import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';

/**
 * Endpoint publik (tanpa auth) supaya app pelanggan tahu metode pembayaran
 * mana yang sedang diizinkan admin (gateway online + boleh/tidaknya tunai).
 * Tidak ada data sensitif di sini -- hanya ringkasan setting.
 */
@Controller('payments')
export class PaymentMethodsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('methods')
  getMethods() {
    return this.payments.getPaymentMethodSettings();
  }
}
