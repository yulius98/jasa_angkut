import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  beneficiaryName: string;

  // Kode bank sesuai daftar bank yang didukung Iris (BCA, BNI, MANDIRI, dst).
  // Daftar lengkapnya hanya ada di dokumentasi resmi, belum divalidasi di sini.
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
}
