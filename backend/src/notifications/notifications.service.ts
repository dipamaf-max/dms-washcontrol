import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from './firebase.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
  ) {}

  registerDeviceToken(dto: RegisterDeviceTokenDto, user: AuthenticatedUser) {
    return this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: { userId: user.id, platform: dto.platform },
      create: { token: dto.token, platform: dto.platform, userId: user.id },
    });
  }

  findAllForUser(user: AuthenticatedUser) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  markAsRead(id: string, user: AuthenticatedUser) {
    return this.prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
  }

  // Internal helper used by other modules (low stock, subscription expiry, new wash order...).
  async notifyUser(userId: string, title: string, message: string) {
    await this.prisma.notification.create({ data: { userId, title, message } });

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    await this.firebaseService.sendToTokens(
      tokens.map((t) => t.token),
      title,
      message,
    );
  }
}
