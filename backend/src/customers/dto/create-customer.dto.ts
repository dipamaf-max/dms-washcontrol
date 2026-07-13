import { IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsString()
  stationId: string;
}
