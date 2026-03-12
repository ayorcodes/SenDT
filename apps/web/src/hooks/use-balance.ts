'use client';

import { useState, useEffect, useCallback } from 'react';
import { balanceApi } from '@/services/api';
import { useEventsStore } from '@/store/events.store';
import type { FiatBalance, CryptoBalance } from '@sendt/types';

export function useBalance() {
  const [fiat, setFiat]       = useState<FiatBalance | null>(null);
  const [crypto, setCrypto]   = useState<CryptoBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const depositVersion        = useEventsStore((s) => s.depositVersion);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fiatRes, cryptoRes] = await Promise.all([
        balanceApi.getFiat(),
        balanceApi.getCrypto(),
      ]);
      setFiat(fiatRes);
      setCrypto(cryptoRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch, depositVersion]);

  return { fiat, crypto, loading, error, refetch: fetch };
}
