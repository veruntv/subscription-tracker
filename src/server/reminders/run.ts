import { eq } from "drizzle-orm";

import { env } from "~/env";
import { civilToIso, compareCivil, todayInZone } from "~/lib/domain/civil-date";
import { formatMinor } from "~/lib/domain/money";
import { isDueThisHour, isUniqueViolation, reminderIdempotencyKey } from "~/lib/domain/reminders";
import { rollNextChargeIfPast } from "~/lib/domain/subscription";
import { db } from "~/server/db";
import { notifications, subscriptions, users } from "~/server/db/schema";
import { civilToTimestamp, rowToSubscription } from "~/server/subscriptions/map";

export async function runReminders(now = new Date()): Promise<{
  considered: number;
  sent: number;
  skipped: number;
}> {
  if (!env.DATABASE_URL) {
    return { considered: 0, sent: 0, skipped: 0 };
  }

  const rows = await db
    .select({
      subscription: subscriptions,
      timezone: users.timezone,
      defaultCurrency: users.defaultCurrency,
      email: users.email,
    })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId))
    .where(eq(subscriptions.status, "active"));

  let sent = 0;
  let skipped = 0;

  for (const row of rows) {
    const subscription = rowToSubscription(row.subscription);
    const due = isDueThisHour({
      subscription,
      settings: {
        timezone: row.timezone,
        defaultCurrency: row.defaultCurrency,
      },
      now,
    });
    if (!due) {
      skipped += 1;
      continue;
    }

    const key = reminderIdempotencyKey(subscription);
    try {
      await db.insert(notifications).values({
        subscriptionId: key.subscriptionId,
        forChargeDate: key.forChargeDate,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        skipped += 1;
        continue;
      }
      throw error;
    }

    if (env.AUTH_RESEND_KEY && env.EMAIL_FROM && row.email) {
      try {
        const chargeDate = civilToIso(subscription.nextChargeAt);
        const amount = formatMinor(subscription.amount, subscription.currency);
        const cancel = subscription.cancelUrl
          ? `\nManage / cancel: ${subscription.cancelUrl}`
          : "";
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.AUTH_RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM,
            to: [row.email],
            subject: `${subscription.name} charges in ${subscription.notifyDaysBefore} day(s)`,
            text: `${subscription.name} · ${amount} on ${chargeDate}.${cancel}`,
          }),
        });
        if (!response.ok) {
          console.error("Resend rejected reminder", response.status, subscription.id);
        }
      } catch (error) {
        console.error("Resend failed for reminder", subscription.id, error);
      }
    }

    sent += 1;
  }

  for (const row of rows) {
    const subscription = rowToSubscription(row.subscription);
    const today = todayInZone(row.timezone, now);
    const rolled = rollNextChargeIfPast(subscription, today);
    if (compareCivil(rolled.nextChargeAt, subscription.nextChargeAt) === 0) continue;
    await db
      .update(subscriptions)
      .set({ nextChargeAt: civilToTimestamp(rolled.nextChargeAt) })
      .where(eq(subscriptions.id, subscription.id));
  }

  return { considered: rows.length, sent, skipped };
}
