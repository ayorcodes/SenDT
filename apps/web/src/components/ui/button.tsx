import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  loading?: boolean;
}

const VARIANTS = {
  primary:     'btn-primary',
  secondary:   'btn-secondary',
  ghost:       'btn-ghost',
  destructive: 'btn-destructive',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3.5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  asChild = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      disabled={disabled || loading}
      className={cn(VARIANTS[variant], SIZES[size], 'w-full justify-center', className)}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {children}
        </span>
      ) : (
        children
      )}
    </Comp>
  );
}
