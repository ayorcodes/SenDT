# SenDT

**Spend crypto, send naira.** SenDT lets users deposit USDT, USDC, or ETH and instantly send NGN to any Nigerian bank account — no exchange app needed, no manual conversions.

---

## How it works

1. User deposits crypto to their Turnkey-generated wallet address
2. Moralis detects the on-chain deposit and fires a webhook
3. SenDT credits the user's NGN balance at the live exchange rate
4. User sends NGN to any Nigerian bank account via Paystack
5. Balance is debited atomically; transfer is processed instantly

---

## Tech stack

| Layer | Technology |
|---|---|
| API | NestJS 11, TypeScript, Node.js |
| Frontend | Next.js 15 (App Router), Tailwind CSS, Zustand |
| Database | PostgreSQL + Prisma 6 |
| Wallets | Turnkey (MPC, non-custodial) |
| Blockchain monitoring | Moralis Streams |
| Bank transfers | Paystack |
| Exchange rates | CoinGecko |
| Monorepo | pnpm workspaces |

---

## Project structure

```
SenDT/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   └── types/        # Shared TypeScript types & DTOs
├── SYSTEM.md         # Full technical documentation
└── README.md
```

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (local or remote)
- Accounts for: Turnkey, Moralis, Paystack (see [Getting API keys](#getting-api-keys))

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd SenDT
pnpm install
```

### 2. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your keys (see [Getting API keys](#getting-api-keys) below).

### 3. Configure the frontend

Create `apps/web/.env.local`:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > apps/web/.env.local
```

### 4. Set up the database

```bash
cd apps/api
npx prisma db push
```

This creates all tables and generates the Prisma client. No migration files needed for development.

### 5. Run the project

Open two terminals:

```bash
# Terminal 1 — API (http://localhost:3001)
cd apps/api
pnpm dev

# Terminal 2 — Frontend (http://localhost:3000)
cd apps/web
pnpm dev
```

The API Swagger docs are available at `http://localhost:3001/api/docs` in development.

---

## Frontend overview

The frontend is a mobile-first Next.js 15 app built for use as a PWA on phones. It is designed around a bottom navigation with two tabs — **Overview** and **History** — with all key actions surfaced as buttons and bottom sheets rather than separate pages.

### Pages

| Route | Description |
|---|---|
| `/login` | Email + password login |
| `/register` | Name, email, phone, password registration |
| `/dashboard` | Main screen: NGN balance, crypto holdings, quick actions, recent transactions |
| `/send` | 2-step flow: enter recipient bank details → enter amount → confirm sheet |
| `/transactions` | Full transaction history with filters |

### Key UI flows

**Deposit crypto**
1. From the dashboard, tap **Deposit**
2. A bottom sheet slides up showing your existing wallet(s)
3. If no wallet exists yet, tap **Add Ethereum wallet** — it creates one via Turnkey and registers it with Moralis
4. Copy the address and send crypto from any wallet or exchange
5. When the deposit confirms on-chain, the dashboard balance updates automatically (live via SSE — no refresh needed)

**Send money**
1. From the dashboard, tap **Send**
2. Select a bank from the dropdown and enter a 10-digit account number
3. The account name resolves automatically via Paystack
4. Tap **Continue**, enter an amount, tap **Review transfer**
5. A confirm sheet shows recipient details — tap **Send** to execute
6. On success, a toast notification appears and the dashboard balance reflects the debit

**Real-time updates**
The frontend maintains a persistent SSE connection to the API. When a deposit confirms or a transfer completes, the server pushes an event which triggers a toast notification and an automatic balance refresh — no polling required.

### Frontend environment

`apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

In production, point this to your deployed API URL.

---

## Getting API keys

### Paystack
> Used for: NGN bank transfers, account name resolution, bank list

1. Sign up at [paystack.com](https://paystack.com)
2. Go to **Settings → API Keys & Webhooks**
3. Copy your **Secret Key** (use `sk_test_...` for development)
4. Set a **Webhook URL**: `https://your-domain.com/api/v1/webhooks/paystack`
5. Copy the **Webhook Secret** shown after saving
6. Add to `.env`:
   ```
   PAYSTACK_SECRET_KEY=sk_test_...
   PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
   ```

> **Test accounts**: Use bank code `001` (Test Bank) with account numbers `0000000000` to `0000000009` for local testing.

---

### Turnkey
> Used for: MPC non-custodial wallet generation (Ethereum + Bitcoin addresses)

1. Sign up at [app.turnkey.com](https://app.turnkey.com)
2. Create an **Organization**
3. Go to **API Keys** → create a new API key pair
4. Copy the **Organization ID**, **Public Key**, and **Private Key**
5. Create a **Policy** to grant your API key wallet creation permissions:
   - Go to **Policies → Create Policy**
   - Effect: `EFFECT_ALLOW`
   - Consensus: `approvers.any(user, user.id == 'YOUR_API_KEY_USER_ID')`
   - Condition: `true`
   - (Find your API Key User ID under the API key details)
6. Add to `.env`:
   ```
   TURNKEY_ORGANIZATION_ID=your_org_id
   TURNKEY_API_PUBLIC_KEY=your_public_key
   TURNKEY_API_PRIVATE_KEY=your_private_key
   ```

---

### Moralis
> Used for: Detecting on-chain crypto deposits in real time

1. Sign up at [moralis.io](https://moralis.io)
2. Go to **Streams** → Create a new stream
3. Configure the stream:
   - **Network**: Ethereum Mainnet (or your target network)
   - **Event type**: ERC-20 transfers + native transactions
   - **Webhook URL**: `https://your-domain.com/api/v1/webhooks/moralis`
   - Enable **Confirmed only** (important — prevents double-crediting)
4. Copy the **Stream ID** and **API Key**
5. Set a **Webhook Secret** in the stream settings
6. Add to `.env`:
   ```
   MORALIS_API_KEY=your_api_key
   MORALIS_STREAM_ID=your_stream_id
   MORALIS_WEBHOOK_SECRET=your_webhook_secret
   ```

> Wallet addresses are automatically registered with your Moralis stream when users create wallets.

---

### CoinGecko
> Used for: Live USDT/USDC/ETH/BTC → NGN exchange rates (refreshed every 30 min)

1. Sign up at [coingecko.com/en/api](https://www.coingecko.com/en/api)
2. The free plan works — no key required for basic usage
3. For higher rate limits, get a Demo API key and add:
   ```
   COINGECKO_API_KEY=your_key
   ```
   Leave blank to use the free unauthenticated endpoint.

---

## Testing the full flow

### 1. Register an account

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"08012345678","password":"password123"}'
```

### 2. Log in and get your access token

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Save the `accessToken` from the response.

### 3. Create your Ethereum wallet

```bash
curl -X POST http://localhost:3001/api/v1/wallets/USDT \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

This creates a Turnkey MPC wallet and returns your Ethereum deposit address. The same address works for USDT, USDC, and ETH.

### 4. Simulate a deposit (webhook replay)

Send a test webhook payload to your local API to simulate a USDC deposit:

```bash
curl -X POST http://localhost:3001/api/v1/webhooks/moralis \
  -H "Content-Type: application/json" \
  -H "x-signature: YOUR_MORALIS_WEBHOOK_SECRET" \
  -d '{
    "confirmed": true,
    "chainId": "0x1",
    "streamId": "YOUR_STREAM_ID",
    "erc20Transfers": [{
      "transactionHash": "0xtest123",
      "logIndex": "1",
      "contract": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "from": "0xsender",
      "to": "YOUR_WALLET_ADDRESS",
      "value": "10000000",
      "valueWithDecimals": "10",
      "tokenName": "USD Coin",
      "tokenSymbol": "USDC",
      "tokenDecimals": "6"
    }],
    "txs": [],
    "txsInternal": [],
    "erc20Approvals": [],
    "nftTransfers": [],
    "nftApprovals": { "ERC721": [], "ERC1155": [] },
    "nativeBalances": [],
    "block": { "number": "1", "hash": "0x0", "timestamp": "1700000000" },
    "tag": "test",
    "retries": 0
  }'
```

Replace `YOUR_WALLET_ADDRESS` with the address from step 3. Your NGN balance should update.

### 5. Send NGN to a bank account

In the app: click **Send** → select **Test Bank (Paystack)** → enter account number `0000000000` → enter an amount → confirm.

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRY` | ✅ | Access token lifetime (e.g. `15m`) |
| `JWT_REFRESH_EXPIRY` | ✅ | Refresh token lifetime (e.g. `30d`) |
| `PAYSTACK_SECRET_KEY` | ✅ | Paystack secret key (`sk_test_...` or `sk_live_...`) |
| `PAYSTACK_WEBHOOK_SECRET` | ✅ | Paystack webhook signing secret |
| `TURNKEY_ORGANIZATION_ID` | ✅ | Turnkey org ID |
| `TURNKEY_API_PUBLIC_KEY` | ✅ | Turnkey API public key |
| `TURNKEY_API_PRIVATE_KEY` | ✅ | Turnkey API private key |
| `MORALIS_API_KEY` | ✅ | Moralis API key |
| `MORALIS_WEBHOOK_SECRET` | ✅ | Moralis stream webhook secret |
| `MORALIS_STREAM_ID` | ✅ | Moralis EVM stream ID |
| `COINGECKO_API_KEY` | ❌ | CoinGecko API key (optional, free tier works without) |
| `PORT` | ❌ | API port (default: `3001`) |
| `CORS_ORIGIN` | ❌ | Allowed CORS origin (default: `http://localhost:3000`) |

---

## Supported assets

| Asset | Network | Notes |
|---|---|---|
| USDT | Ethereum (ERC-20) | Shares Ethereum wallet address with USDC and ETH |
| USDC | Ethereum (ERC-20) | Shares Ethereum wallet address with USDT and ETH |
| ETH | Ethereum | Native, shares address with USDT and USDC |
| BTC | Bitcoin | Backend supported, excluded from current UI |
