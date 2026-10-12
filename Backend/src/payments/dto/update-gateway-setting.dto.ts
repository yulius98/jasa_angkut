import { IsEnum } from 'class-validator';
import { PaymentProvider } from './create-payment.dto.js';

export class UpdateGatewaySettingDto {
  @IsEnum(PaymentProvider)
  paymentGateway: PaymentProvider;
}
