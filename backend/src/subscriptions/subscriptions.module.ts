import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { GeniusPayWebhookController } from './geniuspay-webhook.controller';
import { MobileMoneyService } from './mobile-money.service';
import { StationsModule } from '../stations/stations.module';

@Module({
  imports: [StationsModule],
  controllers: [SubscriptionsController, GeniusPayWebhookController],
  providers: [SubscriptionsService, MobileMoneyService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
