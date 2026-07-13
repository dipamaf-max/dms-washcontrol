import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role, WashOrderStatus } from '@prisma/client';
import { WashOrdersService } from './wash-orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CustomersService } from '../customers/customers.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('WashOrdersService', () => {
  let service: WashOrdersService;
  let prisma: {
    washOrder: Record<string, jest.Mock>;
    service: Record<string, jest.Mock>;
    customer: Record<string, jest.Mock>;
    vehicle: Record<string, jest.Mock>;
    employee: Record<string, jest.Mock>;
  };
  let stationsService: { assertAccess: jest.Mock };
  let transactionsService: { recordIncomeFromWashOrder: jest.Mock };
  let customersService: { addLoyaltyPoints: jest.Mock };

  const owner: AuthenticatedUser = { id: 'owner-1', email: 'owner@x.com', role: Role.OWNER };

  const baseWashOrder = {
    id: 'wash-1',
    stationId: 'station-1',
    customerId: 'customer-1',
    vehicleId: 'vehicle-1',
    serviceId: 'service-1',
    price: 5000,
    status: WashOrderStatus.PENDING,
    service: {},
    vehicle: {},
    customer: {},
  };

  beforeEach(() => {
    prisma = {
      washOrder: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      service: {
        findUnique: jest.fn(),
      },
      customer: {
        findUnique: jest.fn(),
      },
      vehicle: {
        findUnique: jest.fn(),
      },
      employee: {
        findUnique: jest.fn(),
      },
    };
    stationsService = { assertAccess: jest.fn().mockResolvedValue(undefined) };
    transactionsService = { recordIncomeFromWashOrder: jest.fn().mockResolvedValue(undefined) };
    customersService = { addLoyaltyPoints: jest.fn().mockResolvedValue(undefined) };

    service = new WashOrdersService(
      prisma as unknown as PrismaService,
      stationsService as unknown as StationsService,
      transactionsService as unknown as TransactionsService,
      customersService as unknown as CustomersService,
    );
  });

  describe('create', () => {
    beforeEach(() => {
      // Default: customer/vehicle/employee all belong to the target station.
      prisma.customer.findUnique.mockResolvedValue({ id: 'customer-1', stationId: 'station-1' });
      prisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1', stationId: 'station-1' });
      prisma.employee.findUnique.mockResolvedValue({ id: 'employee-1', stationId: 'station-1' });
    });

    it('creates a wash order priced from the selected service', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 'service-1', stationId: 'station-1', price: 5000 });
      prisma.washOrder.create.mockResolvedValue({ ...baseWashOrder });

      await service.create(
        { stationId: 'station-1', customerId: 'customer-1', vehicleId: 'vehicle-1', serviceId: 'service-1' },
        owner,
      );

      expect(prisma.washOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ price: 5000, status: WashOrderStatus.PENDING }),
        }),
      );
    });

    it('rejects a service that belongs to a different station', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 'service-1', stationId: 'other-station', price: 5000 });

      await expect(
        service.create(
          { stationId: 'station-1', customerId: 'customer-1', vehicleId: 'vehicle-1', serviceId: 'service-1' },
          owner,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a customer belonging to a different station (IDOR guard)', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 'service-1', stationId: 'station-1', price: 5000 });
      prisma.customer.findUnique.mockResolvedValue({ id: 'customer-1', stationId: 'other-station' });

      await expect(
        service.create(
          { stationId: 'station-1', customerId: 'customer-1', vehicleId: 'vehicle-1', serviceId: 'service-1' },
          owner,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.washOrder.create).not.toHaveBeenCalled();
    });

    it('rejects a vehicle belonging to a different station (IDOR guard)', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 'service-1', stationId: 'station-1', price: 5000 });
      prisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1', stationId: 'other-station' });

      await expect(
        service.create(
          { stationId: 'station-1', customerId: 'customer-1', vehicleId: 'vehicle-1', serviceId: 'service-1' },
          owner,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.washOrder.create).not.toHaveBeenCalled();
    });

    it('rejects an employee belonging to a different station (IDOR guard)', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 'service-1', stationId: 'station-1', price: 5000 });
      prisma.employee.findUnique.mockResolvedValue({ id: 'employee-1', stationId: 'other-station' });

      await expect(
        service.create(
          {
            stationId: 'station-1',
            customerId: 'customer-1',
            vehicleId: 'vehicle-1',
            serviceId: 'service-1',
            employeeId: 'employee-1',
          },
          owner,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.washOrder.create).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('allows PENDING -> IN_PROGRESS and stamps startedAt', async () => {
      prisma.washOrder.findUnique.mockResolvedValue({ ...baseWashOrder });
      prisma.washOrder.update.mockResolvedValue({
        ...baseWashOrder,
        status: WashOrderStatus.IN_PROGRESS,
      });

      await service.updateStatus('wash-1', { status: WashOrderStatus.IN_PROGRESS }, owner);

      expect(prisma.washOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: WashOrderStatus.IN_PROGRESS, startedAt: expect.any(Date) }),
        }),
      );
      expect(transactionsService.recordIncomeFromWashOrder).not.toHaveBeenCalled();
    });

    it('rejects skipping a step (PENDING -> DONE)', async () => {
      prisma.washOrder.findUnique.mockResolvedValue({ ...baseWashOrder });

      await expect(
        service.updateStatus('wash-1', { status: WashOrderStatus.DONE }, owner),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.washOrder.update).not.toHaveBeenCalled();
    });

    it('rejects moving backwards (DELIVERED -> PENDING)', async () => {
      prisma.washOrder.findUnique.mockResolvedValue({
        ...baseWashOrder,
        status: WashOrderStatus.DELIVERED,
      });

      await expect(
        service.updateStatus('wash-1', { status: WashOrderStatus.PENDING }, owner),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects assigning an employee from a different station (IDOR guard)', async () => {
      prisma.washOrder.findUnique.mockResolvedValue({ ...baseWashOrder });
      prisma.employee.findUnique.mockResolvedValue({ id: 'employee-9', stationId: 'other-station' });

      await expect(
        service.updateStatus(
          'wash-1',
          { status: WashOrderStatus.IN_PROGRESS, employeeId: 'employee-9' },
          owner,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.washOrder.update).not.toHaveBeenCalled();
    });

    it('records income and loyalty points when transitioning to DONE', async () => {
      prisma.washOrder.findUnique.mockResolvedValue({
        ...baseWashOrder,
        status: WashOrderStatus.IN_PROGRESS,
      });
      prisma.washOrder.update.mockResolvedValue({
        ...baseWashOrder,
        status: WashOrderStatus.DONE,
      });

      await service.updateStatus('wash-1', { status: WashOrderStatus.DONE }, owner);

      expect(transactionsService.recordIncomeFromWashOrder).toHaveBeenCalledWith(
        'station-1',
        'wash-1',
        5000,
      );
      expect(customersService.addLoyaltyPoints).toHaveBeenCalledWith('customer-1', 10);
    });

    it('does not double-record income when transitioning to DELIVERED', async () => {
      prisma.washOrder.findUnique.mockResolvedValue({
        ...baseWashOrder,
        status: WashOrderStatus.DONE,
      });
      prisma.washOrder.update.mockResolvedValue({
        ...baseWashOrder,
        status: WashOrderStatus.DELIVERED,
      });

      await service.updateStatus('wash-1', { status: WashOrderStatus.DELIVERED }, owner);

      expect(transactionsService.recordIncomeFromWashOrder).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown wash order', async () => {
      prisma.washOrder.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('missing', { status: WashOrderStatus.IN_PROGRESS }, owner),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
