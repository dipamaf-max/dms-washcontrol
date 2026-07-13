import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SAFE_SELECT = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  isActive: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async setActive(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: SAFE_SELECT,
    });
  }
}
