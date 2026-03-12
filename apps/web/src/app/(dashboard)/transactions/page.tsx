"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { TransactionRow, TransactionRowSkeleton } from "@/components/features/transaction-row";
import { Button } from "@/components/ui/button";
import { fmtRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Transaction } from "@sendt/types";

const FILTERS = [
  { label: "All",      value: undefined    },
  { label: "Deposits", value: "DEPOSIT"    },
  { label: "Transfers",value: "TRANSFER"   },
] as const;

type FilterValue = typeof FILTERS[number]["value"];

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = fmtRelativeDate(tx.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries());
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<FilterValue>(undefined);

  const { transactions, loading, hasMore, loadMore } = useTransactions({
    limit: 20,
    type: filter,
  });

  const groups = groupByDate(transactions);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Filter tabs */}
      <div className="flex border border-border">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={cn(
              "flex-1 py-2.5 text-sm font-semibold transition-colors duration-150",
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="border border-border divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <TransactionRowSkeleton key={i} />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No transactions found</p>
          <p className="mt-1 text-[12px] text-muted-foreground/60">
            {filter ? "Try a different filter" : "Deposit crypto to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([date, txs]) => (
            <div key={date}>
              <p className="section-label mb-2">{date}</p>
              <div className="border border-border divide-y divide-border">
                {txs.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <Button variant="secondary" onClick={loadMore} size="md">
              Load more
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
