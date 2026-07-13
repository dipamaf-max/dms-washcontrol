import { IsOptional, IsString } from 'class-validator';

export class CreateWashOrderDto {
  @IsString()
  stationId: string;

  @IsString()
  customerId: string;

  @IsString()
  vehicleId: string;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
