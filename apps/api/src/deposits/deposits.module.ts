import { Module } from '@nestjs/common';
import { DepositsService } from './deposits.service.js';
import { RatesModule } from '../rates/rates.module.js';
import { EventsModule } from '../events/events.module.js';

@Module({
  imports: [RatesModule, EventsModule],
  providers: [DepositsService],
  exports: [DepositsService],
})
export class DepositsModule {}
