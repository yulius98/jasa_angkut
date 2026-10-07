import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/enums.js';

export enum PaymentProvider {
  MIDTRANS = 'MIDTRANS',
  XENDIT = 'XENDIT',
}

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  // Default MIDTRANS kalau tidak diisi -- menjaga perilaku lama tetap sama
  // untuk client yang belum tahu soal pilihan provider ini.
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;
}
