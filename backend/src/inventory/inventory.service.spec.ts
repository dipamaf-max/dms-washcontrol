import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryMovementType, Role } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: {
    inventoryItem: Record<string, jest.Mock>;
    inventoryMovement: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let stationsService: { assertAccess: jest.Mock };

  const owner: AuthenticatedUser = { id: 'owner-1', email: 'owner@x.com', role: Role.OWNER };

  beforeEach(() => {
    prisma = {
      inventoryItem: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      inventoryMovement: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback(prisma)),
    };
    stationsService = { assertAccess: jest.fn().mockResolvedValue(undefined) };

    service = new InventoryService(
      prisma as unknown as PrismaService,
      stationsService as unknown as StationsService,
    );
  });

  describe('addMovement', () => {
    it('increments quantity for an IN movement', async () => {
      prisma.inventoryItem.findUnique.mockResolvedValue({
        id: 'item-1',
        stationId: 'station-1',
        quantity: 10,
      });
      prisma.inventoryMovement.create.mockResolvedValue({ id: 'movement-1' });

      await service.addMovement('item-1', { type: InventoryMovementType.IN, quantity: 5 }, owner);

      expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { quantity: { increment: 5 } } }),
      );
    });

    it('rejects an OUT movement larger than the current stock', async () => {
      prisma.inventoryItem.findUnique.mockResolvedValue({
        id: 'item-1',
        stationId: 'station-1',
        quantity: 3,
      });

      await expect(
        service.addMovement('item-1', { type: InventoryMovementType.OUT, quantity: 5 }, owner),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.inventoryMovement.create).not.toHaveBeenCalled();
    });

    it('allows an OUT movement within the available stock', async () => {
      prisma.inventoryItem.findUnique.mockResolvedValue({
        id: 'item-1',
        stationId: 'station-1',
        quantity: 10,
      });
      prisma.inventoryMovement.create.mockResolvedValue({ id: 'movement-1' });

      await service.addMovement('item-1', { type: InventoryMovementType.OUT, quantity: 4 }, owner);

      expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { quantity: { increment: -4 } } }),
      );
    });

    it('throws NotFoundException for an unknown item', async () => {
      prisma.inventoryItem.findUnique.mockResolvedValue(null);

      await expect(
        service.addMovement('missing', { type: InventoryMovementType.IN, quantity: 1 }, owner),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLowStock', () => {
    it('returns only items at or below their alert threshold', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([
        { id: 'ok', quantity: 10, alertThreshold: 5 },
        { id: 'low', quantity: 2, alertThreshold: 5 },
        { id: 'exact', quantity: 5, alertThreshold: 5 },
      ]);

      const result = await service.findLowStock('station-1', owner);

      expect(result.map((i) => i.id)).toEqual(['low', 'exact']);
    });
  });
});
