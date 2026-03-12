import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

interface GetTransactionsOpts {
  page?: number;
  limit?: number;
  type?: TransactionType;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(userId: string, opts: GetTransactionsOpts = {}) {
    const { page = 1, limit = 20, type } = opts;
    const skip = (page - 1) * limit;

    const where = { userId, ...(type ? { type } : {}) };

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          status: true,
          asset: true,
          amountRaw: true,
          amountKobo: true,
          recipientName: true,
          recipientBank: true,
          createdAt: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: data.map((t) => ({
        ...t,
        amount: t.amountKobo ? Number(t.amountKobo) / 100 : null,
        amountKobo: t.amountKobo?.toString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getOne(userId: string, id: string) {
    return this.prisma.transaction.findFirstOrThrow({
      where: { id, userId },
    });
  }
}
