'use client';

import { useState, useEffect, useCallback } from 'react';
import { transactionsApi } from '@/services/api';
import type { Transaction } from '@sendt/types';

interface UseTransactionsOptions {
  limit?: number;
  type?: string;
}

export function useTransactions(opts: UseTransactionsOptions = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionsApi.getAll({ page: p, limit: opts.limit ?? 20, type: opts.type });
      setTransactions(p === 1 ? res.data : (prev) => [...prev, ...res.data]);
      setTotal(res.total);
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [opts.limit, opts.type]);

  useEffect(() => { fetch(1); }, [fetch]);

  const loadMore = () => { if (transactions.length < total) fetch(page + 1); };
  const hasMore  = transactions.length < total;

  return { transactions, total, loading, error, hasMore, loadMore, refetch: () => fetch(1) };
}
