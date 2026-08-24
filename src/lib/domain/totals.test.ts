import { describe, expect, it } from "vitest";

import type { FxTable } from "~/lib/domain/fx";
import type { Subscription } from "~/lib/domain/types";
import {
  categoryMix,
  totalsByCategoryForCalendarMonth,
  totalsByCategoryInCurrencyForCalendarMonth,
  totalsByCurrencyForCalendarMonth,
  totalsInCurrency,
  totalsInCurrencyForCalendarMonth,
  upcomingCharges,
  type CategoryTotals,
} from "~/lib/domain/totals";

function row(
  category: CategoryTotals["category"],
  monthly: number,
  currency = "EUR",
): CategoryTotals {
  return { category, currency, monthly, yearly: monthly * 12 };
}

function sub(
  patch: Partial<Subscription> & Pick<Subscription, "id" | "amount" | "cadence" | "startedAt" | "category">,
): Subscription {
  return {
    name: patch.id,
    currency: "USD",
    intervalCount: 1,
    anchorDay: patch.startedAt.day,
    nextChargeAt: patch.startedAt,
    status: "active",
    notifyDaysBefore: 3,
    cancelUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  };
}

describe("categoryMix", () => {
  it("shows four categories without folding", () => {
    const mix = categoryMix(
      [row("fitness", 2900), row("streaming", 1800), row("hosting", 1500), row("software", 800)],
      "EUR",
    );
    expect(mix.map((s) => s.category)).toEqual(["fitness", "streaming", "hosting", "software"]);
  });

  it("keeps every category instead of folding a second Other", () => {
    const mix = categoryMix(
      [
        row("fitness", 2900),
        row("streaming", 1800),
        row("hosting", 1500),
        row("software", 800),
        row("news", 300),
        row("other", 400),
      ],
      "EUR",
    );
    expect(mix.map((s) => s.category)).toEqual([
      "fitness",
      "streaming",
      "hosting",
      "software",
      "news",
      "other",
    ]);
    expect(mix.some((s) => s.category === "remainder")).toBe(false);
  });

  it("ignores other currencies", () => {
    const mix = categoryMix([row("fitness", 2900), row("software", 992, "USD")], "EUR");
    expect(mix).toHaveLength(1);
    expect(mix[0]?.category).toBe("fitness");
  });
});

describe("calendar-month totals", () => {
  const runna = sub({
    id: "runna",
    amount: 11999,
    cadence: "yearly",
    startedAt: { year: 2026, month: 8, day: 19 },
    category: "fitness",
  });
  const n8n = sub({
    id: "n8n",
    amount: 328,
    cadence: "yearly",
    startedAt: { year: 2026, month: 7, day: 2 },
    category: "hosting",
  });

  it("counts the full invoice in the month it falls, not yearly/12", () => {
    const month = totalsByCurrencyForCalendarMonth([runna, n8n], 2026, 8);
    expect(month).toEqual([{ currency: "USD", monthly: 11999, yearly: 11999 + 328 }]);
  });

  it("does not put a July yearly charge into August", () => {
    const cats = totalsByCategoryForCalendarMonth([runna, n8n], 2026, 8);
    const hosting = cats.find((row) => row.category === "hosting");
    const fitness = cats.find((row) => row.category === "fitness");
    expect(hosting).toMatchObject({ monthly: 0, yearly: 328 });
    expect(fitness).toMatchObject({ monthly: 11999, yearly: 11999 });
  });
});

/** 1 USD = 0.86 EUR = 17 MDL. */
function fx(): FxTable {
  const scale = 100_000_000;
  return {
    base: "USD",
    asOf: "2026-08-20",
    scale,
    quotes: {
      USD: scale,
      EUR: 86_000_000,
      MDL: 1_700_000_000,
    },
  };
}

describe("totals converted to default currency", () => {
  const apple = sub({
    id: "apple",
    amount: 1199,
    currency: "EUR",
    cadence: "monthly",
    startedAt: { year: 2026, month: 8, day: 19 },
    category: "streaming",
  });
  const rent = sub({
    id: "rent",
    amount: 100_000,
    currency: "MDL",
    cadence: "monthly",
    startedAt: { year: 2026, month: 8, day: 22 },
    category: "other",
  });
  const gym = sub({
    id: "gym",
    amount: 12_327,
    currency: "USD",
    cadence: "yearly",
    startedAt: { year: 2026, month: 8, day: 19 },
    category: "fitness",
  });

  it("sums this month across currencies into the default, not the first currency only", () => {
    const month = totalsInCurrencyForCalendarMonth([apple, rent, gym], "EUR", fx(), 2026, 8);
    // 11.99 EUR + 50.59 EUR (1000 MDL) + 106.01 EUR (123.27 USD) = 168.59 EUR
    expect(month).toEqual({ currency: "EUR", monthly: 16859, yearly: 85695 });
  });

  it("merges categories after conversion so mix bars share one scale", () => {
    const cats = totalsByCategoryInCurrencyForCalendarMonth(
      [apple, rent, gym],
      "EUR",
      fx(),
      2026,
      8,
    );
    expect(cats.map((row) => row.category)).toEqual(["other", "streaming", "fitness"]);
    expect(cats.every((row) => row.currency === "EUR")).toBe(true);
    expect(cats.find((row) => row.category === "other")?.monthly).toBe(5059);
    expect(cats.find((row) => row.category === "streaming")?.monthly).toBe(1199);
    expect(cats.find((row) => row.category === "fitness")?.monthly).toBe(10601);
  });

  it("folds the same category from two currencies into one converted row", () => {
    const extraOther = sub({
      id: "tip",
      amount: 1000,
      currency: "USD",
      cadence: "monthly",
      startedAt: { year: 2026, month: 8, day: 10 },
      category: "other",
    });
    const cats = totalsByCategoryInCurrencyForCalendarMonth(
      [rent, extraOther],
      "EUR",
      fx(),
      2026,
      8,
    );
    expect(cats).toHaveLength(1);
    expect(cats[0]).toMatchObject({ category: "other", currency: "EUR" });
    // 1000 MDL → 50.59 EUR; 10.00 USD → 8.60 EUR
    expect(cats[0]?.monthly).toBe(5919);
  });

  it("normalizes yearly run-rate into the default currency", () => {
    const year = totalsInCurrency([apple, rent], "EUR", fx());
    // apple 143.88 EUR/yr; 12000 MDL/yr → 607.06 EUR. monthly = yearly/12
    expect(year).toEqual({ currency: "EUR", monthly: 6258, yearly: 75094 });
  });
});

describe("upcomingCharges", () => {
  const from = { year: 2026, month: 8, day: 24 };

  it("lists each weekly occurrence in the next 30 days", () => {
    const gym = sub({
      id: "gym",
      name: "Gym",
      amount: 2000,
      cadence: "weekly",
      intervalCount: 1,
      anchorDay: 1,
      startedAt: { year: 2026, month: 8, day: 24 },
      nextChargeAt: { year: 2026, month: 8, day: 24 },
      category: "fitness",
    });
    const upcoming = upcomingCharges([gym], from);
    expect(upcoming.map((row) => row.chargeAt)).toEqual([
      { year: 2026, month: 8, day: 24 },
      { year: 2026, month: 8, day: 31 },
      { year: 2026, month: 9, day: 7 },
      { year: 2026, month: 9, day: 14 },
      { year: 2026, month: 9, day: 21 },
    ]);
    expect(upcoming.every((row) => row.subscription.id === "gym")).toBe(true);
  });

  it("includes a charge on the 30th day and skips paused rows", () => {
    const yearly = sub({
      id: "domain",
      name: "Domain",
      amount: 1200,
      cadence: "yearly",
      startedAt: { year: 2026, month: 9, day: 23 },
      nextChargeAt: { year: 2026, month: 9, day: 23 },
      category: "hosting",
    });
    const paused = sub({
      id: "paused",
      name: "Paused",
      amount: 999,
      cadence: "weekly",
      startedAt: { year: 2026, month: 8, day: 24 },
      nextChargeAt: { year: 2026, month: 8, day: 24 },
      status: "paused",
      category: "other",
    });
    const upcoming = upcomingCharges([yearly, paused], from);
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]?.subscription.id).toBe("domain");
    expect(upcoming[0]?.chargeAt).toEqual({ year: 2026, month: 9, day: 23 });
  });

  it("sorts mixed subscriptions by charge date then name", () => {
    const netflix = sub({
      id: "netflix",
      name: "Netflix",
      amount: 1299,
      cadence: "monthly",
      startedAt: { year: 2026, month: 8, day: 24 },
      nextChargeAt: { year: 2026, month: 8, day: 24 },
      category: "streaming",
    });
    const apple = sub({
      id: "apple",
      name: "Apple",
      amount: 999,
      cadence: "monthly",
      startedAt: { year: 2026, month: 8, day: 24 },
      nextChargeAt: { year: 2026, month: 8, day: 24 },
      category: "software",
    });
    const upcoming = upcomingCharges([netflix, apple], from);
    expect(upcoming.map((row) => row.subscription.name)).toEqual(["Apple", "Netflix"]);
  });
});
