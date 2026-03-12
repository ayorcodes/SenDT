'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ratesApi } from '@/services/api';
import type { Rate } from '@sendt/types';

const REFRESH_INTERVAL = 30 * 60; // 30 minutes in seconds

export function useRates() {
  const [rates, setRates]         = useState<Rate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const timerRef                  = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRates = useCallback(async () => {
    try {
      const data = await ratesApi.getAll();
      setRates(data);
      setCountdown(REFRESH_INTERVAL);
    } catch {
      // keep stale rates on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();

    timerRef.current = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) { fetchRates(); return REFRESH_INTERVAL; }
        return s - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchRates]);

  const getRate = (asset: string) =>
    rates.find((r) => r.asset === asset)?.rate ?? null;

  const formatCountdown = () => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return { rates, loading, countdown, formatCountdown, getRate, refetch: fetchRates };
}
