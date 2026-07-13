import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private stationsService: StationsService,
  ) {}

  async create(dto: CreateServiceDto, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(dto.stationId, user, [Role.OWNER]);
    return this.prisma.service.create({ data: dto });
  }

  async findAllForStation(stationId: string, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(stationId, user);
    return this.prisma.service.findMany({ where: { stationId, isActive: true } });
  }

  async update(id: string, dto: UpdateServiceDto, user: AuthenticatedUser) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service introuvable');
    await this.stationsService.assertAccess(service.stationId, user, [Role.OWNER]);
    return this.prisma.service.update({ where: { id }, data: dto });
  }
}
