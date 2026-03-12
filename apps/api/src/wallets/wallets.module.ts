import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service.js';
import { WalletsController } from './wallets.controller.js';
import { DepositsModule } from '../deposits/deposits.module.js';

@Module({
  imports: [DepositsModule],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [WalletsService],
})
export class WalletsModule {}
