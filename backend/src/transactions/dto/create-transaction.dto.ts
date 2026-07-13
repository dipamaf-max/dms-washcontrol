import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  stationId: string;
}
