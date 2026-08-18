import { and, eq } from "drizzle-orm";

import { env } from "~/env";
import { civilFromUtc, civilToIso } from "~/lib/domain/civil-date";
import { formatMinor } from "~/lib/domain/money";
import { isDueThisHour, reminderIdempotencyKey } from "~/lib/domain/reminders";
import { db } from "~/server/db";
import { notifications, subscriptions, users } from "~/server/db/schema";
import { rowToSubscription } from "~/server/subscriptions/map";

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
    } catch {
      skipped += 1;
      continue;
    }

    if (env.AUTH_RESEND_KEY && env.EMAIL_FROM && row.email) {
      const chargeDate = civilToIso(civilFromUtc(row.subscription.nextChargeAt));
      const amount = formatMinor(subscription.amount, subscription.currency);
      const cancel = subscription.cancelUrl
        ? `\nManage / cancel: ${subscription.cancelUrl}`
        : "";
      await fetch("https://api.resend.com/emails", {
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
    }

    sent += 1;
  }

  return { considered: rows.length, sent, skipped };
}
