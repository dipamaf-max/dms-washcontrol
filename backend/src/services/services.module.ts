import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { StationsModule } from '../stations/stations.module';

@Module({
  imports: [StationsModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
