import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  /** Token dari link email (bukan hash; backend yang meng-hash saat lookup). */
  @IsString()
  @IsNotEmpty()
  token: string;

  // Sama dengan rule password saat register (MinLength 8).
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;
}
