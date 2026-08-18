import { todayUtcCivil } from "~/lib/domain/civil-date";
import { inferAnchorDay, nextChargeOnOrAfter } from "~/lib/domain/schedule";
import type { Subscription, SubscriptionInput } from "~/lib/domain/types";

export function buildSubscription(
  input: SubscriptionInput,
  id: string,
  createdAt = new Date().toISOString(),
): Subscription {
  const anchorDay = inferAnchorDay(input.startedAt, input.cadence);
  return {
    id,
    name: input.name.trim(),
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    cadence: input.cadence,
    intervalCount: Math.max(1, input.intervalCount),
    anchorDay,
    startedAt: input.startedAt,
    nextChargeAt: nextChargeOnOrAfter({
      startedAt: input.startedAt,
      cadence: input.cadence,
      intervalCount: input.intervalCount,
      anchorDay,
      from: todayUtcCivil(),
    }),
    status: input.status ?? "active",
    notifyDaysBefore: Math.max(0, input.notifyDaysBefore),
    category: input.category,
    cancelUrl: input.cancelUrl?.trim() ? input.cancelUrl.trim() : null,
    createdAt,
  };
}

export function applyStatus(item: Subscription, status: Subscription["status"]): Subscription {
  if (status === "active") {
    return buildSubscription(
      {
        name: item.name,
        amount: item.amount,
        currency: item.currency,
        cadence: item.cadence,
        intervalCount: item.intervalCount,
        startedAt: item.startedAt,
        category: item.category,
        cancelUrl: item.cancelUrl,
        notifyDaysBefore: item.notifyDaysBefore,
        status,
      },
      item.id,
      item.createdAt,
    );
  }
  return { ...item, status };
}
