"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  Receipt,
  Settings,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { MerchantMark } from "~/components/merchant-mark";
import { MonthCalendar, shiftMonth } from "~/components/month-calendar";
import { SubscriptionDialog } from "~/components/subscription-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { civilFromIso, compareCivil, formatCivil, todayInZone } from "~/lib/domain/civil-date";
import {
  CADENCE_LABELS,
  CATEGORY_LABELS,
  categoryTone,
  CURRENCIES,
  STATUS_LABELS,
  TIMEZONES,
  greetingForHour,
} from "~/lib/domain/labels";
import { fxCovers } from "~/lib/domain/fx";
import { formatMinor } from "~/lib/domain/money";
import {
  categoryMix,
  totalsByCategoryForCalendarMonth,
  totalsByCategoryInCurrencyForCalendarMonth,
  totalsByCurrency,
  totalsByCurrencyForCalendarMonth,
  totalsInCurrency,
  totalsInCurrencyForCalendarMonth,
  upcomingCharges,
} from "~/lib/domain/totals";
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

function suggestedTimezone(): (typeof TIMEZONES)[number] {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if ((TIMEZONES as readonly string[]).includes(detected)) {
    return detected as (typeof TIMEZONES)[number];
  }
  return "Europe/Chisinau";
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
  const [month, setMonth] = useState<{ year: number; month: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [hour] = useState(() => new Date().getHours());
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    setTab(tabFromHash());
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!menuId) return;
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuId(null);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuId]);

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
    onSuccess: () => {
      void listQuery.refetch();
      setDialogOpen(false);
      setEditing(null);
    },
  });
  const updateMut = api.subscription.update.useMutation({
    onSuccess: () => {
      void listQuery.refetch();
      setDialogOpen(false);
      setEditing(null);
    },
  });
  const statusMut = api.subscription.setStatus.useMutation({
    onSuccess: () => void listQuery.refetch(),
  });
  const removeMut = api.subscription.remove.useMutation({
    onSuccess: () => void listQuery.refetch(),
  });
  const settingsMut = api.settings.update.useMutation({
    onSuccess: () => {
      void settingsQuery.refetch();
      setSettingsOpen(false);
    },
  });
  const fxQuery = api.fx.today.useQuery(undefined, {
    enabled: accountReady,
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const items = accountReady ? (listQuery.data ?? []) : [];
  const settings: UserSettings = {
    timezone: settingsQuery.data?.timezone ?? "UTC",
    defaultCurrency: settingsQuery.data?.defaultCurrency ?? "USD",
  };
  const needsOnboarding =
    Boolean(settingsQuery.data) &&
    settingsQuery.data?.timezone === "UTC" &&
    settingsQuery.data?.defaultCurrency === "USD";
  const today = todayInZone(settings.timezone);
  const thisMonth = { year: today.year, month: today.month };
  const calendarMonth = month ?? thisMonth;
  const target = settings.defaultCurrency;
  const fx = fxQuery.data ?? null;
  const usedCurrencies = useMemo(
    () => [...new Set(items.filter((item) => item.status === "active").map((item) => item.currency))],
    [items],
  );
  const foreign = usedCurrencies.some((code) => code !== target);
  const canConvert = Boolean(
    settingsQuery.data &&
      fx &&
      usedCurrencies.length > 0 &&
      fxCovers([...usedCurrencies, target], fx),
  );
  const awaitingFx =
    accountReady && (settingsQuery.isLoading || (foreign && fxQuery.isLoading));

  const yearlyTotals = useMemo(() => totalsByCurrency(items), [items]);
  const monthTotals = useMemo(
    () => totalsByCurrencyForCalendarMonth(items, thisMonth.year, thisMonth.month),
    [items, thisMonth.month, thisMonth.year],
  );
  const categoryMonthTotals = useMemo(
    () => totalsByCategoryForCalendarMonth(items, thisMonth.year, thisMonth.month),
    [items, thisMonth.month, thisMonth.year],
  );
  const yearlyConverted = useMemo(
    () => (canConvert && fx ? totalsInCurrency(items, target, fx) : null),
    [canConvert, fx, items, target],
  );
  const monthConverted = useMemo(
    () =>
      canConvert && fx
        ? totalsInCurrencyForCalendarMonth(items, target, fx, thisMonth.year, thisMonth.month)
        : null,
    [canConvert, fx, items, target, thisMonth.month, thisMonth.year],
  );
  const categoryConverted = useMemo(
    () =>
      canConvert && fx
        ? totalsByCategoryInCurrencyForCalendarMonth(
            items,
            target,
            fx,
            thisMonth.year,
            thisMonth.month,
          )
        : null,
    [canConvert, fx, items, target, thisMonth.month, thisMonth.year],
  );
  const upcoming = useMemo(() => upcomingCharges(items), [items]);
  const primaryYear =
    yearlyConverted ?? yearlyTotals.find((row) => row.currency === target) ?? yearlyTotals[0];
  const primaryMonth =
    monthConverted ??
    monthTotals.find((row) => row.currency === (primaryYear?.currency ?? target)) ??
    monthTotals[0];
  const categoryRows = categoryConverted ?? categoryMonthTotals;
  const mix = useMemo(() => {
    const currency = primaryMonth?.currency ?? primaryYear?.currency;
    if (!currency) return [];
    return categoryMix(categoryRows, currency)
      .filter((row) => row.monthly > 0)
      .slice()
      .sort((a, b) => b.monthly - a.monthly);
  }, [categoryRows, primaryMonth?.currency, primaryYear?.currency]);
  const mixTotal = mix.reduce((sum, row) => sum + row.monthly, 0);
  const mixLabels = mix;
  const fxAsOf = fx ? civilFromIso(fx.asOf) : null;
  const activeCount = items.filter((item) => item.status === "active").length;
  const filtered = items
    .filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice()
    .sort(
      (a, b) =>
        compareCivil(a.nextChargeAt, b.nextChargeAt) || a.name.localeCompare(b.name),
    );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const save = (input: SubscriptionInput) => {
    if (!accountReady) return;
    if (editing) {
      updateMut.mutate({ ...input, id: editing.id });
    } else {
      createMut.mutate(input);
    }
  };

  const setStatus = (id: string, status: Subscription["status"]) => {
    setMenuId(null);
    if (accountReady) {
      statusMut.mutate({ id, status });
    }
  };

  const remove = (id: string, name: string) => {
    setMenuId(null);
    if (!accountReady) return;
    if (!window.confirm(`Remove ${name} from the list? This cannot be undone.`)) return;
    removeMut.mutate({ id });
  };

  const saveSettings = (next: UserSettings) => {
    if (!accountReady) return;
    settingsMut.mutate({
      timezone: next.timezone as (typeof TIMEZONES)[number],
      defaultCurrency: next.defaultCurrency as (typeof CURRENCIES)[number],
    });
  };

  useEffect(() => {
    if (needsOnboarding) setSettingsOpen(true);
  }, [needsOnboarding]);

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
          <Button
            variant="ghost"
            className="w-full justify-start text-surface hover:bg-surface/10 hover:text-surface"
            onClick={() => void signOut({ callbackUrl: "/" })}
          >
            <LogOut />
            Sign out
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

        {listQuery.isLoading ? (
          <p className="mt-6 text-sm text-muted">Loading your list…</p>
        ) : null}
        {listQuery.isError ? (
          <p role="alert" className="mt-6 text-sm text-danger">
            Could not load subscriptions. Try again in a moment.
          </p>
        ) : null}

        {tab === "overview" ? (
        <section className="mt-6 grid grid-cols-12 gap-5">
          <article className="col-span-6 rounded-2xl bg-surface p-7 shadow-border">
            <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
              <div>
                <p className="text-sm text-muted">Charged this month</p>
                <p className="mt-2 text-5xl font-semibold tabular-nums tracking-tight">
                  {awaitingFx
                    ? "…"
                    : primaryMonth
                      ? formatMinor(primaryMonth.monthly, primaryMonth.currency)
                      : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Per year</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
                  {awaitingFx
                    ? "…"
                    : primaryYear
                      ? formatMinor(primaryYear.yearly, primaryYear.currency)
                      : "—"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              This month is what actually bills in this month. Per year is what the whole
              list costs over a year — a yearly charge counts here even in months it does
              not bill.
            </p>
            {yearlyConverted && foreign && fxAsOf ? (
              <p className="mt-1 text-xs text-muted">
                Both figures converted to {target} at {formatCivil(fxAsOf)} rates. Rows stay
                in the currency you entered.
              </p>
            ) : yearlyTotals.length > 1 ? (
              <p className="mt-1 text-xs tabular-nums text-muted">
                {yearlyTotals
                  .filter((row) => row.currency !== primaryYear?.currency)
                  .map((row) => `${formatMinor(row.yearly, row.currency)} / yr`)
                  .join(" · ")}
              </p>
            ) : foreign && !canConvert ? (
              <p className="mt-1 text-xs text-muted">
                Could not load exchange rates — totals are per currency
              </p>
            ) : null}
            {listQuery.isLoading || awaitingFx ? (
              <p className="mt-6 text-sm text-muted">
                {listQuery.isLoading ? "Loading your list…" : "Converting this month mix..."}
              </p>
            ) : mix.length > 0 ? (
              <>
                <div className="mt-6 flex h-2.5 gap-1 overflow-hidden rounded-full">
                  {mix.map((row) => (
                    <span
                      key={row.key}
                      className={cn("h-full min-w-1", categoryTone(row.category).bg)}
                      style={{
                        flexGrow: mixTotal > 0 ? Math.max(row.monthly / mixTotal, 0.04) : 1,
                      }}
                      title={
                        primaryMonth
                          ? `${row.category === "remainder" ? "Other" : CATEGORY_LABELS[row.category]} ${formatMinor(row.monthly, primaryMonth.currency)}`
                          : undefined
                      }
                    />
                  ))}
                </div>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {mixLabels.map((row) => (
                    <span key={row.key} className="inline-flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", categoryTone(row.category).bg)} />
                      {row.category === "remainder" ? "Other" : CATEGORY_LABELS[row.category]}{" "}
                      <span className="tabular-nums text-fg">
                        {primaryMonth ? amountOnly(row.monthly, primaryMonth.currency) : row.monthly}
                      </span>
                    </span>
                  ))}
                </p>
              </>
            ) : (
              <p className="mt-6 text-sm text-muted">No charges land this calendar month.</p>
            )}
            <p className="mt-5 text-xs text-muted">{activeCount} active</p>
          </article>

          <article className="col-span-6 rounded-2xl bg-surface p-6 shadow-border">
            <p className="text-sm font-medium">Upcoming</p>
            <ul className="mt-4 space-y-3">
              {listQuery.isLoading ? (
                <li className="text-sm text-muted">Loading your list…</li>
              ) : upcoming.length === 0 ? (
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
              {listQuery.isLoading || awaitingFx ? (
                <li className="text-sm text-muted">
                  {listQuery.isLoading ? "Loading your list…" : "Converting category totals…"}
                </li>
              ) : categoryRows.length === 0 ? (
                <li className="text-sm text-muted">No active subscriptions.</li>
              ) : (
                categoryRows.map((row) => {
                  const monthTotal = primaryMonth?.monthly ?? 0;
                  const share = monthTotal > 0 ? row.monthly / monthTotal : 0;
                  return (
                    <li key={`${row.category}-${row.currency}`} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2">
                          <span className={cn("size-2 rounded-full", categoryTone(row.category).bg)} />
                          {CATEGORY_LABELS[row.category]}
                        </span>
                        <span className="tabular-nums text-muted">
                          {formatMinor(row.monthly, row.currency)} this month
                          <span className="mx-1.5 text-border">·</span>
                          {formatMinor(row.yearly, row.currency)} / yr
                        </span>
                      </div>
                      <span className="block h-1.5 overflow-hidden rounded-full bg-bg">
                        <span
                          className={cn("block h-full rounded-full", categoryTone(row.category).bg)}
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
            year={calendarMonth.year}
            month={calendarMonth.month}
            today={today}
            items={items}
            onPrev={() =>
              setMonth((current) => {
                const from = current ?? thisMonth;
                return shiftMonth(from.year, from.month, -1);
              })
            }
            onNext={() =>
              setMonth((current) => {
                const from = current ?? thisMonth;
                return shiftMonth(from.year, from.month, 1);
              })
            }
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

          <div className="overflow-visible rounded-xl border border-border">
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
                {listQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-sm text-muted">
                      Loading your list…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-sm text-muted">
                      {query.trim()
                        ? "No matching subscriptions."
                        : "Add the first charge with the button above."}
                    </td>
                  </tr>
                ) : null}
                {filtered.map((item, index) => (
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
                      <div
                        ref={menuId === item.id ? menuRef : undefined}
                        className="relative flex justify-end"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${item.name}`}
                          aria-expanded={menuId === item.id}
                          onClick={() => setMenuId(menuId === item.id ? null : item.id)}
                        >
                          <MoreHorizontal />
                        </Button>
                        {menuId === item.id ? (
                          <div
                            className={cn(
                              "absolute right-0 z-30 w-40 rounded-xl border border-border bg-surface py-1 shadow-border",
                              index >= filtered.length - 1 ? "bottom-full mb-1" : "top-full mt-1",
                            )}
                          >
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
                            <MenuItem label="Delete" onClick={() => remove(item.id, item.name)} />
                          </div>
                        ) : null}
                      </div>
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
        pending={createMut.isPending || updateMut.isPending}
        error={
          createMut.error || updateMut.error
            ? "Could not save. Check the fields and try again."
            : null
        }
        onClose={() => {
          if (createMut.isPending || updateMut.isPending) return;
          setDialogOpen(false);
          setEditing(null);
          createMut.reset();
          updateMut.reset();
        }}
        onSubmit={save}
      />

      {settingsOpen ? (
        <SettingsDialog
          settings={
            needsOnboarding
              ? { timezone: suggestedTimezone(), defaultCurrency: settings.defaultCurrency }
              : settings
          }
          required={needsOnboarding}
          onClose={() => {
            if (!needsOnboarding) setSettingsOpen(false);
          }}
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
  required = false,
  onClose,
  onSave,
}: {
  settings: UserSettings;
  required?: boolean;
  onClose: () => void;
  onSave: (settings: UserSettings) => void;
}) {
  const [timezone, setTimezone] = useState(settings.timezone);
  const [defaultCurrency, setDefaultCurrency] = useState(settings.defaultCurrency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-8">
      <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-border">
        <h2 id="settings-title" className="text-xl font-semibold tracking-tight">
          {required ? "Timezone and currency" : "Settings"}
        </h2>
        {required ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Reminders go out at 09:00 in this zone. Totals convert into this currency.
          </p>
        ) : null}
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
          {required ? null : (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
          <Button onClick={() => onSave({ timezone, defaultCurrency })}>Save</Button>
        </div>
      </div>
    </div>
  );
}
