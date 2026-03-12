import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'h-4 w-4 border-[1.5px]',
  md: 'h-5 w-5 border-2',
  lg: 'h-7 w-7 border-2',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-foreground/15 border-t-foreground/60',
        SIZES[size],
        className,
      )}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
