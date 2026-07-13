import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { StationsModule } from '../stations/stations.module';

@Module({
  imports: [StationsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
