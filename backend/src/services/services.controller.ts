import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.create(dto, user);
  }

  @Get()
  findAll(@Query('stationId') stationId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findAllForStation(stationId, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.servicesService.update(id, dto, user);
  }
}
