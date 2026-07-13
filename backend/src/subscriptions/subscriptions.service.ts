import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, SubscriptionStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { MobileMoneyService } from './mobile-money.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { SubscribeDto } from './dto/subscribe.dto';

const SUBSCRIPTION_DURATION_DAYS = 30;
const WEBHOOK_MAX_AGE_SECONDS = 5 * 60;

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private stationsService: StationsService,
    private mobileMoneyService: MobileMoneyService,
    private config: ConfigService,
  ) {}

  findPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: { monthlyPrice: 'asc' } });
  }

  async getCurrent(stationId: string, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(stationId, user);
    return this.prisma.subscription.findFirst({
      where: { stationId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true, payments: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async subscribe(dto: SubscribeDto, user: AuthenticatedUser) {
    await this.stationsService.assertAccess(dto.stationId, user, [Role.OWNER]);

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { type: dto.planType },
    });
    if (!plan) throw new NotFoundException('Plan introuvable');

    const payerName =
      dto.payerName ?? (await this.prisma.user.findUnique({ where: { id: user.id } }))?.fullName ?? user.email;

    const paymentInit = await this.mobileMoneyService.initiatePayment(
      dto.provider,
      Number(plan.monthlyPrice),
      dto.payerPhone,
      payerName,
    );

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + SUBSCRIPTION_DURATION_DAYS);

    const subscription = await this.prisma.subscription.create({
      data: {
        stationId: dto.stationId,
        planId: plan.id,
        status:
          paymentInit.status === 'SUCCESS' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.UNPAID,
        endDate,
        payments: {
          create: {
            amount: plan.monthlyPrice,
            provider: dto.provider,
            status: paymentInit.status,
            providerReference: paymentInit.providerReference,
          },
        },
      },
      include: { plan: true, payments: true },
    });

    return { ...subscription, paymentUrl: paymentInit.paymentUrl };
  }

  // Simulates the mobile money provider webhook confirming the payment.
  async confirmPayment(paymentId: string, user: AuthenticatedUser) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });
    if (!payment) throw new NotFoundException('Paiement introuvable');
    await this.stationsService.assertAccess(payment.subscription.stationId, user, [Role.OWNER]);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + SUBSCRIPTION_DURATION_DAYS);

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCESS' },
    });

    return this.prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: SubscriptionStatus.ACTIVE, endDate },
      include: { plan: true, payments: true },
    });
  }

  // Public webhook target for GeniusPay (see docs/GENIUSPAY_INTEGRATION.md). Authenticity is
  // enforced cryptographically via HMAC-SHA256 signature (GENIUSPAY_WEBHOOK_SECRET) plus a
  // timestamp freshness check to prevent replay attacks — only once the signature verifies do
  // we trust the payload's reported status.
  verifyGeniusPaySignature(
    rawBody: Record<string, any>,
    signature: string | undefined,
    timestamp: string | undefined,
  ): boolean {
    const secret = this.config.get<string>('GENIUSPAY_WEBHOOK_SECRET');
    if (!secret || !signature || !timestamp) return false;

    const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(ageSeconds) || ageSeconds > WEBHOOK_MAX_AGE_SECONDS) {
      this.logger.warn('Webhook GeniusPay rejeté: timestamp trop ancien (rejeu potentiel)');
      return false;
    }

    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${JSON.stringify(rawBody)}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(signature, 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;

    return timingSafeEqual(expectedBuf, receivedBuf);
  }

  async handleGeniusPayWebhook(
    payload: Record<string, any>,
    signature: string | undefined,
    timestamp: string | undefined,
  ) {
    if (!this.verifyGeniusPaySignature(payload, signature, timestamp)) {
      return { received: false, reason: 'invalid_signature' as const };
    }

    const reference: string | undefined = payload?.data?.reference;
    const status: string | undefined = payload?.data?.status;
    if (!reference) return { received: true, matched: false };

    const payment = await this.prisma.payment.findFirst({
      where: { providerReference: reference },
    });
    if (!payment || payment.status === 'SUCCESS') return { received: true, matched: false };

    if (status !== 'completed') return { received: true, matched: true, verified: false };

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + SUBSCRIPTION_DURATION_DAYS);

    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS' } });
    await this.prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: SubscriptionStatus.ACTIVE, endDate },
    });

    return { received: true, matched: true, verified: true };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOutdatedSubscriptions() {
    await this.prisma.subscription.updateMany({
      where: { status: SubscriptionStatus.ACTIVE, endDate: { lt: new Date() } },
      data: { status: SubscriptionStatus.EXPIRED },
    });
  }
}
