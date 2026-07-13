import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WashOrderStatus } from '@prisma/client';

export class UpdateWashOrderStatusDto {
  @IsEnum(WashOrderStatus)
  status: WashOrderStatus;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
