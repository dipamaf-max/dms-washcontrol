import { Injectable } from '@nestjs/common';
import { TransactionType, WashOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private stationsService: StationsService,
  ) {}

  async getOverview(stationId: string, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(stationId, user);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [transactionsToday, vehiclesWashedToday, activeEmployees, topCustomers] =
      await Promise.all([
        this.prisma.transaction.findMany({
          where: { stationId, date: { gte: todayStart, lte: todayEnd } },
        }),
        this.prisma.washOrder.count({
          where: {
            stationId,
            status: { in: [WashOrderStatus.DONE, WashOrderStatus.DELIVERED] },
            finishedAt: { gte: todayStart, lte: todayEnd },
          },
        }),
        this.prisma.employee.count({ where: { stationId, isActive: true } }),
        this.prisma.customer.findMany({
          where: { stationId },
          orderBy: { loyaltyPoints: 'desc' },
          take: 5,
          include: { _count: { select: { washOrders: true } } },
        }),
      ]);

    const revenueToday = transactionsToday
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expensesToday = transactionsToday
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      revenueToday,
      expensesToday,
      profitToday: revenueToday - expensesToday,
      vehiclesWashedToday,
      activeEmployees,
      topCustomers: topCustomers.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        loyaltyPoints: c.loyaltyPoints,
        washCount: c._count.washOrders,
      })),
    };
  }
}
