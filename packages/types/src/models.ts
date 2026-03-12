import { Asset, Chain, KYCStatus, TransactionStatus, TransactionType } from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: KYCStatus;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  chain: Chain;
  address: string;
  createdAt: string;
}

export interface CryptoBalance {
  asset: Asset;
  amount: string;
}

export interface FiatBalance {
  currency: 'NGN';
  amount: string;
}

export interface Rate {
  asset: Asset;
  fiat: 'NGN';
  rate: string;
  fetchedAt: string;
  expiresIn: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  currency: string;
  asset?: Asset;
  cryptoAmount?: string;
  rateUsed?: string;
  externalRef?: string;
  description: string;
  recipientName?: string;
  recipientBank?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
}

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}
