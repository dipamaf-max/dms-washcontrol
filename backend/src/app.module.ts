import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StationsModule } from './stations/stations.module';
import { EmployeesModule } from './employees/employees.module';
import { CustomersModule } from './customers/customers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ServicesModule } from './services/services.module';
import { WashOrdersModule } from './wash-orders/wash-orders.module';
import { TransactionsModule } from './transactions/transactions.module';
import { InventoryModule } from './inventory/inventory.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QrCodeModule } from './qrcode/qrcode.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOADS_DIR ?? 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StationsModule,
    EmployeesModule,
    CustomersModule,
    VehiclesModule,
    ServicesModule,
    WashOrdersModule,
    TransactionsModule,
    InventoryModule,
    SubscriptionsModule,
    NotificationsModule,
    DashboardModule,
    QrCodeModule,
    UploadsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
