import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface MobileMoneyInitResult {
  providerReference: string;
  paymentUrl?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

const GENIUSPAY_BASE_URL = 'https://geniuspay.ci/api/v1/merchant';

const PAYMENT_METHOD_MAP: Partial<Record<PaymentProvider, string>> = {
  [PaymentProvider.ORANGE_MONEY]: 'orange_money',
  [PaymentProvider.WAVE]: 'wave',
  [PaymentProvider.MTN_MONEY]: 'mtn_money',
  [PaymentProvider.MOOV_MONEY]: 'moov_money',
};

/**
 * Integration point for Orange Money / MTN / Moov / Wave, routed through the
 * GeniusPay aggregator (https://geniuspay.ci/docs/api) so a single merchant account
 * covers all operators instead of separate deals with each telco.
 *
 * Requires GENIUSPAY_API_KEY + GENIUSPAY_API_SECRET (from your GeniusPay dashboard).
 * Without them, payments fall back to a simulated PENDING reference so the rest
 * of the app keeps working.
 */
@Injectable()
export class MobileMoneyService {
  private readonly logger = new Logger(MobileMoneyService.name);

  constructor(private config: ConfigService) {}

  private authHeaders(): Record<string, string> | null {
    const apiKey = this.config.get<string>('GENIUSPAY_API_KEY');
    const apiSecret = this.config.get<string>('GENIUSPAY_API_SECRET');
    if (!apiKey || !apiSecret) return null;

    return {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret,
    };
  }

  async initiatePayment(
    provider: PaymentProvider,
    amount: number,
    payerPhone: string,
    payerName: string,
  ): Promise<MobileMoneyInitResult> {
    if (provider === PaymentProvider.CASH) {
      return { providerReference: `CASH-${randomUUID()}`, status: 'SUCCESS' };
    }

    const headers = this.authHeaders();
    if (!headers) {
      this.logger.warn('GENIUSPAY_API_KEY/SECRET non configurés - paiement simulé');
      return { providerReference: `${provider}-${randomUUID()}`, status: 'PENDING' };
    }

    try {
      const response = await fetch(`${GENIUSPAY_BASE_URL}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount,
          payment_method: PAYMENT_METHOD_MAP[provider],
          customer: { phone: payerPhone, country: 'CI' },
          description: `Abonnement DMS WashControl - ${payerName}`,
        }),
      });
      const body = await response.json();

      if (!response.ok || !body?.success) {
        throw new Error(body?.detail ?? body?.message ?? `Échec GeniusPay (HTTP ${response.status})`);
      }

      return {
        providerReference: body.data.reference,
        paymentUrl: body.data.checkout_url,
        status: 'PENDING',
      };
    } catch (error) {
      this.logger.error("Échec de l'initiation du paiement GeniusPay", error as Error);
      return { providerReference: `${provider}-${randomUUID()}`, status: 'FAILED' };
    }
  }

  // Used as a fallback when no webhook is reachable (e.g. local dev): polls GeniusPay directly.
  async checkStatus(reference: string): Promise<'PENDING' | 'SUCCESS' | 'FAILED'> {
    const headers = this.authHeaders();
    if (!headers) return 'PENDING';

    try {
      const response = await fetch(`${GENIUSPAY_BASE_URL}/payments/${reference}`, { headers });
      const body = await response.json();
      const status = body?.data?.status;

      if (status === 'completed') return 'SUCCESS';
      if (status === 'pending' || status === 'processing') return 'PENDING';
      return 'FAILED';
    } catch (error) {
      this.logger.error('Échec de la vérification du statut GeniusPay', error as Error);
      return 'FAILED';
    }
  }
}
