import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { StationsModule } from '../stations/stations.module';

@Module({
  imports: [StationsModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
