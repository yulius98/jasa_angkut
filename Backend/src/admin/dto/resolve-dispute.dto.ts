import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class ResolveDisputeDto {
  @IsIn(['resolved', 'rejected'])
  outcome: 'resolved' | 'rejected';

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  resolution: string;
}
