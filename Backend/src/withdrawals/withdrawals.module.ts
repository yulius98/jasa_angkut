import { Module } from '@nestjs/common';
import { WithdrawalsController } from './withdrawals.controller.js';
import { WithdrawalsService } from './withdrawals.service.js';
import { IrisClientService } from './iris.client.js';

@Module({
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService, IrisClientService],
})
export class WithdrawalsModule {}
