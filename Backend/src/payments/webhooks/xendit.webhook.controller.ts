import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../payments.service.js';
import { verifyXenditCallbackToken } from '../xendit-signature.js';
import type { XenditInvoiceNotificationBody } from '../dto/xendit-notification.dto.js';

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
    @Body() body: XenditInvoiceNotificationBody,
  ) {
    const configuredToken = this.config.getOrThrow<string>('XENDIT_WEBHOOK_TOKEN');
    if (!verifyXenditCallbackToken(token, configuredToken)) {
      throw new UnauthorizedException('x-callback-token tidak valid');
    }
    return this.payments.handleXenditNotification(body);
  }
}
