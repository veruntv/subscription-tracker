import { addDays, civilToIso, compareCivil } from "~/lib/domain/civil-date";
import type { CivilDate, Subscription, UserSettings } from "~/lib/domain/types";

export function reminderCivilDate(subscription: Subscription): CivilDate {
  return addDays(subscription.nextChargeAt, -subscription.notifyDaysBefore);
}

export function isDueThisHour(input: {
  subscription: Subscription;
  settings: UserSettings;
  now: Date;
}): boolean {
  const { subscription, settings, now } = input;
  if (subscription.status !== "active") return false;

  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: settings.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const year = Number(local.find((part) => part.type === "year")?.value);
  const month = Number(local.find((part) => part.type === "month")?.value);
  const day = Number(local.find((part) => part.type === "day")?.value);
  const hour = Number(local.find((part) => part.type === "hour")?.value);
  if (!year || !month || !day || Number.isNaN(hour)) return false;
  if (hour < 9) return false;

  return compareCivil(reminderCivilDate(subscription), { year, month, day }) === 0;
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}

export function reminderIdempotencyKey(subscription: Subscription): {
  subscriptionId: string;
  forChargeDate: string;
} {
  return {
    subscriptionId: subscription.id,
    forChargeDate: civilToIso(subscription.nextChargeAt),
  };
}
