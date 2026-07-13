import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { QrCodeService } from '../qrcode/qrcode.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { AddPhotoDto } from './dto/add-photo.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private stationsService: StationsService,
    private qrCodeService: QrCodeService,
  ) {}

  async create(dto: CreateVehicleDto, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(dto.stationId, user);

    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer || customer.stationId !== dto.stationId) {
      throw new BadRequestException('Ce client n\'appartient pas à cette station');
    }

    return this.prisma.vehicle.create({ data: dto });
  }

  async findAllForStation(stationId: string, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(stationId, user);
    return this.prisma.vehicle.findMany({
      where: { stationId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOrThrow(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: true,
        photos: { orderBy: { createdAt: 'desc' } },
        washOrders: { orderBy: { createdAt: 'desc' }, take: 20, include: { service: true } },
      },
    });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable');
    return vehicle;
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const vehicle = await this.getOrThrow(id);
    await this.stationsService.assertAccess(vehicle.stationId, user);
    return vehicle;
  }

  async findByQrToken(token: string, user: AuthenticatedUser) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { qrCodeToken: token },
      include: {
        customer: true,
        washOrders: { orderBy: { createdAt: 'desc' }, take: 20, include: { service: true } },
      },
    });
    if (!vehicle) throw new NotFoundException('QR Code inconnu');
    await this.stationsService.assertAccess(vehicle.stationId, user);
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto, user: AuthenticatedUser) {
    const vehicle = await this.getOrThrow(id);
    await this.stationsService.assertAccess(vehicle.stationId, user);
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  async getQrCode(id: string, user: AuthenticatedUser) {
    const vehicle = await this.getOrThrow(id);
    await this.stationsService.assertAccess(vehicle.stationId, user);
    const dataUrl = await this.qrCodeService.generateDataUrl(vehicle.qrCodeToken);
    return { token: vehicle.qrCodeToken, qrCodeImage: dataUrl };
  }

  async addPhoto(id: string, dto: AddPhotoDto, user: AuthenticatedUser) {
    const vehicle = await this.getOrThrow(id);
    await this.stationsService.assertAccess(vehicle.stationId, user);
    return this.prisma.vehiclePhoto.create({
      data: {
        vehicleId: id,
        url: dto.url,
        stage: dto.stage,
        washOrderId: dto.washOrderId,
      },
    });
  }
}
