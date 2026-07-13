import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  plateNumber: string;

  @IsEnum(VehicleType)
  type: VehicleType;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsString()
  customerId: string;

  @IsString()
  stationId: string;
}
