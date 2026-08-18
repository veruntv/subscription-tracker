"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { MonthCalendar, shiftMonth } from "~/components/month-calendar";
import { SubscriptionDialog } from "~/components/subscription-dialog";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import {
  addDemoSubscription,
  loadDemoState,
  removeDemoSubscription,
  resetDemoState,
  setDemoStatus,
  updateDemoSettings,
  updateDemoSubscription,
  type DemoState,
} from "~/lib/demo/store";
import { todayUtcCivil, formatCivil } from "~/lib/domain/civil-date";
import {
  CADENCE_LABELS,
  CATEGORY_LABELS,
  CURRENCIES,
  STATUS_LABELS,
  TIMEZONES,
} from "~/lib/domain/labels";
import { formatMinor } from "~/lib/domain/money";
import { totalsByCategory, totalsByCurrency, upcomingCharges } from "~/lib/domain/totals";
import type { Subscription, SubscriptionInput, UserSettings } from "~/lib/domain/types";
import { api } from "~/trpc/react";

export function TrackerApp({
  accountReady,
  signedIn,
  email,
  magicLinkReady,
}: {
  accountReady: boolean;
  signedIn: boolean;
  email: string | null;
  magicLinkReady: boolean;
}) {
  const today = todayUtcCivil();
  const [demo, setDemo] = useState<DemoState | null>(null);
  const [month, setMonth] = useState({ year: today.year, month: today.month });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!accountReady) {
      setDemo(loadDemoState());
    }
  }, [accountReady]);

  const listQuery = api.subscription.list.useQuery(undefined, {
    enabled: accountReady,
  });
  const settingsQuery = api.settings.get.useQuery(undefined, {
    enabled: accountReady,
  });
  const createMut = api.subscription.create.useMutation({
    onSuccess: () => void listQuery.refetch(),
  });
  const updateMut = api.subscription.update.useMutation({
    onSuccess: () => void listQuery.refetch(),
  });
  const statusMut = api.subscription.setStatus.useMutation({
    onSuccess: () => void listQuery.refetch(),
  });
  const removeMut = api.subscription.remove.useMutation({
    onSuccess: () => void listQuery.refetch(),
  });
  const settingsMut = api.settings.update.useMutation({
    onSuccess: () => void settingsQuery.refetch(),
  });

  const items = accountReady ? (listQuery.data ?? []) : (demo?.subscriptions ?? []);
  const settings: UserSettings = accountReady
    ? {
        timezone: settingsQuery.data?.timezone ?? "UTC",
        defaultCurrency: settingsQuery.data?.defaultCurrency ?? "USD",
      }
    : (demo?.settings ?? { timezone: "Europe/Chisinau", defaultCurrency: "EUR" });

  const currencyTotals = useMemo(() => totalsByCurrency(items), [items]);
  const categoryTotals = useMemo(() => totalsByCategory(items), [items]);
  const upcoming = useMemo(() => upcomingCharges(items), [items]);
  const primary = currencyTotals[0];

  const save = (input: SubscriptionInput) => {
    if (accountReady) {
      if (editing) {
        updateMut.mutate({ ...input, id: editing.id });
      } else {
        createMut.mutate(input);
      }
    } else if (demo) {
      setDemo(
        editing
          ? updateDemoSubscription(demo, editing.id, input)
          : addDemoSubscription(demo, input),
      );
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const setStatus = (id: string, status: Subscription["status"]) => {
    if (accountReady) {
      statusMut.mutate({ id, status });
      return;
    }
    if (demo) setDemo(setDemoStatus(demo, id, status));
  };

  const remove = (id: string) => {
    if (accountReady) {
      removeMut.mutate({ id });
      return;
    }
    if (demo) setDemo(removeDemoSubscription(demo, id));
  };

  const saveSettings = (next: UserSettings) => {
    if (accountReady) {
      settingsMut.mutate(next);
    } else if (demo) {
      setDemo(updateDemoSettings(demo, next));
    }
    setSettingsOpen(false);
  };

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto w-full max-w-[1280px] px-10 py-8">
        <header className="flex items-start justify-between gap-8 border-b border-border pb-6">
          <div>
            <p className="font-display text-2xl tracking-tight">Subscription Tracker</p>
            <p className="mt-1 text-sm text-muted">
              Recurring charges, calendar, and a reminder before the next deduction.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {accountReady ? (
              <p className="text-sm text-muted">{email}</p>
            ) : (
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-accent shadow-border">
                Demo
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              Settings
            </Button>
            {accountReady ? null : (
              <Button asChild size="sm">
                <Link href="/login">{magicLinkReady || signedIn ? "Sign in" : "Keep a real list"}</Link>
              </Button>
            )}
          </div>
        </header>

        {!accountReady ? (
          <p className="mt-4 text-sm text-muted">
            Demo data stays on this device and never sends email.{" "}
            <button
              type="button"
              className="text-fg underline-offset-4 hover:underline"
              onClick={() => setDemo(resetDemoState())}
            >
              Reset demo
            </button>
          </p>
        ) : null}

        <section className="mt-8 grid grid-cols-12 gap-6">
          <article className="col-span-4 rounded-2xl bg-surface p-6 shadow-border">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              This month
            </p>
            <p className="mt-2 font-display text-4xl tabular-nums tracking-tight">
              {primary ? formatMinor(primary.monthly, primary.currency) : "—"}
            </p>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted">
              This year
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums">
              {primary ? formatMinor(primary.yearly, primary.currency) : "—"}
            </p>
            {currencyTotals.length > 1 ? (
              <ul className="mt-4 space-y-1 text-sm text-muted">
                {currencyTotals.slice(1).map((row) => (
                  <li key={row.currency}>
                    {formatMinor(row.monthly, row.currency)} / mo
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <article className="col-span-8 rounded-2xl bg-surface p-6 shadow-border">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              By category
            </p>
            <ul className="mt-4 divide-y divide-border">
              {categoryTotals.length === 0 ? (
                <li className="py-3 text-sm text-muted">No active subscriptions.</li>
              ) : (
                categoryTotals.map((row) => {
                  const share = primary && primary.yearly > 0 ? row.yearly / primary.yearly : 0;
                  return (
                    <li
                      key={`${row.category}-${row.currency}`}
                      className="grid grid-cols-[9rem_1fr_8rem] items-center gap-4 py-2.5"
                    >
                      <span className="text-sm">{CATEGORY_LABELS[row.category]}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-bg">
                        <span
                          className="block h-full rounded-full bg-accent/80"
                          style={{ width: `${Math.max(6, Math.round(share * 100))}%` }}
                        />
                      </span>
                      <span className="text-right text-sm tabular-nums">
                        {formatMinor(row.yearly, row.currency)} / yr
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </article>

          <article className="col-span-4 rounded-2xl bg-surface p-6 shadow-border">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              Next charges
            </p>
            <ul className="mt-4 space-y-3">
              {upcoming.length === 0 ? (
                <li className="text-sm text-muted">Nothing upcoming.</li>
              ) : (
                upcoming.map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-3">
                    <div>
                      <p className="text-sm">{item.name}</p>
                      <p className="text-xs text-muted">{formatCivil(item.nextChargeAt)}</p>
                    </div>
                    <p className="text-sm tabular-nums">
                      {formatMinor(item.amount, item.currency)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </article>

          <div className="col-span-8 min-w-0">
            <MonthCalendar
              year={month.year}
              month={month.month}
              today={today}
              items={items}
              onPrev={() => setMonth((current) => shiftMonth(current.year, current.month, -1))}
              onNext={() => setMonth((current) => shiftMonth(current.year, current.month, 1))}
            />
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-surface p-6 shadow-border">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                Subscriptions
              </p>
              <h2 className="font-display text-2xl tracking-tight">All charges</h2>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              Add subscription
            </Button>
          </header>

          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr className="border-b border-border">
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">Cadence</th>
                <th className="py-2 font-medium">Next</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/70">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.cancelUrl ? (
                        <a
                          href={item.cancelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted hover:text-fg"
                          aria-label={`Cancel ${item.name}`}
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted">{CATEGORY_LABELS[item.category]}</p>
                  </td>
                  <td className="py-3 tabular-nums">
                    {formatMinor(item.amount, item.currency)}
                  </td>
                  <td className="py-3 text-muted">
                    {CADENCE_LABELS[item.cadence]}
                    {item.intervalCount > 1 ? ` ×${item.intervalCount}` : ""}
                  </td>
                  <td className="py-3 tabular-nums">{formatCivil(item.nextChargeAt)}</td>
                  <td className="py-3">
                    <span
                      className={
                        item.status === "active"
                          ? "text-ok"
                          : item.status === "canceled"
                            ? "text-danger"
                            : "text-muted"
                      }
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(item);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      {item.status === "active" ? (
                        <Button variant="ghost" size="sm" onClick={() => setStatus(item.id, "paused")}>
                          Pause
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setStatus(item.id, "active")}>
                          Resume
                        </Button>
                      )}
                      {item.status !== "canceled" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStatus(item.id, "canceled")}
                        >
                          Cancel
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <SubscriptionDialog
        open={dialogOpen}
        initial={editing}
        defaultCurrency={settings.defaultCurrency}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSubmit={save}
      />

      {settingsOpen ? (
        <SettingsDialog
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={saveSettings}
        />
      ) : null}
    </main>
  );
}

function SettingsDialog({
  settings,
  onClose,
  onSave,
}: {
  settings: UserSettings;
  onClose: () => void;
  onSave: (settings: UserSettings) => void;
}) {
  const [timezone, setTimezone] = useState(settings.timezone);
  const [defaultCurrency, setDefaultCurrency] = useState(settings.defaultCurrency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-8">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-border">
        <h2 className="font-display text-2xl tracking-tight">Settings</h2>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              id="timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default-currency">Default currency</Label>
            <Select
              id="default-currency"
              value={defaultCurrency}
              onChange={(event) => setDefaultCurrency(event.target.value)}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onSave({ timezone, defaultCurrency })}>Save</Button>
        </div>
      </div>
    </div>
  );
}
