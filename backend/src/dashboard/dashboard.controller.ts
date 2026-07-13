import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@Query('stationId') stationId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getOverview(stationId, user);
  }
}
