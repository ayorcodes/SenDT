import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Asset, Chain } from '@prisma/client';
import { Turnkey } from '@turnkey/sdk-server';
import { PrismaService } from '../prisma/prisma.service.js';
import { DepositsService } from '../deposits/deposits.service.js';

export const ASSET_CHAIN: Record<Asset, Chain> = {
  [Asset.USDT]: Chain.ETHEREUM,
  [Asset.USDC]: Chain.ETHEREUM,
  [Asset.ETH]: Chain.ETHEREUM,
  [Asset.BTC]: Chain.BITCOIN,
};

const ACCOUNT_CONFIGS: Record<Chain, { curve: string; path: string; addressFormat: string }> = {
  [Chain.ETHEREUM]: {
    curve: 'CURVE_SECP256K1',
    path: "m/44'/60'/0'/0/0",
    addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
  },
  [Chain.TRON]: {
    curve: 'CURVE_SECP256K1',
    path: "m/44'/195'/0'/0/0",
    addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
  },
  [Chain.BITCOIN]: {
    curve: 'CURVE_SECP256K1',
    path: "m/84'/0'/0'/0/0",
    addressFormat: 'ADDRESS_FORMAT_BITCOIN_SEGWIT',
  },
};

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);
  private readonly turnkey: Turnkey;
  private readonly orgId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly deposits: DepositsService,
  ) {
    this.orgId = config.getOrThrow<string>('turnkey.organizationId');
    this.turnkey = new Turnkey({
      apiBaseUrl: config.getOrThrow<string>('turnkey.baseUrl'),
      apiPrivateKey: config.getOrThrow<string>('turnkey.apiPrivateKey'),
      apiPublicKey: config.getOrThrow<string>('turnkey.apiPublicKey'),
      defaultOrganizationId: this.orgId,
    });
  }

  /**
   * Get or create the chain wallet for a given asset.
   * ETH and USDT both resolve to the ETHEREUM chain wallet — same address.
   */
  async getOrCreateByAsset(userId: string, asset: Asset) {
    const chain = ASSET_CHAIN[asset];
    return this.getOrCreateByChain(userId, chain);
  }

  async getOrCreateByChain(userId: string, chain: Chain) {
    const existing = await this.prisma.wallet.findUnique({
      where: { userId_chain: { userId, chain } },
    });
    if (existing) return existing;

    const { walletId, address } = await this.createTurnkeyWallet(userId, chain);

    const wallet = await this.prisma.wallet.create({
      data: { userId, chain, address, turnkeyWalletId: walletId },
    });

    if (chain !== Chain.BITCOIN) {
      await this.deposits.registerAddress(address).catch((err) =>
        this.logger.error(`Moralis registration failed for ${address}`, err),
      );
    }

    return wallet;
  }

  async getAll(userId: string) {
    return this.prisma.wallet.findMany({ where: { userId } });
  }

  async getByAsset(userId: string, asset: Asset) {
    const chain = ASSET_CHAIN[asset];
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId_chain: { userId, chain } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  private async createTurnkeyWallet(userId: string, chain: Chain) {
    const cfg = ACCOUNT_CONFIGS[chain];
    const walletName = `${userId}-${chain}-${Date.now()}`;

    const response = await this.turnkey.apiClient().createWallet({
      organizationId: this.orgId,
      walletName,
      accounts: [
        {
          curve: cfg.curve as any,
          pathFormat: 'PATH_FORMAT_BIP32',
          path: cfg.path,
          addressFormat: cfg.addressFormat as any,
        },
      ],
    });

    if (!response.walletId || !response.addresses[0]) {
      throw new Error('Invalid Turnkey wallet response');
    }

    this.logger.log(`Created Turnkey wallet ${response.walletId} for chain ${chain}`);

    return {
      walletId: response.walletId,
      address: response.addresses[0].toLowerCase(),
    };
  }
}
