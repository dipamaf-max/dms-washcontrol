import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WashOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CustomersService } from '../customers/customers.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateWashOrderDto } from './dto/create-wash-order.dto';
import { UpdateWashOrderStatusDto } from './dto/update-wash-order-status.dto';

const ALLOWED_TRANSITIONS: Record<WashOrderStatus, WashOrderStatus[]> = {
  PENDING: [WashOrderStatus.IN_PROGRESS],
  IN_PROGRESS: [WashOrderStatus.DONE],
  DONE: [WashOrderStatus.DELIVERED],
  DELIVERED: [],
};

const LOYALTY_POINTS_PER_WASH = 10;

@Injectable()
export class WashOrdersService {
  constructor(
    private prisma: PrismaService,
    private stationsService: StationsService,
    private transactionsService: TransactionsService,
    private customersService: CustomersService,
  ) {}

  async create(dto: CreateWashOrderDto, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(dto.stationId, user);

    const [service, customer, vehicle, employee] = await Promise.all([
      this.prisma.service.findUnique({ where: { id: dto.serviceId } }),
      this.prisma.customer.findUnique({ where: { id: dto.customerId } }),
      this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } }),
      dto.employeeId
        ? this.prisma.employee.findUnique({ where: { id: dto.employeeId } })
        : Promise.resolve(null),
    ]);

    if (!service || service.stationId !== dto.stationId) {
      throw new BadRequestException("Ce service n'appartient pas à cette station");
    }
    if (!customer || customer.stationId !== dto.stationId) {
      throw new BadRequestException("Ce client n'appartient pas à cette station");
    }
    if (!vehicle || vehicle.stationId !== dto.stationId) {
      throw new BadRequestException("Ce véhicule n'appartient pas à cette station");
    }
    if (dto.employeeId && (!employee || employee.stationId !== dto.stationId)) {
      throw new BadRequestException("Cet employé n'appartient pas à cette station");
    }

    return this.prisma.washOrder.create({
      data: {
        stationId: dto.stationId,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        serviceId: dto.serviceId,
        employeeId: dto.employeeId,
        price: service.price,
        status: WashOrderStatus.PENDING,
      },
      include: { service: true, vehicle: true, customer: true },
    });
  }

  async findAllForStation(
    stationId: string,
    user: AuthenticatedUser,
    status?: WashOrderStatus,
  ) {
    await this.stationsService.assertAccess(stationId, user);
    return this.prisma.washOrder.findMany({
      where: { stationId, status },
      include: { service: true, vehicle: true, customer: true, employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOrThrow(id: string) {
    const washOrder = await this.prisma.washOrder.findUnique({
      where: { id },
      include: { service: true, vehicle: true, customer: true },
    });
    if (!washOrder) throw new NotFoundException('Commande de lavage introuvable');
    return washOrder;
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const washOrder = await this.getOrThrow(id);
    await this.stationsService.assertAccess(washOrder.stationId, user);
    return washOrder;
  }

  async updateStatus(id: string, dto: UpdateWashOrderStatusDto, user: AuthenticatedUser) {
    const washOrder = await this.getOrThrow(id);
    await this.stationsService.assertAccess(washOrder.stationId, user);

    const allowedNext = ALLOWED_TRANSITIONS[washOrder.status];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Transition invalide: ${washOrder.status} -> ${dto.status}`,
      );
    }

    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
      if (!employee || employee.stationId !== washOrder.stationId) {
        throw new BadRequestException("Cet employé n'appartient pas à cette station");
      }
    }

    const now = new Date();
    const data: Record<string, unknown> = { status: dto.status };
    if (dto.employeeId) data.employeeId = dto.employeeId;

    if (dto.status === WashOrderStatus.IN_PROGRESS) data.startedAt = now;
    if (dto.status === WashOrderStatus.DONE) data.finishedAt = now;
    if (dto.status === WashOrderStatus.DELIVERED) data.deliveredAt = now;

    const updated = await this.prisma.washOrder.update({
      where: { id },
      data,
      include: { service: true, vehicle: true, customer: true },
    });

    if (dto.status === WashOrderStatus.DONE) {
      await this.transactionsService.recordIncomeFromWashOrder(
        updated.stationId,
        updated.id,
        Number(updated.price),
      );
      await this.customersService.addLoyaltyPoints(updated.customerId, LOYALTY_POINTS_PER_WASH);
    }

    return updated;
  }
}
