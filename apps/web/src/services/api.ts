import type { AuthResponse, TransferDto, ResolveAccountDto } from '@sendt/types';
import type { Transaction, Wallet, FiatBalance, CryptoBalance, Rate, BankAccount } from '@sendt/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401 && !path.startsWith('/auth/')) {
    // Token expired on a protected route — clear session and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('sendt-auth');
      window.location.href = '/login';
    }
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { name: string; email: string; phone: string; password: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (refreshToken: string) =>
    request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// ── Wallets ───────────────────────────────────────────────────────────────────
export const walletApi = {
  getAll: () => request<Wallet[]>('/wallets'),
  getOrCreate: (asset: string) => request<Wallet>(`/wallets/${asset}`, { method: 'POST' }),
  getOne: (asset: string) => request<Wallet>(`/wallets/${asset}`),
};

// ── Balances ──────────────────────────────────────────────────────────────────
export const balanceApi = {
  getFiat: () => request<FiatBalance>('/balances/fiat'),
  getCrypto: () => request<CryptoBalance[]>('/balances/crypto'),
};

// ── Rates ─────────────────────────────────────────────────────────────────────
export const ratesApi = {
  getAll: () => request<Rate[]>('/rates'),
  getRate: (asset: string) => request<Rate>(`/rates/${asset}`),
};

// ── Transfers ─────────────────────────────────────────────────────────────────
export const transfersApi = {
  resolveAccount: (data: ResolveAccountDto) =>
    request<{ accountName: string }>('/transfers/resolve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  initiate: (data: TransferDto) =>
    request<Transaction>('/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) => request<Transaction>(`/transfers/${id}`),
};

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactionsApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.type) qs.set('type', params.type);
    return request<{ data: Transaction[]; total: number; page: number }>(`/transactions?${qs}`);
  },

  getById: (id: string) => request<Transaction>(`/transactions/${id}`),
};

// ── Banks ─────────────────────────────────────────────────────────────────────
export const banksApi = {
  getAll: () => request<{ code: string; name: string }[]>('/transfers/banks'),
};
