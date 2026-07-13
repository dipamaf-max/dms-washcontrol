import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentProvider, SubscriptionPlanType } from '@prisma/client';

export class SubscribeDto {
  @IsString()
  stationId: string;

  @IsEnum(SubscriptionPlanType)
  planType: SubscriptionPlanType;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsString()
  payerPhone: string;

  @IsOptional()
  @IsString()
  payerName?: string;
}
