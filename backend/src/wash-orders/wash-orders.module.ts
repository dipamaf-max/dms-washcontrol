import { Module } from '@nestjs/common';
import { WashOrdersService } from './wash-orders.service';
import { WashOrdersController } from './wash-orders.controller';
import { StationsModule } from '../stations/stations.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [StationsModule, TransactionsModule, CustomersModule],
  controllers: [WashOrdersController],
  providers: [WashOrdersService],
  exports: [WashOrdersService],
})
export class WashOrdersModule {}
