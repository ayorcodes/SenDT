import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET!,
  accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '30d',
}));

export const paystackConfig = registerAs('paystack', () => ({
  secretKey: process.env.PAYSTACK_SECRET_KEY!,
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET!,
  baseUrl: 'https://api.paystack.co',
}));

export const turnkeyConfig = registerAs('turnkey', () => ({
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  organizationId: process.env.TURNKEY_ORGANIZATION_ID!,
  baseUrl: 'https://api.turnkey.com',
}));

export const moralisConfig = registerAs('moralis', () => ({
  apiKey: process.env.MORALIS_API_KEY!,
  webhookSecret: process.env.MORALIS_WEBHOOK_SECRET!,
  streamId: process.env.MORALIS_STREAM_ID ?? '',
}));

export const coingeckoConfig = registerAs('coingecko', () => ({
  apiKey: process.env.COINGECKO_API_KEY ?? '',
  baseUrl: 'https://api.coingecko.com/api/v3',
}));
