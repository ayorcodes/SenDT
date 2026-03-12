'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, Copy, Plus, Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { walletApi } from '@/services/api';
import { truncateAddress, cn } from '@/lib/utils';
import type { Wallet } from '@sendt/types';

// Supported chains shown in the sheet (BTC excluded from UI)
const CHAIN_META: { chain: string; label: string; assets: string; createAsset: string }[] = [
  {
    chain: 'ETHEREUM',
    label: 'Ethereum',
    assets: 'USDT · USDC · ETH',
    createAsset: 'USDT',
  },
];

interface WalletRowProps {
  label: string;
  assets: string;
  address: string;
}

function WalletRow({ label, assets, address }: WalletRowProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{assets}</p>
        </div>
        <button
          onClick={copy}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
            copied
              ? 'bg-status-up/[0.08] text-status-up'
              : 'bg-muted text-foreground hover:bg-muted/80',
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="border border-border bg-card px-3 py-2">
        <p className="font-mono text-xs text-muted-foreground break-all leading-relaxed">
          {address}
        </p>
      </div>
    </div>
  );
}

interface DepositSheetProps {
  onClose: () => void;
}

export function DepositSheet({ onClose }: DepositSheetProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    try {
      const data = await walletApi.getAll();
      setWallets(data);
    } catch {
      // silently fail — empty state shows create buttons
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  async function createWallet(asset: string, chain: string) {
    setCreating(chain);
    try {
      const wallet = await walletApi.getOrCreate(asset);
      setWallets((prev) => [...prev, wallet]);
    } catch {
      // TODO: show error toast
    } finally {
      setCreating(null);
    }
  }

  return (
    <BottomSheet title="Deposit crypto" onClose={onClose}>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          CHAIN_META.map(({ chain, label, assets, createAsset }) => {
            const wallet = wallets.find((w) => w.chain === chain);

            if (wallet) {
              return (
                <WalletRow
                  key={chain}
                  label={label}
                  assets={assets}
                  address={wallet.address}
                />
              );
            }

            return (
              <button
                key={chain}
                onClick={() => createWallet(createAsset, chain)}
                disabled={creating === chain}
                className="flex w-full items-center justify-center gap-2 border border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
              >
                {creating === chain ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {creating === chain ? 'Creating…' : `Add ${label} wallet`}
              </button>
            );
          })
        )}

        <p className="text-center text-[11px] text-muted-foreground pt-1">
          Only send supported ERC-20 tokens to Ethereum addresses.
        </p>
      </div>
    </BottomSheet>
  );
}
