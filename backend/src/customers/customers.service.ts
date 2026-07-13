import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private stationsService: StationsService,
  ) {}

  async create(dto: CreateCustomerDto, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(dto.stationId, user);
    return this.prisma.customer.create({ data: dto });
  }

  async findAllForStation(stationId: string, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(stationId, user);
    return this.prisma.customer.findMany({
      where: { stationId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { washOrders: true, vehicles: true } } },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
        washOrders: { orderBy: { createdAt: 'desc' }, take: 20, include: { service: true } },
      },
    });
    if (!customer) throw new NotFoundException('Client introuvable');
    await this.stationsService.assertAccess(customer.stationId, user);
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, user: AuthenticatedUser) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Client introuvable');
    await this.stationsService.assertAccess(customer.stationId, user);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async addLoyaltyPoints(id: string, points: number) {
    return this.prisma.customer.update({
      where: { id },
      data: { loyaltyPoints: { increment: points } },
    });
  }
}
