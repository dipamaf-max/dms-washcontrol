import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { StationsModule } from '../stations/stations.module';

@Module({
  imports: [StationsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
