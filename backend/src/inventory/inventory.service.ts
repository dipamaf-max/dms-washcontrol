import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryMovementType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private stationsService: StationsService,
  ) {}

  async create(dto: CreateInventoryItemDto, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(dto.stationId, user, [Role.OWNER]);
    return this.prisma.inventoryItem.create({
      data: {
        ...dto,
        quantity: dto.quantity ?? 0,
        alertThreshold: dto.alertThreshold ?? 0,
      },
    });
  }

  async findAllForStation(stationId: string, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(stationId, user);
    return this.prisma.inventoryItem.findMany({
      where: { stationId },
      orderBy: { name: 'asc' },
    });
  }

  async findLowStock(stationId: string, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(stationId, user);
    const items = await this.prisma.inventoryItem.findMany({ where: { stationId } });
    return items.filter((item) => Number(item.quantity) <= Number(item.alertThreshold));
  }

  private async getOrThrow(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Article introuvable');
    return item;
  }

  async addMovement(id: string, dto: CreateMovementDto, user: AuthenticatedUser) {
    const item = await this.getOrThrow(id);
    await this.stationsService.assertAccess(item.stationId, user);

    if (dto.type === InventoryMovementType.OUT && Number(item.quantity) < dto.quantity) {
      throw new BadRequestException('Stock insuffisant pour cette sortie');
    }

    const delta = dto.type === InventoryMovementType.IN ? dto.quantity : -dto.quantity;

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.inventoryMovement.create({
        data: { itemId: id, type: dto.type, quantity: dto.quantity, reason: dto.reason },
      });
      await tx.inventoryItem.update({
        where: { id },
        data: { quantity: { increment: delta } },
      });
      return movement;
    });
  }
}
