import { Module } from '@nestjs/common';
import { RatesService } from './rates.service.js';
import { RatesController } from './rates.controller.js';

@Module({
  providers: [RatesService],
  controllers: [RatesController],
  exports: [RatesService],
})
export class RatesModule {}
