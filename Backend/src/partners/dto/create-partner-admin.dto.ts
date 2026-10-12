import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VehicleType } from '../../generated/prisma/enums.js';

// Dipakai admin untuk membuat akun partner sekaligus (role PARTNER, langsung
// APPROVED) beserta 1 kendaraan. Request berupa multipart/form-data sehingga
// seluruh field datang sebagai string dan perlu ditransformasi.
export class CreatePartnerAdminDto {
  // --- akun ---
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @Matches(/^(\+62|62|0)8[1-9]\d{7,11}$/, {
    message: 'Nomor telepon tidak valid',
  })
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  // --- identitas ---
  @Matches(/^\d{16}$/, { message: 'Nomor KTP harus 16 digit angka' })
  ktpNumber: string;

  @Matches(/^\d{12,14}$/, { message: 'Nomor SIM harus 12-14 digit angka' })
  simNumber: string;

  // --- kendaraan ---
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  // Dinormalisasi: spasi dibuang, huruf besar. "b 1234 xyz" -> "B1234XYZ"
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value,
  )
  @Matches(/^[A-Z]{1,2}\d{1,4}[A-Z]{0,3}$/, {
    message: 'Format plat nomor tidak valid',
  })
  plateNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  brand: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  model: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99999)
  maxWeightKg: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(999)
  maxVolumeM3: number;
}
