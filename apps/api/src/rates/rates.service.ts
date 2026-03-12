import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Asset } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

const COINGECKO_IDS: Record<Asset, string> = {
  [Asset.USDT]: 'tether',
  [Asset.USDC]: 'usd-coin',
  [Asset.ETH]: 'ethereum',
  [Asset.BTC]: 'bitcoin',
};

@Injectable()
export class RatesService implements OnModuleInit {
  private readonly logger = new Logger(RatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.refreshRates();
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async refreshRates() {
    this.logger.log('Refreshing rates from CoinGecko...');
    try {
      const ids = Object.values(COINGECKO_IDS).join(',');
      const apiKey = this.config.get<string>('coingecko.apiKey');
      const baseUrl = this.config.getOrThrow<string>('coingecko.baseUrl');

      const url = `${baseUrl}/simple/price?ids=${ids}&vs_currencies=ngn`;
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (apiKey) headers['x-cg-demo-api-key'] = apiKey;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);

      const data: Record<string, { ngn: number }> = await res.json() as any;

      await Promise.all(
        (Object.entries(COINGECKO_IDS) as [Asset, string][]).map(([asset, id]) => {
          const rateNgn = data[id]?.ngn;
          if (!rateNgn) return;
          const rateKobo = BigInt(Math.round(rateNgn * 100));
          return this.prisma.rate.upsert({
            where: { asset },
            update: { rateKobo, source: 'coingecko' },
            create: { asset, rateKobo, source: 'coingecko' },
          });
        }),
      );

      this.logger.log('Rates refreshed successfully');
    } catch (err) {
      this.logger.error('Failed to refresh rates', err);
    }
  }

  async getAll() {
    const rates = await this.prisma.rate.findMany();
    return rates.map((r) => ({
      asset: r.asset,
      rate: Number(r.rateKobo) / 100,
      updatedAt: r.updatedAt,
    }));
  }

  async getRate(asset: Asset): Promise<bigint | null> {
    const rate = await this.prisma.rate.findUnique({ where: { asset } });
    return rate?.rateKobo ?? null;
  }
}
