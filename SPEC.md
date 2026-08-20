# Subscription Tracker — Product Spec

Web application for tracking recurring charges (Netflix, gym, hosting). A user keeps one list of subscriptions, sees what is due next, understands monthly and yearly spend, and gets an email N days before each charge.

**Platform:** web only, designed for desktop browsers. No native iOS/Android apps, no wrappers (React Native, Capacitor, Expo). Do not design mobile-first or treat a phone viewport as the primary layout.

## Goals

- One place to see every recurring charge
- No surprise deductions — upcoming payments are obvious, and a reminder email goes out in time
- Honest monthly and yearly totals, including a category breakdown
- A public landing page for people who are not signed in

## Non-goals

Never in this product:

- Bank / Open Banking APIs
- Taking, storing, or processing payments
- Native mobile or desktop applications

Deferred — see [v2](#v2--deferred).

## v1 — in scope

### Subscriptions (CRUD)

Each subscription has:

| Field | Notes |
| --- | --- |
| Name | Required. What the user will recognize in a list. |
| Amount | Required. Stored as integer minor units of the currency (see `SCHEMA.md`). |
| Currency | ISO 4217. Default comes from the user's `defaultCurrency`. |
| Cadence | `weekly` \| `monthly` \| `quarterly` \| `yearly`. |
| Interval count | Every N periods. `1` = every month (or week / quarter / year). |
| First charge date | `startedAt`. Combined with cadence to drive the schedule. |
| Category | Required. Used on the dashboard breakdown. |
| Cancel URL | Optional link to the merchant's cancel / manage page. |
| Notify N days before | Per-subscription. Used by the reminder email. |
| Status | `active` \| `paused` \| `canceled`. |

Editing amount, cadence, interval, or the first-charge date recalculates `nextChargeAt`. Pausing freezes reminders and excludes the row from upcoming / calendar / totals. Canceling is a status change, not a hard delete. Hard delete is allowed and removes the row (notification history for that row goes with it).

### Dashboard

Signed-in home (and the demo home) shows:

- **Next charges** — upcoming active subscriptions, soonest first
- **This calendar month** — sum of actual charge amounts whose charge date falls in the current month (full invoice, not yearly ÷ 12), converted into the user's `defaultCurrency` at today's rate when currencies mix
- **Yearly total** — normalized spend of all active subscriptions (see table below), same conversion
- **By category** — both figures, grouped by category, in `defaultCurrency` when converting
- Individual subscription amounts (list, upcoming, calendar) stay in the currency the user entered

Normalization for a single subscription, then summed:

| Cadence | Yearly multiplier |
| --- | --- |
| `weekly` | × 52 |
| `monthly` | × 12 |
| `quarterly` | × 4 |
| `yearly` | × 1 |

Apply `intervalCount`: yearly factor is `multiplier / intervalCount` (every 2 months → `12 / 2 = 6` charges per year). The dashboard hero **this month** is not this number ÷ 12; it is the sum of invoices that land in the current calendar month. The yearly figure stays normalized. When those invoices are in more than one currency, convert each amount into `defaultCurrency` at the current day's mid-market rate, then add. Do not convert the amount shown on a single subscription row.

Paused and canceled rows do not count.

### Calendar

A month-forward calendar of expected charge dates for active subscriptions. The current month is the default; the user can move one month at a time. Each day lists the subscriptions that charge on that day and their amounts.

Charge dates on the calendar use the same schedule rules as `nextChargeAt` (including the 31st → end-of-short-month → 31st-again rule in `DECISIONS.md`).

### Reminder email

- One email per upcoming charge, sent N days before `nextChargeAt`
- N is `notifyDaysBefore` on the subscription
- Sent at **09:00 in the user's IANA timezone**
- A Vercel Cron job runs hourly, finds users whose local time is currently 09:00, and sends due reminders
- Delivery is recorded in `notification` so retries cannot double-send

Email contains: subscription name, amount + currency, charge date, and the cancel URL when present. Provider: Resend.

### Marketing landing

- The signed-out home is a product page: what it is, how it works, Sign in / Create account
- There is no seeded demo and no device-local list
- Sign up and sign in are the same magic-link flow

### Auth (v1)

- Auth.js magic link (email)
- After sign-in the user sets timezone (IANA) and default currency if they are still at system defaults
- All subscription data is scoped to `userId`. No shared or partner lists in v1

### Settings (v1)

- Timezone (IANA)
- Default currency (ISO 4217)
- Per-subscription `notifyDaysBefore` (not a single global N)

## v2 — deferred

- CSV import from a bank export
- Live (intraday) FX ticks — daily mid-market is in v1
- Trend charts over time
- Sharing a list with a partner
- Tags (beyond a single category)
- Native apps (if ever — not planned, not designed)

## Out of scope forever (this product)

- Connecting to a bank
- Charging the user or storing card details
- Native iOS / Android / desktop clients

## Acceptance (v1)

- Create, edit, pause, resume, cancel, and delete a subscription
- Dashboard monthly / yearly / category numbers match the normalization rules
- Calendar shows the next month of charges, including 31st-anchor collapse
- A user with timezone `Europe/Chisinau` and `notifyDaysBefore = 3` gets one email at local 09:00, three days before the charge
- Retrying the cron does not send a second email for the same `(subscription, charge date)`
- Signed-out visitors see the landing page; the tracker is only after sign-in
- Layout is designed for a desktop browser (dashboard + calendar side by side is fine). A narrow window may be usable, but it is not a target
- Web only — no native shell required to complete any v1 flow
