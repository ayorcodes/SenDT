'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore, type Toast } from '@/store/toast.store';
import { useEventsStore } from '@/store/events.store';
import type { EventType } from '@sendt/types';

type PushFn = (toast: Omit<Toast, 'id'>) => void;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type SSEPayload = {
  type: EventType;
  data: Record<string, unknown>;
};

export function useEvents() {
  const { accessToken } = useAuthStore();
  const push = useToastStore((s) => s.push);
  const notifyDeposit = useEventsStore((s) => s.notifyDeposit);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const es = new EventSource(`${API_URL}/events?token=${accessToken}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload: SSEPayload = JSON.parse(event.data);
        handleEvent(payload, push, notifyDeposit);
      } catch {}
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [accessToken, push]);
}

function handleEvent(payload: SSEPayload, push: PushFn, notifyDeposit: () => void) {
  switch (payload.type) {
    case 'DEPOSIT_CONFIRMED':
      push({
        variant: 'success',
        title: 'Deposit Confirmed',
        message: `Your deposit of ${payload.data.cryptoAmount} ${payload.data.asset} has been credited.`,
      });
      notifyDeposit();
      break;
    case 'TRANSFER_COMPLETED':
      push({
        variant: 'success',
        title: 'Transfer Successful',
        message: `₦${payload.data.amount} sent successfully.`,
      });
      break;
    case 'TRANSFER_FAILED':
      push({
        variant: 'error',
        title: 'Transfer Failed',
        message: 'Your transfer could not be completed. Your balance has been reversed.',
      });
      break;
  }
}
