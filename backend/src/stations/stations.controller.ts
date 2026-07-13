import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stations')
export class StationsController {
  constructor(private stationsService: StationsService) {}

  @Roles(Role.ADMIN, Role.OWNER)
  @Post()
  create(@Body() dto: CreateStationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stationsService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.stationsService.findAllForUser(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.stationsService.findOne(id, user);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stationsService.update(id, dto, user);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.stationsService.remove(id, user);
  }
}
