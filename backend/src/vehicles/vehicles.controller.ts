import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { AddPhotoDto } from './dto/add-photo.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Post()
  create(@Body() dto: CreateVehicleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.create(dto, user);
  }

  @Get()
  findAll(@Query('stationId') stationId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.findAllForStation(stationId, user);
  }

  @Get('qr/:token')
  findByQrToken(@Param('token') token: string, @CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.findByQrToken(token, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.findOne(id, user);
  }

  @Get(':id/qrcode')
  getQrCode(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.getQrCode(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vehiclesService.update(id, dto, user);
  }

  @Post(':id/photos')
  addPhoto(
    @Param('id') id: string,
    @Body() dto: AddPhotoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vehiclesService.addPhoto(id, dto, user);
  }
}
