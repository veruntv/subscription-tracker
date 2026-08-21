import { useEffect, useState } from "react";

import { BrandNameField } from "~/components/brand-name-field";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { resolveBrand } from "~/lib/domain/brands";
import { civilFromIso, civilToIso } from "~/lib/domain/civil-date";
import {
  CADENCE_LABELS,
  CATEGORY_LABELS,
  CURRENCIES,
} from "~/lib/domain/labels";
import { minorToInput, parseAmountInput } from "~/lib/domain/money";
import type { Cadence, Category, Subscription, SubscriptionInput } from "~/lib/domain/types";
import { CADENCES, CATEGORIES } from "~/lib/domain/types";

type FormState = {
  name: string;
  amount: string;
  currency: string;
  cadence: Cadence;
  intervalCount: string;
  startedAt: string;
  category: Category;
  cancelUrl: string;
  notifyDaysBefore: string;
};

function blankForm(currency: string): FormState {
  return {
    name: "",
    amount: "",
    currency,
    cadence: "monthly",
    intervalCount: "1",
    startedAt: "",
    category: "other",
    cancelUrl: "",
    notifyDaysBefore: "3",
  };
}

export function SubscriptionDialog({
  open,
  initial,
  defaultCurrency,
  pending = false,
  error: submitError = null,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial: Subscription | null;
  defaultCurrency: string;
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: SubscriptionInput) => void;
}) {
  const [form, setForm] = useState<FormState>(() => blankForm(defaultCurrency));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        amount: minorToInput(initial.amount, initial.currency),
        currency: initial.currency,
        cadence: initial.cadence,
        intervalCount: String(initial.intervalCount),
        startedAt: civilToIso(initial.startedAt),
        category: initial.category,
        cancelUrl: initial.cancelUrl ?? "",
        notifyDaysBefore: String(initial.notifyDaysBefore),
      });
    } else {
      setForm(blankForm(defaultCurrency));
    }
    setError(null);
  }, [open, initial, defaultCurrency]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open) return null;

  const submit = () => {
    const amount = parseAmountInput(form.amount, form.currency);
    const startedAt = civilFromIso(form.startedAt);
    const intervalCount = Number(form.intervalCount);
    const notifyDaysBefore = Number(form.notifyDaysBefore);
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (amount === null) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!startedAt) {
      setError("Pick a valid first-charge date.");
      return;
    }
    if (!Number.isInteger(intervalCount) || intervalCount < 1 || intervalCount > 24) {
      setError("Interval must be between 1 and 24.");
      return;
    }
    if (!Number.isInteger(notifyDaysBefore) || notifyDaysBefore < 0 || notifyDaysBefore > 30) {
      setError("Reminder days must be between 0 and 30.");
      return;
    }
    const cancelUrl = form.cancelUrl.trim();
    if (cancelUrl) {
      try {
        new URL(cancelUrl);
      } catch {
        setError("Cancel link must be a full URL.");
        return;
      }
    }

    const brand = resolveBrand(form.name.trim());
    onSubmit({
      name: form.name,
      amount,
      currency: form.currency,
      cadence: form.cadence,
      intervalCount,
      startedAt,
      category: form.category === "other" && brand ? brand.category : form.category,
      cancelUrl: cancelUrl || null,
      notifyDaysBefore,
      status: initial?.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-fg/30 p-0 sm:items-center sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-dialog-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-border sm:rounded-2xl sm:p-6"
      >
        <h2 id="subscription-dialog-title" className="font-display text-2xl tracking-tight">
          {initial ? "Edit subscription" : "Add subscription"}
        </h2>
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pending) submit();
          }}
        >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <BrandNameField
              id="name"
              value={form.name}
              onChange={(name) => setForm({ ...form, name })}
              onPick={(brand) => setForm({ ...form, name: brand.name, category: brand.category })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cadence">Cadence</Label>
            <Select
              id="cadence"
              value={form.cadence}
              onChange={(event) =>
                setForm({ ...form, cadence: event.target.value as Cadence })
              }
            >
              {CADENCES.map((cadence) => (
                <option key={cadence} value={cadence}>
                  {CADENCE_LABELS[cadence]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="interval">Every N periods</Label>
            <Input
              id="interval"
              type="number"
              min={1}
              max={24}
              value={form.intervalCount}
              onChange={(event) =>
                setForm({ ...form, intervalCount: event.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="started">First charge</Label>
            <Input
              id="started"
              type="date"
              value={form.startedAt}
              onChange={(event) => setForm({ ...form, startedAt: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value as Category })
              }
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notify">Remind days before</Label>
            <Input
              id="notify"
              type="number"
              min={0}
              max={30}
              value={form.notifyDaysBefore}
              onChange={(event) =>
                setForm({ ...form, notifyDaysBefore: event.target.value })
              }
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="cancel">Cancel URL</Label>
            <Input
              id="cancel"
              placeholder="https://"
              value={form.cancelUrl}
              onChange={(event) => setForm({ ...form, cancelUrl: event.target.value })}
            />
          </div>
        </div>
        {error || submitError ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error ?? submitError}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : initial ? "Save" : "Add"}
          </Button>
        </div>
        </form>
      </div>
    </div>
  );
}
