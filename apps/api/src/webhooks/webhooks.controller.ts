import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';
import { PaystackService } from '../transfers/paystack.service.js';
import { TransfersService } from '../transfers/transfers.service.js';
import { DepositsService } from '../deposits/deposits.service.js';

@ApiTags('webhooks')
@Public()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly paystack: PaystackService,
    private readonly transfers: TransfersService,
    private readonly deposits: DepositsService,
  ) {}

  @Post('paystack')
  @HttpCode(HttpStatus.OK)
  async handlePaystack(
    @Req() req: RawBodyRequest<{ rawBody?: Buffer }>,
    @Query('key') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('No raw body');

    if (!this.paystack.verifyWebhookSignature(signature)) {
      this.logger.warn('Invalid Paystack webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const body = JSON.parse(rawBody.toString());
    this.logger.log(`Paystack webhook: ${body.event}`);

    await this.transfers.handlePaystackWebhook(body.event, body.data);
    return { received: true };
  }

  @Post('moralis')
  @HttpCode(HttpStatus.OK)
  async handleMoralis(
    @Req() req: RawBodyRequest<{ rawBody?: Buffer }>,
    @Query('key') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('No raw body');

    if (!this.deposits.verifyMoralisSignature(signature)) {
      this.logger.warn('Invalid Moralis webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const body = JSON.parse(rawBody.toString());
    this.logger.log(`Moralis stream event: ${body.streamId}`);
    // Only process confirmed blocks
    if (body.confirmed) {
      await this.deposits.handleMoralisStream(body);
    }

    return { received: true };
  }
}
