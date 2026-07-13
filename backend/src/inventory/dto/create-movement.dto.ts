import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InventoryMovementType } from '@prisma/client';

export class CreateMovementDto {
  @IsEnum(InventoryMovementType)
  type: InventoryMovementType;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
