'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  value: string | number;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

function formatNumber(val: string | number): string {
  const raw = String(val).replace(/,/g, '');
  if (raw === '' || raw === '-') return raw;
  const [integer, decimal] = raw.split('.');
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
}

export function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  disabled,
  hasError,
  className,
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPos = input.selectionStart ?? 0;
    const charsBeforeCursor = input.value.slice(0, cursorPos).replace(/,/g, '').length;

    const raw = input.value.replace(/[^0-9.]/g, '');
    onChange(raw);

    const newFormatted = formatNumber(raw);
    let charCount = 0;
    let newCursorPos = newFormatted.length;
    for (let i = 0; i < newFormatted.length; i++) {
      if (charCount === charsBeforeCursor) { newCursorPos = i; break; }
      if (newFormatted[i] !== ',') charCount++;
    }

    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  return (
    <div
      className={cn(
        'flex items-stretch border bg-card transition-all duration-150',
        'hover:border-foreground/15',
        'focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/[0.08]',
        hasError
          ? 'border-destructive/40 focus-within:border-destructive/50 focus-within:ring-destructive/[0.08]'
          : 'border-border',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      {prefix && (
        <span className="flex shrink-0 items-center border-r border-border/50 bg-foreground/[0.03] px-3.5 font-mono text-sm font-semibold text-muted-foreground select-none">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={formatNumber(value)}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent px-3.5 py-3 font-mono text-sm tabular-nums text-foreground outline-none placeholder:text-muted-foreground/40"
      />
      {suffix && (
        <span className="flex shrink-0 items-center border-l border-border/50 bg-foreground/[0.03] px-3.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground select-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

// ── Large centered amount input used on the Send screen ──────────────────────
interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  placeholder?: string;
  hasError?: boolean;
}

export function AmountInput({
  value,
  onChange,
  currency = '₦',
  placeholder = '0',
  hasError,
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    onChange(raw);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 py-6',
        hasError && 'opacity-80',
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="font-mono text-4xl font-light text-muted-foreground">{currency}</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={value ? formatNumber(value) : ''}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'min-w-[2ch] max-w-full bg-transparent font-mono text-5xl font-semibold tabular-nums outline-none',
          'placeholder:text-foreground/15',
          hasError ? 'text-destructive' : 'text-foreground',
        )}
        style={{ width: `${Math.max((value || placeholder).length, 2)}ch` }}
      />
    </div>
  );
}
