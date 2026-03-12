import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl   = config.getOrThrow<string>('paystack.baseUrl');
    this.secretKey = config.getOrThrow<string>('paystack.secretKey');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const body: any = await res.json();
    if (!res.ok || !body.status) {
      throw new Error(body.message ?? `Paystack error ${res.status}`);
    }
    return body.data as T;
  }

  async resolveAccount(accountNumber: string, bankCode: string) {
    return this.request<{ account_name: string; account_number: string }>(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    );
  }

  async getBanks() {
    return this.request<Array<{ name: string; code: string; id: number }>>('/bank?country=nigeria&perPage=100');
  }

  async createTransferRecipient(accountName: string, accountNumber: string, bankCode: string) {
    return this.request<{ recipient_code: string }>('/transferrecipient', {
      method: 'POST',
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });
  }

  async initiateTransfer(amountKobo: bigint, recipientCode: string, reference: string, reason?: string) {
    return this.request<{ reference: string; status: string }>('/transfer', {
      method: 'POST',
      body: JSON.stringify({
        source: 'balance',
        amount: Number(amountKobo),
        recipient: recipientCode,
        reference,
        reason: reason ?? 'SenDT transfer',
      }),
    });
  }

  verifyWebhookSignature(body: Buffer, signature: string): boolean {
    const crypto = require('crypto') as typeof import('crypto');
    const secret = this.config.getOrThrow<string>('paystack.webhookSecret');
    const expected = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex');
    return expected === signature;
  }
}
