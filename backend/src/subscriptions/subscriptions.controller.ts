import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  findPlans() {
    return this.subscriptionsService.findPlans();
  }

  @Get('current')
  getCurrent(@Query('stationId') stationId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getCurrent(stationId, user);
  }

  @Roles(Role.OWNER)
  @Post()
  subscribe(@Body() dto: SubscribeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.subscribe(dto, user);
  }

  @Roles(Role.OWNER)
  @Post('payments/:paymentId/confirm')
  confirmPayment(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.confirmPayment(paymentId, user);
  }
}
