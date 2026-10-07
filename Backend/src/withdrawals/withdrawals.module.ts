import { Module } from '@nestjs/common';
import { WithdrawalsController } from './withdrawals.controller.js';
import { WithdrawalsService } from './withdrawals.service.js';
import { IrisClientService } from './iris.client.js';
import { XenditPayoutClientService } from './xendit-payout.client.js';

@Module({
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService, IrisClientService, XenditPayoutClientService],
})
export class WithdrawalsModule {}
