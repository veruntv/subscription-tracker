import { civilFromUtc, utcFromCivil } from "~/lib/domain/civil-date";
import type { Category, Subscription } from "~/lib/domain/types";
import { CATEGORIES } from "~/lib/domain/types";
import type { subscriptions } from "~/server/db/schema";

type SubscriptionRow = typeof subscriptions.$inferSelect;

function asCategory(value: string): Category {
  return (CATEGORIES as readonly string[]).includes(value)
    ? (value as Category)
    : "other";
}

export function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    currency: row.currency,
    cadence: row.cadence,
    intervalCount: row.intervalCount,
    anchorDay: row.anchorDay,
    startedAt: civilFromUtc(row.startedAt),
    nextChargeAt: civilFromUtc(row.nextChargeAt),
    status: row.status,
    notifyDaysBefore: row.notifyDaysBefore,
    category: asCategory(row.category),
    cancelUrl: row.cancelUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

export function civilToTimestamp(date: { year: number; month: number; day: number }): Date {
  return utcFromCivil(date);
}
