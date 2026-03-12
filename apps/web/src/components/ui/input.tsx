import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, mono, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'form-input',
          hasError && 'form-input-error',
          mono && 'form-input-mono',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
