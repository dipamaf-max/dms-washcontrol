import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private stationsService: StationsService,
  ) {}

  async create(dto: CreateEmployeeDto, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(dto.stationId, user, [Role.OWNER]);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          fullName: dto.fullName,
          role: Role.EMPLOYEE,
        },
      });

      return tx.employee.create({
        data: {
          userId: createdUser.id,
          stationId: dto.stationId,
          position: dto.position,
          commissionRate: dto.commissionRate ?? 0,
        },
        include: {
          user: { select: { id: true, email: true, fullName: true, phone: true } },
        },
      });
    });
  }

  async findAllForStation(stationId: string, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(stationId, user);
    return this.prisma.employee.findMany({
      where: { stationId },
      include: { user: { select: { id: true, email: true, fullName: true, phone: true } } },
      orderBy: { hiredAt: 'desc' },
    });
  }

  private async getEmployeeOrThrow(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Employé introuvable');
    return employee;
  }

  // Managers (ADMIN/OWNER) can act on any employee of their station; an EMPLOYEE can only act on themselves.
  private assertSelfOrManager(employee: { userId: string }, user: AuthenticatedUser) {
    if (user.role === Role.EMPLOYEE && employee.userId !== user.id) {
      throw new ForbiddenException("Vous ne pouvez agir que sur votre propre profil");
    }
  }

  async checkIn(id: string, user: AuthenticatedUser) {
    const employee = await this.getEmployeeOrThrow(id);
    await this.stationsService.assertAccess(employee.stationId, user);
    this.assertSelfOrManager(employee, user);
    return this.prisma.attendance.create({
      data: { employeeId: id, checkIn: new Date() },
    });
  }

  async checkOut(id: string, user: AuthenticatedUser) {
    const employee = await this.getEmployeeOrThrow(id);
    await this.stationsService.assertAccess(employee.stationId, user);
    this.assertSelfOrManager(employee, user);

    const lastOpen = await this.prisma.attendance.findFirst({
      where: { employeeId: id, checkOut: null },
      orderBy: { checkIn: 'desc' },
    });
    if (!lastOpen) throw new NotFoundException("Aucun pointage d'entrée ouvert");

    return this.prisma.attendance.update({
      where: { id: lastOpen.id },
      data: { checkOut: new Date() },
    });
  }

  async performance(id: string, user: AuthenticatedUser) {
    const employee = await this.getEmployeeOrThrow(id);
    await this.stationsService.assertAccess(employee.stationId, user);
    this.assertSelfOrManager(employee, user);

    const [washCount, revenueAgg] = await Promise.all([
      this.prisma.washOrder.count({ where: { employeeId: id, status: 'DONE' } }),
      this.prisma.washOrder.aggregate({
        where: { employeeId: id, status: 'DONE' },
        _sum: { price: true },
      }),
    ]);

    const revenue = Number(revenueAgg._sum.price ?? 0);
    const commission = (revenue * Number(employee.commissionRate)) / 100;

    return { washCount, revenue, commissionRate: employee.commissionRate, commission };
  }
}
