'use client';

import { X } from 'lucide-react';
import { useToastStore, type Toast } from '@/store/toast.store';
import { cn } from '@/lib/utils';

const VARIANT_STYLES = {
  success: 'border-status-up/20 bg-status-up/[0.08] text-status-up',
  error:   'border-destructive/20 bg-destructive/[0.08] text-destructive',
  warn:    'border-status-warn/20 bg-status-warn/[0.08] text-status-warn',
  info:    'border-border bg-card text-foreground',
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className={cn(
        'flex items-start gap-3 border px-4 py-3 animate-slide-up',
        VARIANT_STYLES[toast.variant],
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-[12px] opacity-80 leading-snug">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
