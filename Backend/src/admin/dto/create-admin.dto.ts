import { IsEmail, IsIn, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../generated/prisma/enums.js';

export class CreateAdminDto {
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

  @IsIn([UserRole.ADMIN, UserRole.SUPER_ADMIN])
  role: UserRole;
}
