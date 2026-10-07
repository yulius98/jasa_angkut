import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export enum WithdrawalProvider {
  IRIS = 'IRIS',
  XENDIT = 'XENDIT',
}

export class CreateWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  beneficiaryName: string;

  // Formatnya BEDA tergantung provider:
  // - IRIS: kode bank biasa (BCA, BNI, MANDIRI, dst)
  // - XENDIT: channel code Xendit (format "ID_BCA", "ID_BNI", dst) --
  //   daftar lengkapnya lewat GET /payout_channels, belum diimplementasikan di sini
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  bankCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  bankAccountNumber: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;

  // Default IRIS kalau tidak diisi -- menjaga perilaku lama tetap sama.
  @IsOptional()
  @IsEnum(WithdrawalProvider)
  provider?: WithdrawalProvider;
}
