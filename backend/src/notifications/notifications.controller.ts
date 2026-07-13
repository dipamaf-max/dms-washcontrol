import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('device-tokens')
  registerDeviceToken(
    @Body() dto: RegisterDeviceTokenDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.registerDeviceToken(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findAllForUser(user);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAsRead(id, user);
  }
}
