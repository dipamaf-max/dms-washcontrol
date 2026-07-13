import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InventoryCategory } from '@prisma/client';

export class CreateInventoryItemDto {
  @IsString()
  name: string;

  @IsEnum(InventoryCategory)
  category: InventoryCategory;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  alertThreshold?: number;

  @IsString()
  stationId: string;
}
