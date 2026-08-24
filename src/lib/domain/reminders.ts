import { addDays, civilToIso, compareCivil, formatCivil, todayInZone } from "~/lib/domain/civil-date";
import { formatMinor } from "~/lib/domain/money";
import type { CivilDate, Subscription, UserSettings } from "~/lib/domain/types";

export type DueReminder = {
  userId: string;
  email: string | null;
  subscription: Subscription;
};

export type ReminderGroup = {
  userId: string;
  email: string | null;
  chargeDate: string;
  notifyDaysBefore: number;
  subscriptions: Subscription[];
};

export type ReminderClaim = {
  subscriptionId: string;
  forChargeDate: string;
};

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

export function reminderIdempotencyKey(subscription: Subscription): ReminderClaim {
  return {
    subscriptionId: subscription.id,
    forChargeDate: civilToIso(subscription.nextChargeAt),
  };
}

export function groupDueReminders(due: readonly DueReminder[]): ReminderGroup[] {
  const groups = new Map<string, ReminderGroup>();
  for (const row of due) {
    const chargeDate = civilToIso(row.subscription.nextChargeAt);
    const key = `${row.userId}|${chargeDate}|${row.subscription.notifyDaysBefore}`;
    const existing = groups.get(key);
    if (existing) {
      existing.subscriptions.push(row.subscription);
      continue;
    }
    groups.set(key, {
      userId: row.userId,
      email: row.email,
      chargeDate,
      notifyDaysBefore: row.subscription.notifyDaysBefore,
      subscriptions: [row.subscription],
    });
  }
  for (const group of groups.values()) {
    group.subscriptions.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  }
  return [...groups.values()];
}

export function reminderEmailSubject(items: readonly Subscription[]): string {
  const first = items[0];
  if (!first) return "";
  if (items.length === 1) {
    return `${first.name} charges in ${first.notifyDaysBefore} day(s)`;
  }
  return `${items.length} subscriptions charge in ${first.notifyDaysBefore} day(s)`;
}

export function reminderEmailText(items: readonly Subscription[]): string {
  return items
    .map((item) => {
      const amount = formatMinor(item.amount, item.currency);
      const chargeDate = civilToIso(item.nextChargeAt);
      const cancel = item.cancelUrl ? `\nManage / cancel: ${item.cancelUrl}` : "";
      return `${item.name} · ${amount} on ${chargeDate}.${cancel}`;
    })
    .join("\n\n");
}

export function reminderSentCopy(sentAtIso: string | null | undefined, timeZone: string): string {
  if (!sentAtIso) return "No reminder yet";
  const sent = todayInZone(timeZone, new Date(sentAtIso));
  return `Reminded ${formatCivil(sent)}`;
}

export async function deliverReminderBatch(input: {
  items: readonly Subscription[];
  to: string;
  claim: (key: ReminderClaim) => Promise<"inserted" | "duplicate">;
  release: (keys: ReminderClaim[]) => Promise<void>;
  send: (message: { to: string; subject: string; text: string }) => Promise<boolean>;
}): Promise<{ sent: number; skipped: number }> {
  const claimed: ReminderClaim[] = [];
  for (const item of input.items) {
    const key = reminderIdempotencyKey(item);
    const result = await input.claim(key);
    if (result === "duplicate") continue;
    claimed.push(key);
  }
  if (claimed.length === 0) {
    return { sent: 0, skipped: input.items.length };
  }

  const claimedIds = new Set(claimed.map((key) => key.subscriptionId));
  const toSend = input.items.filter((item) => claimedIds.has(item.id));
  let ok = false;
  try {
    ok = await input.send({
      to: input.to,
      subject: reminderEmailSubject(toSend),
      text: reminderEmailText(toSend),
    });
  } catch {
    ok = false;
  }
  if (!ok) {
    await input.release(claimed);
    return { sent: 0, skipped: input.items.length };
  }
  return { sent: claimed.length, skipped: input.items.length - claimed.length };
}
