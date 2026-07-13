import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { WashOrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { WashOrdersService } from './wash-orders.service';
import { CreateWashOrderDto } from './dto/create-wash-order.dto';
import { UpdateWashOrderStatusDto } from './dto/update-wash-order-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wash-orders')
export class WashOrdersController {
  constructor(private washOrdersService: WashOrdersService) {}

  @Post()
  create(@Body() dto: CreateWashOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.washOrdersService.create(dto, user);
  }

  @Get()
  findAll(
    @Query('stationId') stationId: string,
    @Query('status') status: WashOrderStatus,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.washOrdersService.findAllForStation(stationId, user, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.washOrdersService.findOne(id, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWashOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.washOrdersService.updateStatus(id, dto, user);
  }
}
