"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Receipt,
  Settings,
} from "lucide-react";

import { MerchantMark } from "~/components/merchant-mark";
import { MonthCalendar, shiftMonth } from "~/components/month-calendar";
import { SubscriptionDialog } from "~/components/subscription-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { formatCivil, todayUtcCivil } from "~/lib/domain/civil-date";
import {
  CADENCE_LABELS,
  CATEGORY_LABELS,
  mixTone,
  CURRENCIES,
  STATUS_LABELS,
  TIMEZONES,
  greetingForHour,
} from "~/lib/domain/labels";
import { formatMinor } from "~/lib/domain/money";
import { categoryMix, totalsByCategory, totalsByCurrency, upcomingCharges } from "~/lib/domain/totals";
import type { Subscription, SubscriptionInput, UserSettings } from "~/lib/domain/types";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "list", label: "Subscriptions", icon: Receipt },
] as const;

type Tab = (typeof TABS)[number]["id"];

function tabFromHash(): Tab {
  if (typeof window === "undefined") return "overview";
  const hash = window.location.hash.replace("#", "");
  return TABS.some((tab) => tab.id === hash) ? (hash as Tab) : "overview";
}

export function TrackerApp({
  accountReady,
  email,
}: {
  accountReady: boolean;
  signedIn?: boolean;
  email: string | null;
  magicLinkReady?: boolean;
}) {
  const today = todayUtcCivil();
  const [month, setMonth] = useState({ year: today.year, month: today.month });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [hour] = useState(() => new Date().getHours());
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    setTab(tabFromHash());
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const openTab = (next: Tab) => {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  };

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

  const items = accountReady ? (listQuery.data ?? []) : [];
  const settings: UserSettings = {
    timezone: settingsQuery.data?.timezone ?? "UTC",
    defaultCurrency: settingsQuery.data?.defaultCurrency ?? "USD",
  };

  const currencyTotals = useMemo(() => totalsByCurrency(items), [items]);
  const categoryTotals = useMemo(() => totalsByCategory(items), [items]);
  const upcoming = useMemo(() => upcomingCharges(items), [items]);
  const primary = currencyTotals[0];
  const mix = useMemo(
    () => (primary ? categoryMix(categoryTotals, primary.currency) : []),
    [categoryTotals, primary],
  );
  const mixTotal = mix.reduce((sum, row) => sum + row.monthly, 0);
  const mixLabels = mix.filter((row) => row.category !== "remainder").slice(0, 3);
  const activeCount = items.filter((item) => item.status === "active").length;
  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const save = (input: SubscriptionInput) => {
    if (accountReady) {
      if (editing) {
        updateMut.mutate({ ...input, id: editing.id });
      } else {
        createMut.mutate(input);
      }
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const setStatus = (id: string, status: Subscription["status"]) => {
    setMenuId(null);
    if (accountReady) {
      statusMut.mutate({ id, status });
    }
  };

  const remove = (id: string) => {
    setMenuId(null);
    if (accountReady) {
      removeMut.mutate({ id });
    }
  };

  const saveSettings = (next: UserSettings) => {
    if (accountReady) {
      settingsMut.mutate(next);
    }
    setSettingsOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-sidebar px-4 py-6 text-surface">
        <div className="px-2">
          <p className="text-sm font-semibold tracking-tight">Subscription Tracker</p>
          <p className="mt-1 text-xs text-sidebar-muted">Recurring charges, in one place</p>
        </div>

        <nav className="mt-8 space-y-1">
          {TABS.map((item) => (
            <SideLink
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={tab === item.id}
              onClick={() => openTab(item.id)}
            />
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          {email ? <p className="truncate px-2 text-xs text-sidebar-muted">{email}</p> : null}
          <Button
            variant="ghost"
            className="w-full justify-start text-surface hover:bg-surface/10 hover:text-surface"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings />
            Settings
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-10 py-8">
        <header className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm text-muted">{greetingForHour(hour)}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {tab === "overview" && "Your recurring spend"}
              {tab === "calendar" && "Calendar"}
              {tab === "list" && "Subscriptions"}
            </h1>
          </div>
          <Button onClick={openCreate}>
            <Plus />
            Add subscription
          </Button>
        </header>

        {tab === "overview" ? (
        <section className="mt-6 grid grid-cols-12 gap-5">
          <article className="col-span-6 rounded-2xl bg-surface p-7 shadow-border">
            <p className="text-sm text-muted">This month</p>
            <p className="mt-2 text-5xl font-semibold tabular-nums tracking-tight">
              {primary ? formatMinor(primary.monthly, primary.currency) : "—"}
            </p>
            {mix.length > 0 ? (
              <>
                <div className="mt-6 flex h-2.5 gap-1 overflow-hidden rounded-full">
                  {mix.map((row, index) => (
                    <span
                      key={row.key}
                      className={cn("h-full min-w-1", mixTone(index))}
                      style={{
                        flexGrow: mixTotal > 0 ? Math.max(row.monthly / mixTotal, 0.04) : 1,
                      }}
                      title={
                        primary
                          ? `${row.category === "remainder" ? "Other" : CATEGORY_LABELS[row.category]} ${formatMinor(row.monthly, primary.currency)}`
                          : undefined
                      }
                    />
                  ))}
                </div>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {mixLabels.map((row, index) => (
                    <span key={row.key} className="inline-flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", mixTone(index))} />
                      {row.category === "remainder" ? "Other" : CATEGORY_LABELS[row.category]}{" "}
                      <span className="tabular-nums text-fg">
                        {primary ? amountOnly(row.monthly, primary.currency) : row.monthly}
                      </span>
                    </span>
                  ))}
                </p>
              </>
            ) : null}
            <div className="mt-5 flex items-baseline justify-between gap-4 text-xs text-muted">
              <p>
                {activeCount} active
                {primary ? (
                  <>
                    {" · "}
                    <span className="tabular-nums">
                      {formatMinor(primary.yearly, primary.currency)} / year
                    </span>
                  </>
                ) : null}
              </p>
              {currencyTotals.length > 1 ? (
                <p className="tabular-nums">
                  {currencyTotals
                    .slice(1)
                    .map((row) => `${formatMinor(row.monthly, row.currency)} / mo`)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          </article>

          <article className="col-span-6 rounded-2xl bg-surface p-6 shadow-border">
            <p className="text-sm font-medium">Upcoming</p>
            <ul className="mt-4 space-y-3">
              {upcoming.length === 0 ? (
                <li className="text-sm text-muted">Nothing due soon.</li>
              ) : (
                upcoming.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <MerchantMark name={item.name} category={item.category} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted">{formatCivil(item.nextChargeAt)}</p>
                      </div>
                    </div>
                    <p className="text-sm tabular-nums">
                      {formatMinor(item.amount, item.currency)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </article>

          <article className="col-span-12 rounded-2xl bg-surface p-6 shadow-border">
            <p className="text-sm font-medium">By category</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-10 gap-y-3">
              {categoryTotals.length === 0 ? (
                <li className="text-sm text-muted">No active subscriptions.</li>
              ) : (
                categoryTotals.map((row, index) => {
                  const share =
                    primary && primary.yearly > 0 ? row.yearly / primary.yearly : 0;
                  return (
                    <li key={`${row.category}-${row.currency}`} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className={cn("size-2 rounded-full", mixTone(index))} />
                          {CATEGORY_LABELS[row.category]}
                        </span>
                        <span className="tabular-nums text-muted">
                          {formatMinor(row.yearly, row.currency)} / yr
                        </span>
                      </div>
                      <span className="block h-1.5 overflow-hidden rounded-full bg-bg">
                        <span
                          className={cn("block h-full rounded-full", mixTone(index))}
                          style={{ width: `${Math.max(6, Math.round(share * 100))}%` }}
                        />
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </article>
        </section>
        ) : null}

        {tab === "calendar" ? (
        <div className="mt-6">
          <MonthCalendar
            year={month.year}
            month={month.month}
            today={today}
            items={items}
            onPrev={() => setMonth((current) => shiftMonth(current.year, current.month, -1))}
            onNext={() => setMonth((current) => shiftMonth(current.year, current.month, 1))}
          />
        </div>
        ) : null}

        {tab === "list" ? (
        <section className="mt-6 rounded-2xl bg-surface p-6 shadow-border">
          <header className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">All charges</p>
              <h2 className="text-xl font-semibold tracking-tight">Your list</h2>
            </div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search bills and subscriptions"
              className="max-w-sm rounded-full"
            />
          </header>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg text-xs font-medium text-muted">
                <tr>
                  <th className="px-4 py-3">Name / frequency</th>
                  <th className="px-4 py-3">Next</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="w-12 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MerchantMark name={item.name} category={item.category} />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted">
                            {CADENCE_LABELS[item.cadence]}
                            {item.intervalCount > 1 ? ` ×${item.intervalCount}` : ""}
                            {" · "}
                            {CATEGORY_LABELS[item.category]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {formatCivil(item.nextChargeAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          item.status === "active" && "bg-accent-soft text-fg",
                          item.status === "paused" && "bg-bg text-muted",
                          item.status === "canceled" && "bg-bg text-danger",
                        )}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatMinor(item.amount, item.currency)}
                    </td>
                    <td className="relative px-2 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${item.name}`}
                        onClick={() => setMenuId(menuId === item.id ? null : item.id)}
                      >
                        <MoreHorizontal />
                      </Button>
                      {menuId === item.id ? (
                        <div className="absolute right-3 z-20 mt-1 w-40 rounded-xl bg-surface py-1 shadow-border">
                          <MenuItem
                            label="Edit"
                            onClick={() => {
                              setEditing(item);
                              setDialogOpen(true);
                              setMenuId(null);
                            }}
                          />
                          {item.status === "active" ? (
                            <MenuItem label="Pause" onClick={() => setStatus(item.id, "paused")} />
                          ) : (
                            <MenuItem label="Resume" onClick={() => setStatus(item.id, "active")} />
                          )}
                          {item.status !== "canceled" ? (
                            <MenuItem label="Cancel" onClick={() => setStatus(item.id, "canceled")} />
                          ) : null}
                          {item.cancelUrl ? (
                            <a
                              href={item.cancelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block px-3 py-2 text-left text-sm hover:bg-bg"
                            >
                              Manage page
                            </a>
                          ) : null}
                          <MenuItem label="Delete" onClick={() => remove(item.id)} />
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}
      </main>

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
    </div>
  );
}

function amountOnly(amount: number, currency: string): string {
  return formatMinor(amount, currency).replace(new RegExp(`\\s${currency}$`, "i"), "");
}

function SideLink({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof LayoutDashboard;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors duration-150",
        active
          ? "bg-surface/12 text-surface"
          : "text-sidebar-muted hover:bg-surface/10 hover:text-surface",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-bg" onClick={onClick}>
      {label}
    </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-8">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-border">
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
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
