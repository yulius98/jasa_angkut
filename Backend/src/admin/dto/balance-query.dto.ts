import { IsDateString, IsOptional, IsString } from 'class-validator';

export class BalanceQueryDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
