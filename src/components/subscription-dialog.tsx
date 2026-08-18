import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
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
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial: Subscription | null;
  defaultCurrency: string;
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
    if (!Number.isInteger(intervalCount) || intervalCount < 1) {
      setError("Interval must be at least 1.");
      return;
    }
    if (!Number.isInteger(notifyDaysBefore) || notifyDaysBefore < 0) {
      setError("Reminder days must be 0 or more.");
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

    onSubmit({
      name: form.name,
      amount,
      currency: form.currency,
      cadence: form.cadence,
      intervalCount,
      startedAt,
      category: form.category,
      cancelUrl: cancelUrl || null,
      notifyDaysBefore,
      status: initial?.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-dialog-title"
        className="w-full max-w-xl rounded-2xl bg-surface p-6 shadow-border"
      >
        <h2 id="subscription-dialog-title" className="font-display text-2xl tracking-tight">
          {initial ? "Edit subscription" : "Add subscription"}
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
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
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{initial ? "Save" : "Add"}</Button>
        </div>
      </div>
    </div>
  );
}
