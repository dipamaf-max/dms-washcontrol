import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { StationsService } from './stations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('StationsService', () => {
  let service: StationsService;
  let prisma: {
    station: Record<string, jest.Mock>;
    employee: Record<string, jest.Mock>;
  };

  const admin: AuthenticatedUser = { id: 'admin-1', email: 'admin@x.com', role: Role.ADMIN };
  const owner: AuthenticatedUser = { id: 'owner-1', email: 'owner@x.com', role: Role.OWNER };
  const employee: AuthenticatedUser = {
    id: 'employee-1',
    email: 'employee@x.com',
    role: Role.EMPLOYEE,
  };

  beforeEach(() => {
    prisma = {
      station: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      employee: {
        findUnique: jest.fn(),
      },
    };
    service = new StationsService(prisma as unknown as PrismaService);
  });

  describe('getAccessibleStationIds', () => {
    it('returns null for ADMIN (no restriction)', async () => {
      const result = await service.getAccessibleStationIds(admin);
      expect(result).toBeNull();
    });

    it('returns only stations owned by the OWNER', async () => {
      prisma.station.findMany.mockResolvedValue([{ id: 'station-1' }, { id: 'station-2' }]);

      const result = await service.getAccessibleStationIds(owner);

      expect(prisma.station.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId: owner.id } }),
      );
      expect(result).toEqual(['station-1', 'station-2']);
    });

    it("returns the EMPLOYEE's single assigned station", async () => {
      prisma.employee.findUnique.mockResolvedValue({ stationId: 'station-5' });

      const result = await service.getAccessibleStationIds(employee);

      expect(result).toEqual(['station-5']);
    });

    it('returns an empty array when the employee has no station assignment', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      const result = await service.getAccessibleStationIds(employee);

      expect(result).toEqual([]);
    });
  });

  describe('assertAccess', () => {
    it('allows ADMIN regardless of role restrictions', async () => {
      await expect(
        service.assertAccess('any-station', admin, [Role.OWNER]),
      ).resolves.toBeUndefined();
    });

    it('denies a role not included in allowedRoles', async () => {
      await expect(
        service.assertAccess('any-station', employee, [Role.OWNER]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows an OWNER to access their own station', async () => {
      prisma.station.findMany.mockResolvedValue([{ id: 'station-1' }]);

      await expect(
        service.assertAccess('station-1', owner, [Role.OWNER]),
      ).resolves.toBeUndefined();
    });

    it("denies an OWNER access to a station they don't own", async () => {
      prisma.station.findMany.mockResolvedValue([{ id: 'station-1' }]);

      await expect(
        service.assertAccess('station-2', owner, [Role.OWNER]),
      ).rejects.toThrow(ForbiddenException);
    });

    it("denies an EMPLOYEE access to a station other than their own", async () => {
      prisma.employee.findUnique.mockResolvedValue({ stationId: 'station-5' });

      await expect(service.assertAccess('station-9', employee)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('creates a station owned by the OWNER themselves', async () => {
      prisma.station.create.mockResolvedValue({ id: 'station-new' });

      await service.create({ name: 'N', address: 'A', phone: 'P' }, owner);

      expect(prisma.station.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ownerId: owner.id }) }),
      );
    });

    it('lets ADMIN create a station on behalf of a specific owner', async () => {
      prisma.station.create.mockResolvedValue({ id: 'station-new' });

      await service.create({ name: 'N', address: 'A', phone: 'P', ownerId: 'target-owner' }, admin);

      expect(prisma.station.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ownerId: 'target-owner' }) }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the station does not exist', async () => {
      prisma.station.findMany.mockResolvedValue([]);
      prisma.station.findUnique.mockResolvedValue(null);
      // ADMIN bypasses the ownership check, so we hit the not-found branch directly.
      await expect(service.findOne('missing', admin)).rejects.toThrow(NotFoundException);
    });
  });
});
