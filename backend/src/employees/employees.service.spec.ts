import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: {
    employee: Record<string, jest.Mock>;
    attendance: Record<string, jest.Mock>;
    washOrder: Record<string, jest.Mock>;
  };
  let stationsService: { assertAccess: jest.Mock };

  const owner: AuthenticatedUser = { id: 'owner-1', email: 'owner@x.com', role: Role.OWNER };
  const selfEmployee: AuthenticatedUser = {
    id: 'user-employee-1',
    email: 'emp1@x.com',
    role: Role.EMPLOYEE,
  };
  const otherEmployee: AuthenticatedUser = {
    id: 'user-employee-2',
    email: 'emp2@x.com',
    role: Role.EMPLOYEE,
  };

  const targetEmployee = { id: 'employee-1', stationId: 'station-1', userId: 'user-employee-1', commissionRate: 5 };

  beforeEach(() => {
    prisma = {
      employee: { findUnique: jest.fn().mockResolvedValue(targetEmployee) },
      attendance: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      washOrder: { count: jest.fn().mockResolvedValue(0), aggregate: jest.fn().mockResolvedValue({ _sum: { price: null } }) },
    };
    stationsService = { assertAccess: jest.fn().mockResolvedValue(undefined) };

    service = new EmployeesService(
      prisma as unknown as PrismaService,
      stationsService as unknown as StationsService,
    );
  });

  describe('checkIn', () => {
    it('allows an employee to check themselves in', async () => {
      prisma.attendance.create.mockResolvedValue({ id: 'att-1' });

      await expect(service.checkIn('employee-1', selfEmployee)).resolves.toEqual({ id: 'att-1' });
    });

    it('allows the OWNER to check in any employee of their station', async () => {
      prisma.attendance.create.mockResolvedValue({ id: 'att-1' });

      await expect(service.checkIn('employee-1', owner)).resolves.toEqual({ id: 'att-1' });
    });

    it("rejects an employee checking in a coworker's record", async () => {
      await expect(service.checkIn('employee-1', otherEmployee)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.attendance.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown employee', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.checkIn('missing', owner)).rejects.toThrow(NotFoundException);
    });
  });

  describe('performance', () => {
    it("rejects an employee viewing a coworker's performance", async () => {
      await expect(service.performance('employee-1', otherEmployee)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows an employee to view their own performance', async () => {
      await expect(service.performance('employee-1', selfEmployee)).resolves.toEqual(
        expect.objectContaining({ washCount: 0 }),
      );
    });

    it('allows the OWNER to view any employee performance in their station', async () => {
      await expect(service.performance('employee-1', owner)).resolves.toEqual(
        expect.objectContaining({ washCount: 0 }),
      );
    });
  });
});
