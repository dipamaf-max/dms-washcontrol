import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

// Deliberately has no auth guards: GeniusPay calls this directly (see
// docs/GENIUSPAY_INTEGRATION.md). Authenticity is enforced cryptographically via the
// X-Webhook-Signature (HMAC-SHA256) and X-Webhook-Timestamp headers, verified in
// SubscriptionsService.handleGeniusPayWebhook — the reported payment status is only
// trusted once the signature checks out.
@Controller('webhooks/geniuspay')
export class GeniusPayWebhookController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  async handle(
    @Body() payload: Record<string, unknown>,
    @Headers('x-webhook-signature') signature: string | undefined,
    @Headers('x-webhook-timestamp') timestamp: string | undefined,
  ) {
    const result = await this.subscriptionsService.handleGeniusPayWebhook(
      payload,
      signature,
      timestamp,
    );
    if (!result.received) {
      throw new BadRequestException('Signature de webhook invalide');
    }
    return result;
  }
}
