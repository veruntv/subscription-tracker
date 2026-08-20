import { describe, expect, it } from "vitest";

import type { Subscription } from "~/lib/domain/types";
import {
  categoryMix,
  totalsByCategoryForCalendarMonth,
  totalsByCurrencyForCalendarMonth,
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

  it("folds the tail into remainder past four categories", () => {
    const mix = categoryMix(
      [
        row("fitness", 2900),
        row("streaming", 1800),
        row("hosting", 1500),
        row("software", 800),
        row("news", 300),
      ],
      "EUR",
    );
    expect(mix).toHaveLength(4);
    expect(mix[3]).toMatchObject({ category: "remainder", monthly: 1100 });
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
