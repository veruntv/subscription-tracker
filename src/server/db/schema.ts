import { index, pgTable, primaryKey, unique } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const users = pgTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d.timestamp({ mode: "date", withTimezone: true }),
  image: d.varchar({ length: 255 }),
  timezone: d.varchar({ length: 64 }).notNull().default("UTC"),
  defaultCurrency: d.char({ length: 3 }).notNull().default("USD"),
  createdAt: d
    .timestamp({ withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
}));

export const accounts = pgTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const sessions = pgTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const verificationTokens = pgTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const subscriptions = pgTable(
  "subscription",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: d.text().notNull(),
    amount: d.integer().notNull(),
    currency: d.char({ length: 3 }).notNull(),
    cadence: d
      .text({ enum: ["weekly", "monthly", "quarterly", "yearly"] })
      .notNull(),
    intervalCount: d.integer().notNull().default(1),
    anchorDay: d.integer().notNull(),
    startedAt: d.timestamp({ withTimezone: true }).notNull(),
    nextChargeAt: d.timestamp({ withTimezone: true }).notNull(),
    status: d.text({ enum: ["active", "paused", "canceled"] }).notNull().default("active"),
    notifyDaysBefore: d.integer().notNull().default(3),
    category: d.text().notNull(),
    cancelUrl: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [
    index("subscription_next_charge_at_idx").on(t.nextChargeAt),
    index("subscription_user_id_idx").on(t.userId),
  ],
);

export const notifications = pgTable(
  "notification",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    subscriptionId: d
      .uuid()
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    forChargeDate: d.date().notNull(),
    sentAt: d
      .timestamp({ withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [
    unique("notification_subscription_charge_uidx").on(
      t.subscriptionId,
      t.forChargeDate,
    ),
  ],
);
