import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../payments.service.js';
import { verifyXenditCallbackToken } from '../xendit-signature.js';
import type {
  XenditInvoiceNotificationBody,
  XenditSessionNotificationBody,
} from '../dto/xendit-notification.dto.js';

// SENGAJA TIDAK ADA @UseGuards(JwtAuthGuard) -- sama alasannya dengan webhook
// Midtrans: ini dipanggil server Xendit, keasliannya dicek lewat header
// x-callback-token, bukan JWT.
@Controller('payments/webhooks/xendit')
export class XenditWebhookController {
  constructor(
    private payments: PaymentsService,
    private config: ConfigService,
  ) {}

  @Post()
  async handle(
    @Headers('x-callback-token') token: string,
    @Body() body: XenditInvoiceNotificationBody | XenditSessionNotificationBody,
  ) {
    const configuredToken = this.config.getOrThrow<string>('XENDIT_WEBHOOK_TOKEN');
    if (!verifyXenditCallbackToken(token, configuredToken)) {
      throw new UnauthorizedException('x-callback-token tidak valid');
    }

    // Payment Session (mode COMPONENTS) mengirim payload ber-`event`,
    // sedangkan Invoice API mengirim payload lama tanpa `event`. Keduanya
    // masuk ke URL webhook yang sama, jadi dipisah di sini.
    if ('event' in body && typeof (body as { event?: unknown }).event === 'string') {
      return this.payments.handleXenditSessionNotification(body as XenditSessionNotificationBody);
    }
    return this.payments.handleXenditNotification(body as XenditInvoiceNotificationBody);
  }
}
