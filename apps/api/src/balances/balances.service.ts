import { Injectable } from '@nestjs/common';
import { Asset } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

// Raw unit decimals per asset
const ASSET_DECIMALS: Record<Asset, number> = {
  [Asset.USDT]: 6,
  [Asset.USDC]: 6,
  [Asset.ETH]: 18,
  [Asset.BTC]: 8,
};

@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async getFiat(userId: string) {
    const balance = await this.prisma.fiatBalance.findUnique({ where: { userId } });
    const amountKobo = balance?.amountKobo ?? 0n;
    return {
      currency: 'NGN',
      amount: Number(amountKobo) / 100,
      amountKobo: amountKobo.toString(),
    };
  }

  async getCrypto(userId: string) {
    const balances = await this.prisma.cryptoBalance.findMany({ where: { userId } });
    return balances.map((b) => {
      const decimals = ASSET_DECIMALS[b.asset];
      const factor = 10n ** BigInt(decimals);
      const raw = BigInt(b.amountRaw);
      const whole = raw / factor;
      const frac = raw % factor;
      const amount = frac === 0n
        ? whole.toString()
        : `${whole}.${frac.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
      return { asset: b.asset, amount };
    });
  }
}
