# Decisions

Architectural decisions for this project. Check this file before choosing an approach. If you make a new one, append a dated entry — do not silently overwrite history.

Format: **Status**, context, decision, why, consequences.

---

## 2026-08-18 — Web only for v1

**Status:** accepted (mobile-first consequence superseded — see “Desktop-primary UI”)

**Context:** Recurring-charge tracking is needed in the browser. Native apps were mentioned as a possible later surface.

**Decision:** v1 is a web app only. No React Native, Expo, Capacitor, or other native shell.

**Why:** One codebase, one deploy (Vercel), one auth and cron path. Native would split QA and delay the dashboard / mail loop we actually need.

**Consequences:** Ship a browser app on Vercel. Do not add a native client. How that UI is laid out is decided in “Desktop-primary UI”.

---

## 2026-08-18 — Persist `nextChargeAt`

**Status:** accepted

**Context:** The next charge can be derived from `startedAt`, `cadence`, `intervalCount`, and `anchorDay`. Deriving it on every read is possible.

**Decision:** Store `nextChargeAt` on `subscription`. Recompute on write (create / edit / after a charge rolls forward). Do not compute it in list/dashboard queries.

**Why:** The hourly cron must find “due soon” rows with one narrow indexed query. Computing the next charge for every subscription on each cron tick does not scale and is easy to get wrong under timezones.

**Consequences:** Every schedule-changing write must update `nextChargeAt` in the same transaction. A backfill is required if the formula ever changes. Index: `subscription(nextChargeAt)`.

---

## 2026-08-18 — `anchorDay` is separate from the date

**Status:** accepted

**Context:** Monthly (and quarterly / yearly) charges anchored on the 31st cannot land on 31 Feb. If we only stored the last actual date, February would permanently shift the schedule to the 28th.

**Decision:** Store `anchorDay` (1–31 for month-like cadences, 1–7 ISO weekday for weekly) separately from `startedAt` / `nextChargeAt`. When the month is shorter than `anchorDay`, that occurrence uses the last day of the month. `anchorDay` itself never changes.

**Why:** 31 Jan → 28 Feb → 31 Mar is what users expect. 31 Jan → 28 Feb → 28 Mar is a bug.

**Consequences:** Schedule code must always apply `anchorDay` against the target month, not “last charge + 1 month”. Tests must cover Jan 31, Feb (28 and 29), and March.

---

## 2026-08-18 — Money is integer minor units

**Status:** accepted

**Context:** Subscription amounts need exact sums (month, year, category). IEEE floats and even some decimals accumulate error.

**Decision:** `amount` is `integer` in the currency's minor units. No `float`, no `double`, no implicit JS number arithmetic on money beyond integer minor-unit math.

**Why:** $9.99 × 12 must be exact. Display is the only place that inserts a decimal separator.

**Consequences:** Every API input is an integer (or a decimal string parsed once into minor units on the way in). v1 does no FX; mixed-currency totals stay grouped by currency.

---

## 2026-08-18 — Yearly total normalization

**Status:** accepted

**Context:** A dashboard “per year” number has to compare a weekly gym to an annual domain.

**Decision:** Normalize each active subscription to a yearly figure, then sum:

| Cadence | Charges / year |
| --- | --- |
| `weekly` | 52 / `intervalCount` |
| `monthly` | 12 / `intervalCount` |
| `quarterly` | 4 / `intervalCount` |
| `yearly` | 1 / `intervalCount` |

Monthly dashboard figure = yearly / 12.

**Why:** Simple, explainable, stable. Not “sum whatever happens to fall in this calendar year,” which jumps when a charge date moves.

**Consequences:** Weekly is 52, not 365/7. Leap years do not change the number. Document this in the UI if anyone questions a few-cents difference vs a real calendar year.

---

## 2026-08-18 — UTC in the database, IANA on the user, cron hourly at local 09:00

**Status:** accepted

**Context:** Users live in a timezone. Charge dates and “send at 9am” are local concepts. The database and the cron host are not.

**Decision:** Every `timestamptz` is UTC. Each user has an IANA `timezone`. Cron runs every hour. On each run, send reminders only for users whose local time is currently 09:00 (± the hour window).

**Why:** One worker, no per-user schedulers. Storing local civil times without a zone is how dates shift under DST. Hourly is enough for “9am local” and matches Vercel Cron.

**Consequences:** Reminder logic is: local date of `nextChargeAt` minus `notifyDaysBefore` == today's local date, and local hour == 9. DST spring-forward / fall-back needs tests. Do not schedule a single daily cron at a fixed UTC hour.

---

## 2026-08-18 — Unique `(subscriptionId, forChargeDate)` is the duplicate-email lock

**Status:** accepted

**Context:** Vercel Cron can overlap, retry, or run twice. Email providers can also time out after the message was accepted.

**Decision:** Before send, insert into `notification` with `UNIQUE (subscriptionId, forChargeDate)`. Unique violation → skip. That index is the only idempotency mechanism.

**Why:** Application-level “did we already send?” checks race. A unique constraint does not.

**Consequences:** The insert must happen in the same logical step as the send claim (insert first, then send; or insert in a transaction you can mark). A failed send after a successful insert will not retry automatically — that is accepted for v1 (ops can delete the row). Do not add a second “sent” flag as a substitute for the unique key.

---

## 2026-08-18 — Desktop-primary UI

**Status:** accepted

**Context:** The product is web-only. An earlier note treated phones as the primary surface (mobile-first CSS, ~390px as a required target). Actual use will be from a desktop browser.

**Decision:** Design and build for desktop first. Default canvas is a laptop/desktop viewport (roughly 1280px+). Do not design mobile-first. Do not spend v1 effort on a phone layout, touch-first controls, or a 390px acceptance bar.

**Why:** The calendar, category breakdown, and upcoming-charges list are denser and clearer on a wide screen. Optimizing for a phone first would constrain the dashboard we actually need.

**Consequences:** Multi-column layouts are allowed and expected. A stacked/narrow fallback is optional, not required. Do not block a release on mobile QA. Pointer/hover affordances (tables, side panels, date grids) are the default, not an enhancement.

---

## 2026-08-18 — Scaffold is create-t3-app; no app tables yet

**Status:** accepted

**Context:** v1 stack is Next.js App Router, tRPC, Drizzle, Auth.js, Tailwind, shadcn/ui, Vitest, Vercel. The first ship is an empty, deployable skeleton.

**Decision:** Initialize from create-t3-app (TypeScript, Drizzle, Auth.js, Tailwind, tRPC, Postgres). Auth.js schema (`user`, `account`, `session`, `verification_token`) lives in Drizzle so the adapter is typed. Do **not** add `subscription` / `notification`, do not `db:push`, do not send mail. Magic-link (Resend) is configured only when `AUTH_RESEND_KEY` and `EMAIL_FROM` are set. Env vars are optional so the site builds without Neon.

**Why:** A green Vercel deploy unblocks hosting and secrets. Creating app tables now would lock a schema before the first feature pass.

**Consequences:** The home page is static. Cron, Resend, and Drizzle migrations wait. `timezone` / `defaultCurrency` on `user` land with the first auth feature, not in this commit.
