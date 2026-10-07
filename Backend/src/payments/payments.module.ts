import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { MidtransWebhookController } from './webhooks/midtrans.webhook.controller.js';
import { XenditWebhookController } from './webhooks/xendit.webhook.controller.js';
import { PaymentsService } from './payments.service.js';
import { MidtransClientService } from './midtrans.client.js';
import { XenditClientService } from './xendit.client.js';

@Module({
  controllers: [PaymentsController, MidtransWebhookController, XenditWebhookController],
  providers: [PaymentsService, MidtransClientService, XenditClientService],
  exports: [PaymentsService, MidtransClientService, XenditClientService],
})
export class PaymentsModule {}
