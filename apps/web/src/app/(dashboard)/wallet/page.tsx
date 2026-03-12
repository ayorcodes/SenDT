"use client";

import { useState, useCallback, useEffect } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useBalance } from "@/hooks/use-balance";
import { useRates } from "@/hooks/use-rates";
import { walletApi } from "@/services/api";
import { BalanceCard, BalanceCardSkeleton, CryptoBalanceCard } from "@/components/ui/stat-card";
import { WalletAddressSkeleton } from "@/components/ui/skeleton";
import { fmtCurrency, fmtCrypto } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Asset } from "@sendt/types";

const ASSETS: { id: Asset; label: string; chain: string; hint: string }[] = [
  { id: Asset.USDT, label: "USDT", chain: "ethereum", hint: "ERC-20 · Ethereum" },
  { id: Asset.ETH,  label: "ETH",  chain: "ethereum", hint: "Ethereum" },
  { id: Asset.BTC,  label: "BTC",  chain: "bitcoin",  hint: "Bitcoin" },
];

function AddressCard({
  address,
  chain,
  hint,
  loading,
}: {
  address: string | null;
  chain: string;
  hint: string;
  loading: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <WalletAddressSkeleton />;

  return (
    <div className="border border-border bg-card p-5 space-y-4">
      <p className="section-label">{hint} address</p>

      {address ? (
        <>
          {/* Address display */}
          <div className="border border-border bg-background px-4 py-3">
            <p className="font-mono text-sm text-foreground break-all leading-relaxed">
              {address}
            </p>
          </div>

          {/* Copy button */}
          <button
            onClick={copy}
            className={cn(
              "flex w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98]",
              copied
                ? "bg-status-up/[0.08] text-status-up"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy address
              </>
            )}
          </button>

          {/* Warning */}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Only send {hint.split(" · ")[0]} to this address. Sending other assets may result in permanent loss.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Could not load address. Try again.</p>
      )}
    </div>
  );
}

export default function WalletPage() {
  const [activeAsset, setActiveAsset] = useState<Asset>(Asset.USDT);
  const [address, setAddress]         = useState<string | null>(null);
  const [addrLoading, setAddrLoading] = useState(true);

  const { fiat, crypto, loading: balLoading } = useBalance();
  const { rates, loading: rateLoading, formatCountdown, getRate } = useRates();

  const assetMeta = ASSETS.find((a) => a.id === activeAsset)!;

  const loadAddress = useCallback(async (asset: Asset) => {
    setAddrLoading(true);
    setAddress(null);
    try {
      const res = await walletApi.getOrCreate(asset);
      setAddress(res.address);
    } catch {
      setAddress(null);
    } finally {
      setAddrLoading(false);
    }
  }, []);

  // Load address on mount
  useEffect(() => { loadAddress(activeAsset); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function switchAsset(asset: Asset) {
    setActiveAsset(asset);
    loadAddress(asset);
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* NGN balance */}
      {balLoading ? (
        <BalanceCardSkeleton />
      ) : (
        <BalanceCard
          label="Available balance"
          value={fmtCurrency(fiat?.amount ?? "0")}
        />
      )}

      {/* Deposit section */}
      <div>
        <p className="section-label mb-3">Deposit crypto</p>

        {/* Asset tabs */}
        <div className="mb-4 flex border border-border">
          {ASSETS.map((a) => (
            <button
              key={a.id}
              onClick={() => switchAsset(a.id)}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold transition-colors duration-150",
                activeAsset === a.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Address card */}
        <AddressCard
          address={address}
          chain={assetMeta.chain}
          hint={assetMeta.hint}
          loading={addrLoading}
        />
      </div>

      {/* Crypto holdings */}
      {!balLoading && crypto.length > 0 && (
        <div>
          <p className="section-label mb-2">Your holdings</p>
          <div className="border border-border divide-y divide-border">
            {crypto.map((b) => {
              const rate = getRate(b.asset);
              const ngnValue = rate
                ? parseFloat(b.amount) * parseFloat(rate)
                : 0;
              return (
                <CryptoBalanceCard
                  key={b.asset}
                  asset={b.asset}
                  amount={fmtCrypto(b.amount, b.asset)}
                  valueNgn={fmtCurrency(ngnValue)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Live rates */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="section-label">Live rates</p>
          {!rateLoading && (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              Updates in {formatCountdown()}
            </p>
          )}
        </div>
        <div className="border border-border divide-y divide-border">
          {rateLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="h-3 w-12 animate-shimmer" />
                  <div className="h-3 w-24 animate-shimmer" />
                </div>
              ))
            : ASSETS.map((a) => {
                const rate = getRate(a.id);
                return (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3">
                    <p className="font-mono text-sm font-semibold text-foreground">1 {a.id}</p>
                    <p className="font-mono text-sm tabular-nums text-foreground">
                      {rate ? fmtCurrency(rate) : "—"}
                    </p>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
