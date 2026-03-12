"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronLeft, AlertCircle } from "lucide-react";
import { useBalance } from "@/hooks/use-balance";
import { transfersApi, banksApi } from "@/services/api";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FormField, FormErrorBanner } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/number-input";
import { Spinner } from "@/components/ui/spinner";
import { fmtCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Step = "account" | "amount" | "confirm";

interface Bank { code: string; name: string; }

export default function SendPage() {
  const { fiat, loading: balLoading } = useBalance();

  // Step state
  const [step, setStep]                   = useState<Step>("account");

  // Account fields
  const [banks, setBanks]                 = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading]   = useState(true);
  const [bankCode, setBankCode]           = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName]     = useState("");
  const [resolving, setResolving]         = useState(false);
  const [resolveError, setResolveError]   = useState("");

  // Amount fields
  const [amount, setAmount]               = useState("");
  const [amountError, setAmountError]     = useState("");

  // Confirm sheet
  const [showConfirm, setShowConfirm]     = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState("");
  const [done, setDone]                   = useState(false);

  // Load banks
  useEffect(() => {
    banksApi.getAll()
      .then((list) => {
        const seen = new Set<string>();
        setBanks(list.filter((b) => !seen.has(b.code) && !!seen.add(b.code)));
      })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, []);

  // Auto-resolve account name when account number is 10 digits
  useEffect(() => {
    if (accountNumber.length !== 10 || !bankCode) {
      setAccountName("");
      setResolveError("");
      return;
    }
    setResolving(true);
    setResolveError("");
    setAccountName("");
    transfersApi
      .resolveAccount({ bankCode, accountNumber })
      .then((res) => setAccountName(res.accountName))
      .catch(() => setResolveError("Account not found. Check the details and try again."))
      .finally(() => setResolving(false));
  }, [accountNumber, bankCode]);

  function handleAccountNext() {
    if (!bankCode || !accountNumber || !accountName) return;
    setStep("amount");
  }

  function handleAmountNext() {
    const num = parseFloat(amount);
    const available = parseFloat(fiat?.amount ?? "0");
    if (!num || num <= 0) { setAmountError("Enter a valid amount"); return; }
    if (num > available) { setAmountError("Insufficient balance"); return; }
    if (num < 100) { setAmountError("Minimum transfer is ₦100"); return; }
    setAmountError("");
    setShowConfirm(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError("");
    try {
      await transfersApi.initiate({
        bankCode,
        bankName,
        accountNumber,
        accountName,
        amount: parseFloat(amount),
      });
      setShowConfirm(false);
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Transfer failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("account");
    setBankCode("");
    setAccountNumber("");
    setAccountName("");
    setAmount("");
    setAmountError("");
    setDone(false);
  }

  const bankName = banks.find((b) => b.code === bankCode)?.name ?? "";

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in space-y-4">
        <div className="flex h-14 w-14 items-center justify-center bg-status-up/[0.1] border border-status-up/20">
          <span className="text-2xl">✓</span>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">Transfer initiated</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmtCurrency(amount)} to {accountName}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground/60">
            You'll be notified when it's confirmed
          </p>
        </div>
        <button
          onClick={reset}
          className="mt-4 text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          Make another transfer
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {step !== "account" && (
          <button
            onClick={() => setStep(step === "amount" ? "account" : "amount")}
            className="mr-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex gap-1.5">
          {(["account", "amount"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 w-8 transition-colors duration-200",
                step === s || (step === "confirm" && i < 2)
                  ? "bg-primary"
                  : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      {/* Step 1 — Account details */}
      {step === "account" && (
        <div className="space-y-5 animate-slide-up">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Send money</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Enter the recipient's bank details.
            </p>
          </div>

          {/* Bank select */}
          <FormField label="Bank">
            <div className="relative">
              {banksLoading ? (
                <div className="form-input flex items-center gap-2 text-muted-foreground">
                  <Spinner size="sm" />
                  Loading banks…
                </div>
              ) : (
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="form-input appearance-none pr-9 bg-card"
                >
                  <option value="">Select bank</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              )}
              {!banksLoading && (
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
          </FormField>

          {/* Account number */}
          <FormField
            label="Account number"
            hint={resolving ? "Verifying…" : accountName ? undefined : "10-digit account number"}
            error={resolveError}
          >
            <Input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="0000000000"
              hasError={!!resolveError}
              mono
            />
          </FormField>

          {/* Resolved account name */}
          {accountName && (
            <div className="flex items-center gap-2 border border-status-up/20 bg-status-up/[0.05] px-3.5 py-3 animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-status-up shrink-0" />
              <p className="text-sm font-semibold text-foreground">{accountName}</p>
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={handleAccountNext}
              disabled={!bankCode || !accountNumber || !accountName || resolving}
              size="lg"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — Amount */}
      {step === "amount" && (
        <div className="space-y-5 animate-slide-up">
          <div className="mb-2">
            <h2 className="text-xl font-bold text-foreground">How much?</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Sending to <span className="text-foreground font-medium">{accountName}</span>
              {bankName && <> · {bankName}</>}
            </p>
          </div>

          {/* Available balance */}
          {!balLoading && fiat && (
            <div className="flex items-center justify-between border border-border bg-card px-4 py-3">
              <p className="text-[12px] text-muted-foreground">Available</p>
              <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
                {fmtCurrency(fiat.amount)}
              </p>
            </div>
          )}

          {/* Amount input */}
          <AmountInput
            value={amount}
            onChange={setAmount}
            hasError={!!amountError}
          />

          {amountError && (
            <p className="flex items-center gap-1.5 text-[12px] text-destructive animate-fade-in">
              <AlertCircle className="h-3.5 w-3.5" />
              {amountError}
            </p>
          )}

          <div className="pt-2">
            <Button onClick={handleAmountNext} size="lg" disabled={!amount}>
              Review transfer
            </Button>
          </div>
        </div>
      )}

      {/* Confirm bottom sheet */}
      {showConfirm && (
        <BottomSheet
          title="Confirm transfer"
          onClose={() => setShowConfirm(false)}
          footer={
            <div className="space-y-3">
              {submitError && <FormErrorBanner message={submitError} />}
              <Button onClick={handleConfirm} loading={submitting} size="lg">
                Send {fmtCurrency(amount)}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="border border-border divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3.5">
                <p className="text-[12px] text-muted-foreground">Recipient</p>
                <p className="text-sm font-semibold text-foreground">{accountName}</p>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <p className="text-[12px] text-muted-foreground">Bank</p>
                <p className="text-sm text-foreground">{bankName}</p>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <p className="text-[12px] text-muted-foreground">Account</p>
                <p className="font-mono text-sm text-foreground">{accountNumber}</p>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <p className="text-[12px] text-muted-foreground">Amount</p>
                <p className="font-mono text-base font-bold text-foreground tabular-nums">
                  {fmtCurrency(amount)}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Transfers are processed instantly. Once confirmed, this cannot be reversed.
            </p>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
