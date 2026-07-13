import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { StationsModule } from '../stations/stations.module';

@Module({
  imports: [StationsModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
