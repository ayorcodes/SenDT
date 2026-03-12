import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaystackService } from './paystack.service.js';
import { TransferDto, ResolveAccountDto } from './dto/transfer.dto.js';
import { EventsService } from '../events/events.service.js';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly events: EventsService,
    private readonly config: ConfigService,
  ) {}

  async resolveAccount(dto: ResolveAccountDto) {
    const result = await this.paystack.resolveAccount(dto.accountNumber, dto.bankCode);
    return { accountName: result.account_name };
  }

  async getBanks() {
    const banks = await this.paystack.getBanks();
    // Paystack test mode only resolves accounts against the test bank (code 001)
    const isTestMode = this.config.get<string>('paystack.secretKey')?.startsWith('sk_test_');
    if (isTestMode) {
      return [{ code: '001', name: 'Test Bank (Paystack)' }, ...banks];
    }
    return banks;
  }

  async transfer(userId: string, dto: TransferDto) {
    const amountKobo = BigInt(Math.round(parseFloat(dto.amount) * 100));
    if (amountKobo <= 0n) throw new BadRequestException('Amount must be positive');

    const idempotencyKey = dto.idempotencyKey ?? randomUUID();

    // Idempotency check
    const existing = await this.prisma.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      if (existing.userId !== userId) throw new ConflictException('Idempotency key conflict');
      return existing;
    }

    // ── Zone 1: Atomic debit + record ────────────────────────────────────────
    const transaction = await this.prisma.$transaction(async (tx) => {
      const balance = await tx.fiatBalance.findUnique({
        where: { userId },
        // Pessimistic lock
      });

      const currentBalance = balance?.amountKobo ?? 0n;
      if (currentBalance < amountKobo) {
        throw new BadRequestException('Insufficient balance');
      }

      const newBalance = currentBalance - amountKobo;

      await tx.fiatBalance.update({
        where: { userId },
        data: { amountKobo: newBalance },
      });

      const txn = await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.PROCESSING,
          amountKobo,
          recipientName: dto.accountName,
          recipientBank: dto.bankName,
          recipientAcct: dto.accountNumber,
          idempotencyKey,
          metadata: { bankCode: dto.bankCode },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          transactionId: txn.id,
          userId,
          amountKobo: -amountKobo,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Transfer to ${dto.accountName} (${dto.bankName})`,
        },
      });

      return txn;
    });
    // ── End Zone 1 ────────────────────────────────────────────────────────────

    // ── Zone 2: External call (outside DB transaction) ────────────────────────
    try {
      const recipient = await this.paystack.createTransferRecipient(
        dto.accountName,
        dto.accountNumber,
        dto.bankCode,
      );

      const result = await this.paystack.initiateTransfer(
        amountKobo,
        recipient.recipient_code,
        transaction.id,
      );

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { paystackRef: result.reference },
      });

      this.logger.log(`Transfer ${transaction.id} initiated via Paystack`);
      return transaction;
    } catch (err) {
      // ── Zone 3: Compensating transaction on failure ───────────────────────
      this.logger.error(`Transfer ${transaction.id} failed, reversing debit`, err);

      await this.prisma.$transaction(async (tx) => {
        const balance = await tx.fiatBalance.findUniqueOrThrow({ where: { userId } });
        const restoredBalance = balance.amountKobo + amountKobo;

        await tx.fiatBalance.update({
          where: { userId },
          data: { amountKobo: restoredBalance },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.FAILED },
        });

        await tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            userId,
            amountKobo,
            balanceBefore: balance.amountKobo,
            balanceAfter: restoredBalance,
            description: `Reversal: failed transfer to ${dto.accountName}`,
          },
        });
      });

      this.events.emit(userId, {
        type: 'TRANSFER_FAILED',
        data: { transactionId: transaction.id },
      });

      throw new BadRequestException('Transfer failed. Your balance has been restored.');
    }
  }

  async handlePaystackWebhook(event: string, data: any) {
    if (event === 'transfer.success') {
      const txn = await this.prisma.transaction.findFirst({
        where: { paystackRef: data.reference },
      });
      if (!txn) return;

      await this.prisma.transaction.update({
        where: { id: txn.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      this.events.emit(txn.userId, {
        type: 'TRANSFER_COMPLETED',
        data: { amount: data.amount, transactionId: txn.id },
      });
    }

    if (event === 'transfer.failed' || event === 'transfer.reversed') {
      const txn = await this.prisma.transaction.findFirst({
        where: { paystackRef: data.reference, status: TransactionStatus.PROCESSING },
      });
      if (!txn || !txn.amountKobo) return;

      await this.prisma.$transaction(async (tx) => {
        const balance = await tx.fiatBalance.findUniqueOrThrow({ where: { userId: txn.userId } });
        const restoredBalance = balance.amountKobo + txn.amountKobo!;

        await tx.fiatBalance.update({
          where: { userId: txn.userId },
          data: { amountKobo: restoredBalance },
        });

        await tx.transaction.update({
          where: { id: txn.id },
          data: { status: TransactionStatus.FAILED },
        });

        await tx.ledgerEntry.create({
          data: {
            transactionId: txn.id,
            userId: txn.userId,
            amountKobo: txn.amountKobo!,
            balanceBefore: balance.amountKobo,
            balanceAfter: restoredBalance,
            description: `Reversal: Paystack ${event}`,
          },
        });
      });

      this.events.emit(txn.userId, {
        type: 'TRANSFER_FAILED',
        data: { transactionId: txn.id },
      });
    }
  }
}
