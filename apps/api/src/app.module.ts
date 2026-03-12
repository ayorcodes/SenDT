import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  appConfig,
  jwtConfig,
  paystackConfig,
  turnkeyConfig,
  moralisConfig,
  coingeckoConfig,
} from './config/app.config.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { WalletsModule } from './wallets/wallets.module.js';
import { BalancesModule } from './balances/balances.module.js';
import { RatesModule } from './rates/rates.module.js';
import { TransfersModule } from './transfers/transfers.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { DepositsModule } from './deposits/deposits.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { EventsModule } from './events/events.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, paystackConfig, turnkeyConfig, moralisConfig, coingeckoConfig],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    WalletsModule,
    BalancesModule,
    RatesModule,
    TransfersModule,
    TransactionsModule,
    DepositsModule,
    WebhooksModule,
    EventsModule,
  ],
})
export class AppModule {}
