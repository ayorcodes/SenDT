import { Module } from '@nestjs/common';
import { BalancesService } from './balances.service.js';
import { BalancesController } from './balances.controller.js';

@Module({
  providers: [BalancesService],
  controllers: [BalancesController],
  exports: [BalancesService],
})
export class BalancesModule {}
