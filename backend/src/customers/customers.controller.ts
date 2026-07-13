import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.customersService.create(dto, user);
  }

  @Get()
  findAll(@Query('stationId') stationId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.customersService.findAllForStation(stationId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.customersService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customersService.update(id, dto, user);
  }
}
