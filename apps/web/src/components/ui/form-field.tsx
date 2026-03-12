import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, hint, error, children, className }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="form-label">
        {label}
        {required && (
          <span className="ml-0.5 font-normal normal-case tracking-normal text-foreground/20">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="form-error-msg">{error}</p>
      ) : hint ? (
        <p className="form-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 border border-destructive/20 bg-destructive/[0.05] px-3.5 py-3 animate-fade-in">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

interface InputAffixProps {
  suffix?: string;
  prefix?: string;
  children: React.ReactNode;
}

export function InputAffix({ suffix, prefix, children }: InputAffixProps) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none font-mono text-sm font-medium text-muted-foreground">
          {prefix}
        </span>
      )}
      <div className={cn(prefix && '[&>*]:pl-9', suffix && '[&>*]:pr-9')}>{children}</div>
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 select-none text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}
