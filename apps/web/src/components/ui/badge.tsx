import { cn } from '@/lib/utils';
import type { TransactionStatus } from '@sendt/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warn' | 'error' | 'muted' | 'accent';
  className?: string;
}

const VARIANTS = {
  success: 'badge-success',
  warn:    'badge-warn',
  error:   'badge-error',
  muted:   'badge-muted',
  accent:  'badge-accent',
};

export function Badge({ children, variant = 'muted', className }: BadgeProps) {
  return (
    <span className={cn('badge', VARIANTS[variant], className)}>{children}</span>
  );
}

// ── Transaction status badge ──────────────────────────────────────────────────

const STATUS_VARIANT: Record<TransactionStatus, BadgeProps['variant']> = {
  COMPLETED:  'success',
  PENDING:    'warn',
  PROCESSING: 'accent',
  FAILED:     'error',
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  COMPLETED:  'Completed',
  PENDING:    'Pending',
  PROCESSING: 'Processing',
  FAILED:     'Failed',
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
