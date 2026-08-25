import { and, eq } from "drizzle-orm";

import { env } from "~/env";
import { compareCivil, todayInZone } from "~/lib/domain/civil-date";
import {
  deliverReminderBatch,
  groupDueReminders,
  isDueThisHour,
  isUniqueViolation,
  type DueReminder,
} from "~/lib/domain/reminders";
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
      notifyHour: users.notifyHour,
      email: users.email,
    })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId))
    .where(eq(subscriptions.status, "active"));

  let sent = 0;
  let skipped = 0;
  const due: DueReminder[] = [];

  for (const row of rows) {
    const subscription = rowToSubscription(row.subscription);
    const isDue = isDueThisHour({
      subscription,
      settings: {
        timezone: row.timezone,
        defaultCurrency: row.defaultCurrency,
        notifyHour: row.notifyHour,
      },
      now,
    });
    if (!isDue) {
      skipped += 1;
      continue;
    }
    due.push({
      userId: row.subscription.userId,
      email: row.email,
      subscription,
    });
  }

  const resendKey = env.AUTH_RESEND_KEY;
  const emailFrom = env.EMAIL_FROM;

  for (const group of groupDueReminders(due)) {
    if (!resendKey || !emailFrom || !group.email) {
      skipped += group.subscriptions.length;
      continue;
    }

    const result = await deliverReminderBatch({
      items: group.subscriptions,
      to: group.email,
      claim: async (key) => {
        try {
          await db.insert(notifications).values({
            subscriptionId: key.subscriptionId,
            forChargeDate: key.forChargeDate,
          });
          return "inserted";
        } catch (error) {
          if (isUniqueViolation(error)) return "duplicate";
          throw error;
        }
      },
      release: async (keys) => {
        for (const key of keys) {
          await db
            .delete(notifications)
            .where(
              and(
                eq(notifications.subscriptionId, key.subscriptionId),
                eq(notifications.forChargeDate, key.forChargeDate),
              ),
            );
        }
      },
      send: async (message) => {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: emailFrom,
              to: [message.to],
              subject: message.subject,
              text: message.text,
            }),
          });
          if (!response.ok) {
            console.error("Resend rejected reminder", response.status, message.subject);
            return false;
          }
          return true;
        } catch (error) {
          console.error("Resend failed for reminder", message.subject, error);
          return false;
        }
      },
    });
    sent += result.sent;
    skipped += result.skipped;
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
