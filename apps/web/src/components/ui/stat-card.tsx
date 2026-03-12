import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ── BalanceCard — primary balance display ────────────────────────────────────

interface BalanceCardProps {
  label: string;
  value: string;
  subValue?: string;
  className?: string;
}

export function BalanceCard({ label, value, subValue, className }: BalanceCardProps) {
  return (
    <div className={cn('border border-border bg-card p-5', className)}>
      <p className="section-label mb-3">{label}</p>
      <p className="font-mono text-[2.5rem] font-bold leading-none tabular-nums text-foreground">
        {value}
      </p>
      {subValue && (
        <p className="mt-2 font-mono text-sm text-muted-foreground tabular-nums">{subValue}</p>
      )}
    </div>
  );
}

export function BalanceCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border border-border bg-card p-5', className)}>
      <div className="mb-3 h-2.5 w-20 animate-shimmer" />
      <div className="h-10 w-40 animate-shimmer" />
      <div className="mt-2 h-3 w-28 animate-shimmer" />
    </div>
  );
}

// ── StatCard — smaller metric card ───────────────────────────────────────────

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, trend, trendPositive, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden border border-border bg-card p-4 transition-all duration-200 hover:border-foreground/10',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="section-label">{label}</span>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-foreground/[0.05] transition-colors group-hover:bg-foreground/[0.08]">
          <Icon className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-foreground leading-none">
        {value}
      </p>
      {trend && (
        <p
          className={cn(
            'mt-2 text-xs',
            trendPositive === true && 'text-status-up',
            trendPositive === false && 'text-status-down',
            trendPositive === undefined && 'text-muted-foreground',
          )}
        >
          {trendPositive === true && '↑ '}
          {trendPositive === false && '↓ '}
          {trend}
        </p>
      )}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground/0 transition-all duration-300 group-hover:bg-foreground/[0.05]" />
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border border-border bg-card p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="h-2 w-16 animate-shimmer" />
        <div className="h-6 w-6 animate-shimmer" />
      </div>
      <div className="mt-3 h-7 w-24 animate-shimmer" />
      <div className="mt-2 h-2 w-20 animate-shimmer" />
    </div>
  );
}

// ── CryptoBalanceCard — per-asset balance ────────────────────────────────────

interface CryptoBalanceCardProps {
  asset: string;
  amount: string;
  valueNgn: string;
  className?: string;
}

export function CryptoBalanceCard({ asset, amount, valueNgn, className }: CryptoBalanceCardProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted/30',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-muted">
          <span className="text-[10px] font-bold text-foreground/60">{asset.slice(0, 3)}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{asset}</p>
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            {amount} <span className="text-foreground/50">({valueNgn})</span>
          </p>
        </div>
      </div>
    </div>
  );
}
