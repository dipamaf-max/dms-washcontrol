import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';

class SetActiveDto {
  @IsBoolean()
  isActive: boolean;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.usersService.setActive(id, dto.isActive);
  }
}
