import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchAddressQuery {
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  address: string;
}
