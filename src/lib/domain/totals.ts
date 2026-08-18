import { monthlyMinor, mulDivRound, yearlyMinor } from "~/lib/domain/money";
import type { Category, Subscription } from "~/lib/domain/types";

export type CurrencyTotals = {
  currency: string;
  monthly: number;
  yearly: number;
};

export type CategoryTotals = CurrencyTotals & {
  category: Category;
};

export function activeSubscriptions(items: readonly Subscription[]): Subscription[] {
  return items.filter((item) => item.status === "active");
}

export function totalsByCurrency(items: readonly Subscription[]): CurrencyTotals[] {
  const map = new Map<string, number>();
  for (const item of activeSubscriptions(items)) {
    const yearly = yearlyMinor(item.amount, item.cadence, item.intervalCount);
    map.set(item.currency, (map.get(item.currency) ?? 0) + yearly);
  }
  return [...map.entries()]
    .map(([currency, yearly]) => ({
      currency,
      yearly,
      monthly: mulDivRound(yearly, 1, 12),
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export function totalsByCategory(items: readonly Subscription[]): CategoryTotals[] {
  const map = new Map<string, { category: Category; currency: string; yearly: number }>();
  for (const item of activeSubscriptions(items)) {
    const key = `${item.category}:${item.currency}`;
    const yearly = yearlyMinor(item.amount, item.cadence, item.intervalCount);
    const current = map.get(key) ?? {
      category: item.category,
      currency: item.currency,
      yearly: 0,
    };
    current.yearly += yearly;
    map.set(key, current);
  }
  return [...map.values()]
    .map((row) => ({
      ...row,
      monthly: mulDivRound(row.yearly, 1, 12),
    }))
    .sort((a, b) => b.yearly - a.yearly);
}

export function upcomingCharges(
  items: readonly Subscription[],
  limit = 6,
): Subscription[] {
  return activeSubscriptions(items)
    .slice()
    .sort((a, b) => {
      const byDate =
        a.nextChargeAt.year - b.nextChargeAt.year ||
        a.nextChargeAt.month - b.nextChargeAt.month ||
        a.nextChargeAt.day - b.nextChargeAt.day;
      return byDate || a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}
