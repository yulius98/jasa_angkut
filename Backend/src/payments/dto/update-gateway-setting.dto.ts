import { IsEnum } from 'class-validator';
import { PaymentGatewayMode } from '../payment-gateway-mode.js';

export class UpdateGatewaySettingDto {
  @IsEnum(PaymentGatewayMode)
  paymentGatewayMode: PaymentGatewayMode;
}
