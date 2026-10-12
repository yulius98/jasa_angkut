import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { UserRole } from '../../generated/prisma/enums.js';

export class ListAdminsQuery {
  // Cari berdasarkan nama, email, atau nomor telepon.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  // Saring berdasarkan role admin-level saja.
  @IsOptional()
  @IsIn([UserRole.ADMIN, UserRole.SUPER_ADMIN])
  role?: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
