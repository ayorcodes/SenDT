import { Injectable, Logger } from '@nestjs/common';
import { Asset, TransactionStatus, TransactionType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { keccak256 } from 'js-sha3';
import { PrismaService } from '../prisma/prisma.service.js';
import { RatesService } from '../rates/rates.service.js';
import { EventsService } from '../events/events.service.js';

// ERC-20 token contract addresses (lowercase) → Asset
const TOKEN_CONTRACTS: Record<string, Asset> = {
  '0xdac17f958d2ee523a2206206994597c13d831ec7': Asset.USDT, // USDT ERC-20 mainnet
  '0xf55bec9cafdbe8730f096aa55dad6d22d44099df': Asset.USDT, // USDT TRC-20 (tether treasury)
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': Asset.USDC, // USDC ERC-20 mainnet
  '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': Asset.USDC, // USDC native (Polygon)
};

// Moralis ERC-20 transfer object (from erc20Transfers[])
interface MoralisERC20Transfer {
  from: string;
  to: string;
  value: string;
  transactionHash: string;
  logIndex: string;
  contract: string;        // Moralis sends 'contract', not 'tokenAddress'
  tokenDecimals: string;
  valueWithDecimals: string; // pre-computed human-readable value
}

// Moralis native transaction object (from txs[])
interface MoralisTx {
  hash: string;
  fromAddress: string;
  toAddress: string;
  value: string; // in wei
  receiptStatus: string;
}

// Top-level Moralis stream webhook payload
interface MoralisStreamPayload {
  streamId: string;
  tag: string;
  chainId: string;
  confirmed: boolean;
  block: { number: string; timestamp: string; hash: string };
  txs: MoralisTx[];
  erc20Transfers: MoralisERC20Transfer[];
}

@Injectable()
export class DepositsService {
  private readonly logger = new Logger(DepositsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rates: RatesService,
    private readonly events: EventsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Moralis signature: keccak256(JSON.stringify(body) + secret)
   * Header: x-signature
   */
  verifyMoralisSignature(signature: string): boolean {
    const secret = this.config.getOrThrow<string>('moralis.webhookSecret');
    return secret === signature;
  }

  async handleMoralisStream(payload: MoralisStreamPayload) {
    // Only process once the block is confirmed to avoid double-crediting
    if (!payload.confirmed) return;

    // Native ETH transfers (requires includeNativeTxs: true on the stream)
    if (payload.txs?.length) {
      for (const tx of payload.txs) {
        if (tx.value && tx.value !== '0' && tx.receiptStatus === '1') {
          await this.processDeposit({
            txHash: tx.hash,
            toAddress: tx.toAddress?.toLowerCase(),
            amountRaw: tx.value,
            amountHuman: (Number(BigInt(tx.value)) / 1e18).toFixed(8),
            asset: Asset.ETH,
            eventId: tx.hash,
          });
        }
      }
    }

    // ERC-20 token transfers
    if (payload.erc20Transfers?.length) {
      for (const transfer of payload.erc20Transfers) {
        const asset = TOKEN_CONTRACTS[transfer.contract?.toLowerCase()];
        if (!asset) continue;

        await this.processDeposit({
          txHash: transfer.transactionHash,
          toAddress: transfer.to?.toLowerCase(),
          amountRaw: transfer.value,
          amountHuman: transfer.valueWithDecimals,
          asset,
          eventId: `${transfer.transactionHash}-${transfer.logIndex}`,
        });
      }
    }
  }

  /**
   * Add a wallet address to an existing Moralis EVM stream.
   * Call this after creating a new wallet in Turnkey.
   */
  async registerAddress(address: string) {
    const streamId = this.config.get<string>('moralis.streamId');
    const apiKey = this.config.get<string>('moralis.apiKey');
    if (!streamId || !apiKey) {
      this.logger.warn('Moralis streamId/apiKey not set — skipping address registration');
      return;
    }

    const res = await fetch(`https://api.moralis-streams.com/streams/evm/${streamId}/address`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });

    if (!res.ok) {
      this.logger.error(`Failed to register address ${address} with Moralis: ${res.status}`);
    } else {
      this.logger.log(`Registered ${address} with Moralis stream ${streamId}`);
    }
  }

  private async processDeposit({
    txHash,
    toAddress,
    amountRaw,
    amountHuman,
    asset,
    eventId,
  }: {
    txHash: string;
    toAddress: string;
    amountRaw: string;
    amountHuman: string;
    asset: Asset;
    eventId: string;
  }) {
    // Idempotency — skip already processed events
    const alreadyProcessed = await this.prisma.processedEvent.findUnique({
      where: { id: eventId },
    });
    if (alreadyProcessed) return;

    // Find wallet owner
    const wallet = await this.prisma.wallet.findUnique({ where: { address: toAddress } });
    if (!wallet) return; // not our wallet

    // Get NGN rate
    const rateKobo = await this.rates.getRate(asset);
    if (!rateKobo) {
      this.logger.warn(`No rate found for ${asset}, skipping deposit credit`);
      return;
    }

    const amountNgn = parseFloat(amountHuman);
    const amountKobo = BigInt(Math.round(amountNgn * Number(rateKobo)));

    this.logger.log(
      `Deposit: ${amountHuman} ${asset} → wallet ${toAddress} = ₦${(Number(amountKobo) / 100).toFixed(2)}`,
    );

    await this.prisma.$transaction(async (tx) => {
      // Idempotency lock inside transaction
      await tx.processedEvent.create({ data: { id: eventId, source: 'moralis' } });

      const txn = await tx.transaction.create({
        data: {
          userId: wallet.userId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          asset,
          amountRaw,
          amountKobo,
          rateKobo,
          txHash,
        },
      });

      // Credit NGN balance
      const balance = await tx.fiatBalance.upsert({
        where: { userId: wallet.userId },
        update: { amountKobo: { increment: amountKobo } },
        create: { userId: wallet.userId, amountKobo },
      });

      // Credit crypto balance
      const existingCrypto = await tx.cryptoBalance.findUnique({
        where: { userId_asset: { userId: wallet.userId, asset } },
      });
      const newRaw = (BigInt(existingCrypto?.amountRaw ?? '0') + BigInt(amountRaw)).toString();
      await tx.cryptoBalance.upsert({
        where: { userId_asset: { userId: wallet.userId, asset } },
        update: { amountRaw: newRaw },
        create: { userId: wallet.userId, asset, amountRaw },
      });

      // Append-only ledger entry
      const balanceBefore = balance.amountKobo - amountKobo;
      await tx.ledgerEntry.create({
        data: {
          transactionId: txn.id,
          userId: wallet.userId,
          amountKobo,
          balanceBefore: balanceBefore < 0n ? 0n : balanceBefore,
          balanceAfter: balance.amountKobo,
          description: `${amountHuman} ${asset} deposit`,
        },
      });
    });

    this.events.emit(wallet.userId, {
      type: 'DEPOSIT_CONFIRMED',
      data: {
        asset,
        cryptoAmount: amountHuman,
        amountKobo: amountKobo.toString(),
        txHash,
      },
    });
  }
}
