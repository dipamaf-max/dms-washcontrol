import { Injectable } from '@nestjs/common';
import { Role, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private stationsService: StationsService,
  ) {}

  async create(dto: CreateTransactionDto, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(dto.stationId, user, [Role.OWNER]);
    return this.prisma.transaction.create({ data: dto });
  }

  // Used internally when a wash order is paid/completed.
  async recordIncomeFromWashOrder(stationId: string, washOrderId: string, amount: number) {
    return this.prisma.transaction.create({
      data: {
        stationId,
        washOrderId,
        type: TransactionType.INCOME,
        category: 'Lavage',
        amount,
      },
    });
  }

  async findAllForStation(
    stationId: string,
    user: AuthenticatedUser,
    filters: { from?: string; to?: string; type?: TransactionType },
  ) {
    await this.stationsService.assertAccess(stationId, user);
    return this.prisma.transaction.findMany({
      where: {
        stationId,
        type: filters.type,
        date: {
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined,
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  private async report(stationId: string, from: Date, to: Date) {
    const transactions = await this.prisma.transaction.findMany({
      where: { stationId, date: { gte: from, lte: to } },
    });

    const income = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { income, expense, profit: income - expense, from, to };
  }

  async dailyReport(stationId: string, dateStr: string | undefined, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(stationId, user);
    const date = dateStr ? new Date(dateStr) : new Date();
    const from = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const to = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    return this.report(stationId, from, to);
  }

  async monthlyReport(
    stationId: string,
    year: number,
    month: number,
    user: AuthenticatedUser,
  ) {
    await this.stationsService.assertAccess(stationId, user);
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59, 999);
    return this.report(stationId, from, to);
  }
}
