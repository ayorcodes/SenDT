import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { TransfersModule } from '../transfers/transfers.module.js';
import { DepositsModule } from '../deposits/deposits.module.js';

@Module({
  imports: [TransfersModule, DepositsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
