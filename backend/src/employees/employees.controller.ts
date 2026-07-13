import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Roles(Role.OWNER)
  @Post()
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.create(dto, user);
  }

  @Get()
  findAllForStation(
    @Query('stationId') stationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.employeesService.findAllForStation(stationId, user);
  }

  @Post(':id/attendance/check-in')
  checkIn(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.checkIn(id, user);
  }

  @Post(':id/attendance/check-out')
  checkOut(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.checkOut(id, user);
  }

  @Get(':id/performance')
  performance(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.performance(id, user);
  }
}
