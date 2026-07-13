import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  create(@Body() dto: CreateTransactionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.create(dto, user);
  }

  @Get()
  findAll(
    @Query('stationId') stationId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('type') type: TransactionType,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.findAllForStation(stationId, user, { from, to, type });
  }

  @Get('reports/daily')
  dailyReport(
    @Query('stationId') stationId: string,
    @Query('date') date: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.dailyReport(stationId, date, user);
  }

  @Get('reports/monthly')
  monthlyReport(
    @Query('stationId') stationId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.monthlyReport(
      stationId,
      parseInt(year, 10),
      parseInt(month, 10),
      user,
    );
  }
}
