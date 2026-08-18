import { mulDivRound, yearlyMinor } from "~/lib/domain/money";
import type { Category, Subscription } from "~/lib/domain/types";

export type CurrencyTotals = {
  currency: string;
  monthly: number;
  yearly: number;
};

export type CategoryTotals = CurrencyTotals & {
  category: Category;
};

export type MixSegment = {
  key: string;
  category: Category | "remainder";
  monthly: number;
  yearly: number;
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

export function categoryMix(
  rows: readonly CategoryTotals[],
  currency: string,
  namedLimit = 3,
): MixSegment[] {
  const ofCurrency = rows.filter((row) => row.currency === currency);
  const showAll = ofCurrency.length <= namedLimit + 1;
  const named = showAll ? ofCurrency : ofCurrency.slice(0, namedLimit);
  const tail = showAll ? [] : ofCurrency.slice(namedLimit);
  const restYearly = tail.reduce((sum, row) => sum + row.yearly, 0);
  const restMonthly = tail.reduce((sum, row) => sum + row.monthly, 0);
  const segments: MixSegment[] = named.map((row) => ({
    key: `${row.category}:${row.currency}`,
    category: row.category,
    monthly: row.monthly,
    yearly: row.yearly,
  }));
  if (restYearly > 0) {
    segments.push({
      key: `remainder:${currency}`,
      category: "remainder",
      monthly: restMonthly,
      yearly: restYearly,
    });
  }
  return segments;
}

export function upcomingCharges(
  items: readonly Subscription[],
  limit = 8,
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
