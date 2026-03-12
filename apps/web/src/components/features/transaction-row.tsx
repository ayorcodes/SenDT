import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { fmtCurrency, fmtRelativeDate } from '@/lib/utils';
import { TransactionType, type Transaction } from '@sendt/types';
import { cn } from '@/lib/utils';

const TYPE_META = {
  [TransactionType.DEPOSIT]: {
    icon: ArrowDownLeft,
    label: 'Deposit',
    color: 'text-status-up',
    bg: 'bg-status-up/[0.08]',
    prefix: '+',
  },
  [TransactionType.TRANSFER]: {
    icon: ArrowUpRight,
    label: 'Transfer',
    color: 'text-foreground',
    bg: 'bg-foreground/[0.06]',
    prefix: '-',
  },
  [TransactionType.CONVERSION]: {
    icon: RefreshCw,
    label: 'Conversion',
    color: 'text-primary',
    bg: 'bg-primary/[0.08]',
    prefix: '',
  },
};

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const meta = TYPE_META[transaction.type];
  const Icon = meta.icon;
  const isDeposit = transaction.type === TransactionType.DEPOSIT;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-4 border-b border-border last:border-0 transition-colors',
        onClick ? 'cursor-pointer hover:bg-muted/40' : 'cursor-default',
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', meta.bg)}>
        <Icon className={cn('h-4 w-4', meta.color)} strokeWidth={1.8} />
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-snug">
          {transaction.recipientName ?? meta.label}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground">
            {transaction.recipientBank
              ? `${transaction.recipientBank} · ${fmtRelativeDate(transaction.createdAt)}`
              : fmtRelativeDate(transaction.createdAt)}
          </span>
          <StatusBadge status={transaction.status} />
        </div>
      </div>

      {/* Amount */}
      <p className={cn(
        'font-mono text-sm tabular-nums font-semibold shrink-0',
        isDeposit ? 'text-status-up' : 'text-foreground',
      )}>
        {meta.prefix}{fmtCurrency(transaction.amount)}
      </p>
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-4">
      <div className="h-10 w-10 shrink-0 rounded-full animate-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 animate-shimmer" />
        <div className="h-2.5 w-20 animate-shimmer" />
      </div>
      <div className="h-3.5 w-16 animate-shimmer" />
    </div>
  );
}
