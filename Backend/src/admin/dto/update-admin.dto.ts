import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { UserRole } from '../../generated/prisma/enums.js';

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Matches(/^(\+62|62|0)8[1-9]\d{7,11}$/, {
    message: 'Nomor telepon tidak valid',
  })
  phone?: string;

  @IsOptional()
  @IsIn([UserRole.ADMIN, UserRole.SUPER_ADMIN])
  role?: UserRole;
}
