import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { StationsModule } from '../stations/stations.module';
import { QrCodeModule } from '../qrcode/qrcode.module';

@Module({
  imports: [StationsModule, QrCodeModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
