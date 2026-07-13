import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateMovementDto } from './dto/create-movement.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post()
  create(@Body() dto: CreateInventoryItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.create(dto, user);
  }

  @Get()
  findAll(@Query('stationId') stationId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.findAllForStation(stationId, user);
  }

  @Get('low-stock')
  findLowStock(@Query('stationId') stationId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.inventoryService.findLowStock(stationId, user);
  }

  @Post(':id/movements')
  addMovement(
    @Param('id') id: string,
    @Body() dto: CreateMovementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.addMovement(id, dto, user);
  }
}
