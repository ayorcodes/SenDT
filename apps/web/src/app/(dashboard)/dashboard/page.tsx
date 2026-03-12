"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useBalance } from "@/hooks/use-balance";
import { useRates } from "@/hooks/use-rates";
import { useTransactions } from "@/hooks/use-transactions";
import { BalanceCard, BalanceCardSkeleton, CryptoBalanceCard } from "@/components/ui/stat-card";
import { TransactionRow, TransactionRowSkeleton } from "@/components/features/transaction-row";
import { DepositSheet } from "@/components/features/deposit-sheet";
import { fmtCurrency, fmtCrypto } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.name.split(" ")[0] ?? "";
  const [depositOpen, setDepositOpen] = useState(false);

  const { fiat, crypto, loading: balanceLoading } = useBalance();
  const { getRate } = useRates();
  const { transactions, loading: txLoading } = useTransactions({ limit: 5 });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Greeting */}
      <div>
        <p className="section-label">{greeting()}</p>
        <p className="mt-0.5 text-lg font-semibold text-foreground">{firstName}</p>
      </div>

      {/* Fiat balance */}
      {balanceLoading ? (
        <BalanceCardSkeleton />
      ) : (
        <BalanceCard
          label="Available balance"
          value={fmtCurrency(fiat?.amount ?? "0")}
        />
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/send"
          className="flex items-center justify-center gap-2 border border-border bg-card py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted active:scale-[0.97]"
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          Send
        </Link>
        <button
          onClick={() => setDepositOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Deposit
        </button>
      </div>

      {/* Crypto balances */}
      {!balanceLoading && crypto.length > 0 && (
        <div>
          <p className="section-label mb-2">Crypto holdings</p>
          <div className="border border-border divide-y divide-border">
            {crypto.map((b) => {
              const rate = getRate(b.asset);
              const ngnValue = rate ? parseFloat(b.amount) * parseFloat(rate) : 0;
              return (
                <CryptoBalanceCard
                  key={b.asset}
                  asset={b.asset}
                  amount={fmtCrypto(b.amount, b.asset)}
                  valueNgn={fmtCurrency(ngnValue)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="section-label">Recent</p>
          <Link
            href="/transactions"
            className="text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        </div>

        <div className="border border-border divide-y divide-border">
          {txLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TransactionRowSkeleton key={i} />
            ))
          ) : transactions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="mt-1 text-[12px] text-muted-foreground/60">
                Deposit crypto to get started
              </p>
            </div>
          ) : (
            transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))
          )}
        </div>
      </div>

      {depositOpen && <DepositSheet onClose={() => setDepositOpen(false)} />}
    </div>
  );
}
