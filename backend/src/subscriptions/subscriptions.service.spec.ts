import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PaymentProvider, Role, SubscriptionPlanType, SubscriptionStatus } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { StationsService } from '../stations/stations.service';
import { MobileMoneyService } from './mobile-money.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

const WEBHOOK_SECRET = 'whsec_test_secret';

function signPayload(payload: Record<string, any>, timestamp: string, secret = WEBHOOK_SECRET) {
  return createHmac('sha256', secret).update(`${timestamp}.${JSON.stringify(payload)}`).digest('hex');
}

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: {
    subscriptionPlan: Record<string, jest.Mock>;
    subscription: Record<string, jest.Mock>;
    payment: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
  };
  let stationsService: { assertAccess: jest.Mock };
  let mobileMoneyService: { initiatePayment: jest.Mock; checkStatus: jest.Mock };
  let config: { get: jest.Mock };

  const owner: AuthenticatedUser = { id: 'owner-1', email: 'owner@x.com', role: Role.OWNER };

  const plan = {
    id: 'plan-1',
    type: SubscriptionPlanType.STARTER,
    monthlyPrice: 10000,
  };

  beforeEach(() => {
    prisma = {
      subscriptionPlan: { findMany: jest.fn(), findUnique: jest.fn().mockResolvedValue(plan) },
      subscription: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      payment: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      user: { findUnique: jest.fn().mockResolvedValue({ fullName: 'Owner Test' }) },
    };
    stationsService = { assertAccess: jest.fn().mockResolvedValue(undefined) };
    mobileMoneyService = {
      initiatePayment: jest.fn(),
      checkStatus: jest.fn(),
    };
    config = { get: jest.fn((key: string) => (key === 'GENIUSPAY_WEBHOOK_SECRET' ? WEBHOOK_SECRET : undefined)) };

    service = new SubscriptionsService(
      prisma as unknown as PrismaService,
      stationsService as unknown as StationsService,
      mobileMoneyService as unknown as MobileMoneyService,
      config as unknown as ConfigService,
    );
  });

  describe('subscribe', () => {
    it('creates an UNPAID subscription when the payment stays PENDING', async () => {
      mobileMoneyService.initiatePayment.mockResolvedValue({
        providerReference: 'ref-1',
        paymentUrl: 'https://pay.genius.ci/checkout/xyz',
        status: 'PENDING',
      });
      prisma.subscription.create.mockResolvedValue({
        id: 'sub-1',
        status: SubscriptionStatus.UNPAID,
        plan,
        payments: [],
      });

      const result = await service.subscribe(
        {
          stationId: 'station-1',
          planType: SubscriptionPlanType.STARTER,
          provider: PaymentProvider.ORANGE_MONEY,
          payerPhone: '0555303380',
        },
        owner,
      );

      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SubscriptionStatus.UNPAID }),
        }),
      );
      expect(result.paymentUrl).toBe('https://pay.genius.ci/checkout/xyz');
    });

    it('creates an ACTIVE subscription immediately for CASH (SUCCESS) payments', async () => {
      mobileMoneyService.initiatePayment.mockResolvedValue({
        providerReference: 'CASH-ref',
        status: 'SUCCESS',
      });
      prisma.subscription.create.mockResolvedValue({
        id: 'sub-1',
        status: SubscriptionStatus.ACTIVE,
        plan,
        payments: [],
      });

      await service.subscribe(
        {
          stationId: 'station-1',
          planType: SubscriptionPlanType.STARTER,
          provider: PaymentProvider.CASH,
          payerPhone: '0555303380',
        },
        owner,
      );

      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
        }),
      );
    });

    it('throws NotFoundException for an unknown plan', async () => {
      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.subscribe(
          {
            stationId: 'station-1',
            planType: SubscriptionPlanType.PREMIUM,
            provider: PaymentProvider.WAVE,
            payerPhone: '0555303380',
          },
          owner,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("falls back to the user's account name when payerName is not provided", async () => {
      mobileMoneyService.initiatePayment.mockResolvedValue({
        providerReference: 'ref-1',
        status: 'PENDING',
      });
      prisma.subscription.create.mockResolvedValue({ id: 'sub-1', plan, payments: [] });

      await service.subscribe(
        {
          stationId: 'station-1',
          planType: SubscriptionPlanType.STARTER,
          provider: PaymentProvider.MTN_MONEY,
          payerPhone: '0555303380',
        },
        owner,
      );

      expect(mobileMoneyService.initiatePayment).toHaveBeenCalledWith(
        PaymentProvider.MTN_MONEY,
        10000,
        '0555303380',
        'Owner Test',
      );
    });
  });

  describe('confirmPayment', () => {
    it('activates the subscription and marks the payment SUCCESS', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        subscriptionId: 'sub-1',
        subscription: { stationId: 'station-1' },
      });
      prisma.subscription.update.mockResolvedValue({ id: 'sub-1', status: SubscriptionStatus.ACTIVE });

      await service.confirmPayment('payment-1', owner);

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'SUCCESS' } }),
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
        }),
      );
    });

    it('throws NotFoundException for an unknown payment', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(service.confirmPayment('missing', owner)).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleGeniusPayWebhook', () => {
    it('rejects a webhook with a missing signature', async () => {
      const result = await service.handleGeniusPayWebhook(
        { data: { reference: 'tok-1', status: 'completed' } },
        undefined,
        String(Math.floor(Date.now() / 1000)),
      );

      expect(result).toEqual({ received: false, reason: 'invalid_signature' });
      expect(prisma.payment.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a webhook with a wrong signature (tampered payload)', async () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = signPayload({ data: { reference: 'tok-1', status: 'completed' } }, timestamp);

      // Payload delivered differs from what was signed -> signature mismatch.
      const result = await service.handleGeniusPayWebhook(
        { data: { reference: 'tok-1', status: 'failed' } },
        signature,
        timestamp,
      );

      expect(result).toEqual({ received: false, reason: 'invalid_signature' });
    });

    it('rejects a replayed webhook with a stale timestamp', async () => {
      const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600); // 10 minutes old
      const payload = { data: { reference: 'tok-1', status: 'completed' } };
      const signature = signPayload(payload, staleTimestamp);

      const result = await service.handleGeniusPayWebhook(payload, signature, staleTimestamp);

      expect(result).toEqual({ received: false, reason: 'invalid_signature' });
    });

    it('does nothing when no matching payment is found', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      const timestamp = String(Math.floor(Date.now() / 1000));
      const payload = { data: { reference: 'unknown-ref', status: 'completed' } };
      const signature = signPayload(payload, timestamp);

      const result = await service.handleGeniusPayWebhook(payload, signature, timestamp);

      expect(result).toEqual({ received: true, matched: false });
    });

    it('is idempotent: skips a payment already marked SUCCESS', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: 'payment-1', status: 'SUCCESS' });
      const timestamp = String(Math.floor(Date.now() / 1000));
      const payload = { data: { reference: 'tok-1', status: 'completed' } };
      const signature = signPayload(payload, timestamp);

      const result = await service.handleGeniusPayWebhook(payload, signature, timestamp);

      expect(result).toEqual({ received: true, matched: false });
    });

    it('does not activate when the verified payload reports a non-completed status', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        subscriptionId: 'sub-1',
        status: 'PENDING',
      });
      const timestamp = String(Math.floor(Date.now() / 1000));
      const payload = { data: { reference: 'tok-1', status: 'failed' } };
      const signature = signPayload(payload, timestamp);

      const result = await service.handleGeniusPayWebhook(payload, signature, timestamp);

      expect(result).toEqual({ received: true, matched: true, verified: false });
      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });

    it('activates the subscription once the signature is valid and status is "completed"', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        subscriptionId: 'sub-1',
        status: 'PENDING',
      });
      const timestamp = String(Math.floor(Date.now() / 1000));
      const payload = { event: 'payment.success', data: { reference: 'tok-1', status: 'completed' } };
      const signature = signPayload(payload, timestamp);

      const result = await service.handleGeniusPayWebhook(payload, signature, timestamp);

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'payment-1' }, data: { status: 'SUCCESS' } }),
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
        }),
      );
      expect(result).toEqual({ received: true, matched: true, verified: true });
    });
  });

  describe('expireOutdatedSubscriptions', () => {
    it('marks overdue ACTIVE subscriptions as EXPIRED', async () => {
      await service.expireOutdatedSubscriptions();

      expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { status: SubscriptionStatus.ACTIVE, endDate: { lt: expect.any(Date) } },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    });
  });
});
