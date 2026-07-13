import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';

@Injectable()
export class StationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStationDto, user: AuthenticatedUser) {
    const ownerId = user.role === Role.ADMIN ? dto.ownerId ?? user.id : user.id;

    return this.prisma.station.create({
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        ownerId,
      },
    });
  }

  async findAllForUser(user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return this.prisma.station.findMany({ orderBy: { createdAt: 'desc' } });
    }

    if (user.role === Role.OWNER) {
      return this.prisma.station.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) return [];
    return this.prisma.station.findMany({ where: { id: employee.stationId } });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    await this.assertAccess(id, user);
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: { owner: { select: { id: true, fullName: true, email: true } } },
    });
    if (!station) throw new NotFoundException('Station introuvable');
    return station;
  }

  async update(id: string, dto: UpdateStationDto, user: AuthenticatedUser) {
    await this.assertAccess(id, user, [Role.ADMIN, Role.OWNER]);
    return this.prisma.station.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.assertAccess(id, user, [Role.ADMIN, Role.OWNER]);
    return this.prisma.station.delete({ where: { id } });
  }

  /**
   * Returns the list of station ids the user is allowed to operate on.
   * ADMIN -> null means "all stations" (no restriction).
   */
  async getAccessibleStationIds(user: AuthenticatedUser): Promise<string[] | null> {
    if (user.role === Role.ADMIN) return null;

    if (user.role === Role.OWNER) {
      const stations = await this.prisma.station.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });
      return stations.map((s) => s.id);
    }

    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
    return employee ? [employee.stationId] : [];
  }

  async assertAccess(stationId: string, user: AuthenticatedUser, allowedRoles?: Role[]) {
    if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== Role.ADMIN) {
      throw new ForbiddenException("Rôle non autorisé pour cette action");
    }

    const accessible = await this.getAccessibleStationIds(user);
    if (accessible === null) return; // ADMIN

    if (!accessible.includes(stationId)) {
      throw new ForbiddenException("Accès refusé à cette station");
    }
  }
}
