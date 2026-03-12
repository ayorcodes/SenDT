import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service.js';
import { TransfersController } from './transfers.controller.js';
import { PaystackService } from './paystack.service.js';
import { EventsModule } from '../events/events.module.js';

@Module({
  imports: [EventsModule],
  providers: [TransfersService, PaystackService],
  controllers: [TransfersController],
  exports: [TransfersService, PaystackService],
})
export class TransfersModule {}
