import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  /**
   * Origin app tempat permintaan dibuat (mis. https://localhost:3002). Dipakai
   * untuk menautkan ke halaman /reset-password app yang benar. Hanya origin
   * aman (localhost atau https) yang dipakai; sisanya mengarah ke URL app yang
   * terdaftar di env.
   */
  @IsOptional()
  @IsString()
  appUrl?: string;
}
