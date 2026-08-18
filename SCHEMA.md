# Schema

Postgres (Neon in production). Auth.js owns the auth tables; this file documents the columns we rely on and the application tables.

All timestamps are `timestamptz` stored in UTC. Date-only values (`forChargeDate`) are a calendar date, not a time. Money is never `numeric` / `float`.

## `user`

Auth.js user row, extended.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `text` | PK | Auth.js id |
| `name` | `text` | nullable | Auth.js |
| `email` | `text` | unique, not null | Magic-link identity |
| `emailVerified` | `timestamptz` | nullable | Auth.js |
| `image` | `text` | nullable | Auth.js |
| `timezone` | `text` | not null, default `'UTC'` | IANA name, e.g. `Europe/Chisinau` |
| `defaultCurrency` | `char(3)` | not null, default `'USD'` | ISO 4217 |
| `createdAt` | `timestamptz` | not null, default `now()` | |

Auth.js also creates `account`, `session`, and `verificationToken` (names follow the Auth.js Postgres adapter). Do not put application data there.

## `subscription`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `userId` | `text` | not null, FK → `user.id` on delete cascade | |
| `name` | `text` | not null | |
| `amount` | `integer` | not null, `> 0` | Minor units (cents, pence, …) |
| `currency` | `char(3)` | not null | ISO 4217. No FX in v1 |
| `cadence` | `text` | not null, check ∈ (`weekly`, `monthly`, `quarterly`, `yearly`) | |
| `intervalCount` | `integer` | not null, default `1`, `>= 1` | Every N cadences |
| `anchorDay` | `integer` | not null | See [Anchor day](#anchor-day) |
| `startedAt` | `timestamptz` | not null | First charge (UTC) |
| `nextChargeAt` | `timestamptz` | not null | Next due instant (UTC). Persisted, not computed at read time |
| `status` | `text` | not null, default `'active'`, check ∈ (`active`, `paused`, `canceled`) | |
| `notifyDaysBefore` | `integer` | not null, default `3`, `>= 0` | Days before `nextChargeAt` to email |
| `category` | `text` | not null | Single category in v1 |
| `cancelUrl` | `text` | nullable | Merchant manage / cancel link |
| `createdAt` | `timestamptz` | not null, default `now()` | |

### Anchor day

Stored separately from `startedAt` / `nextChargeAt` so a 31st-of-month subscription does not permanently collapse after February.

| Cadence | Meaning of `anchorDay` | Range |
| --- | --- | --- |
| `weekly` | ISO day of week | `1`–`7` (Mon–Sun) |
| `monthly`, `quarterly`, `yearly` | Day of month | `1`–`31` |

When the target month has fewer days than `anchorDay`, that occurrence uses the last day of the month. The stored `anchorDay` does not change. Example: 31 Jan → 28 Feb (or 29) → 31 Mar.

## `notification`

One row per successfully sent (or claimed) reminder for a given charge date.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `subscriptionId` | `uuid` | not null, FK → `subscription.id` on delete cascade | |
| `forChargeDate` | `date` | not null | The charge's calendar date (user-local date of that charge) |
| `sentAt` | `timestamptz` | not null, default `now()` | When the worker claimed / sent it |

## Indexes

```sql
create index subscription_next_charge_at_idx on subscription (nextChargeAt);
create index subscription_user_id_idx on subscription (userId);

create unique index notification_subscription_charge_uidx
  on notification (subscriptionId, forChargeDate);
```

The unique index on `(subscriptionId, forChargeDate)` is the only guard against duplicate reminder emails when the hourly cron retries.

Cron shape (not a stored index, but the query the indexes exist for):

- active subscriptions whose reminder window contains “now”
- join user, filter `timezone` so local time is 09:00
- insert `notification` first; unique violation → skip send

## Relationships

```
user 1 ── * subscription 1 ── * notification
```

There is no demo user row. Demo data does not live in these tables.

## Money

`amount` is an integer in the currency's minor units (ISO 4217 exponent: USD/EUR = 100, JPY = 1). Display divides by `10^exponent`. Never convert with floats. v1 does not convert between currencies — dashboard sums are per currency, or the UI groups by `currency` when a user has more than one.
