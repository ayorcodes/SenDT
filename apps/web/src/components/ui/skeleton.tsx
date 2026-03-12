import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-shimmer', className)} />;
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3.5">
      <div className="h-9 w-9 shrink-0 animate-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 animate-shimmer" />
        <div className="h-2.5 w-20 animate-shimmer" />
      </div>
      <div className="h-3.5 w-16 animate-shimmer" />
    </div>
  );
}

export function WalletAddressSkeleton() {
  return (
    <div className="space-y-4 border border-border bg-card p-5">
      <div className="h-3 w-20 animate-shimmer" />
      <div className="mx-auto h-36 w-36 animate-shimmer" />
      <div className="h-4 w-full animate-shimmer" />
    </div>
  );
}
