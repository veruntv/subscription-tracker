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

**Consequences:** Every API input is an integer (or a decimal string parsed once into minor units on the way in). Mixed-currency dashboard sums convert through a scaled integer rate — see 2026-08-20 FX.

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

**Consequences:** Weekly is 52, not 365/7. Leap years do not change the number. Document this in the UI if anyone questions a few-cents difference vs a real calendar year. The **hero “this month” number** is a separate decision (calendar-month invoices) — see 2026-08-20.

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

**Consequences:** Multi-column layouts are allowed and expected. Pointer/hover affordances (tables, side panels, date grids) stay the desktop default. Narrow fallback is now required — see 2026-08-21.

---

## 2026-08-21 — Usable phone and tablet layout

**Status:** accepted (narrows “Desktop-primary UI”)

**Context:** v1 shipped desktop-only. The user uses the tracker from a phone and tablet; the grape sidebar and 12-column dashboard overflow and look broken. They asked to fix this before v2.

**Decision:** Keep desktop (~1280px+) as the designed canvas. Below `lg`, stack: top bar + horizontal tabs, single-column overview, list and calendar may scroll sideways. Same routes and components — no native app.

**Why:** One web app. A stacked CSS fallback is enough. Mobile-first redesign would fight the dashboard we already have.

**Consequences:** Do not drop the sidebar on desktop. Do not add a separate mobile site. Calendar cells stay seven columns; on a phone the grid scrolls horizontally rather than stretching day 31.

---

## 2026-08-18 — Scaffold is create-t3-app; Auth.js tables exist, app tables follow SCHEMA.md

**Status:** accepted

**Context:** v1 stack is Next.js App Router, tRPC, Drizzle, Auth.js, Tailwind, shadcn/ui, Vitest, Vercel.

**Decision:** Initialize from create-t3-app. Drizzle holds Auth.js tables plus `subscription` and `notification` as specified in SCHEMA.md. `timezone` and `defaultCurrency` live on `user`. Magic-link (Resend) is configured only when `AUTH_RESEND_KEY` and `EMAIL_FROM` are set.

**Why:** One schema file matches the product spec. Optional env lets the site boot in preview.

**Consequences:** `db:push` is required before a signed-in account works against Neon. Preview does not push.

---

## 2026-08-18 — Demo is a device-local store; the account DB is opt-in

**Status:** accepted

**Context:** v1 must work without an account. Preview and first-run have no Neon URL. Demo writes must never hit the shared database or send mail.

**Decision:** Signed-out (and any environment without `DATABASE_URL`) uses a `localStorage` document on this device, seeded with realistic subscriptions. tRPC + Drizzle run only when the user is signed in **and** `DATABASE_URL` is set. The hourly cron is a no-op without a database; it never reads demo data.

**Why:** The product has to be playable immediately. A shared demo user would leak edits and could email strangers.

**Consequences:** Clearing site data resets the demo. Signing in does not import the demo list in v1. Reminder emails require Neon + Resend.

---

## 2026-08-18 — Finance UI: Ramp lime on forest and bone

**Status:** accepted

**Context:** Editorial paper/copper was dropped. The user asked for a finance-tracker look, then specifically Ramp’s lime.

**Decision:** Geist, desktop-first sidebar. Accent `#d6f24c`. Sidebar `#13241c`. Canvas `#f3f2ea`. Category marks and bars stay olive/charcoal. Lime is the only saturated color.

**Why:** [Ramp vs Mercury](https://mobbin.com/sites/sections/d5541dd9-5262-4788-aeda-0851057f2a4b) already pairs lime with deep green and warm off-white. Rainbow chips fight the accent.

**Consequences:** Do not bring back Newsreader, copper, teal, or a rainbow without a new decision.

---

## 2026-08-18 — Calendar cells name the charge; last row is padded

**Status:** accepted

**Context:** Day 31 stretched across the last row. Cells showed sums with no names.

**Decision:** Pad the month grid with trailing blank cells so every row has seven tracks. Each charged day lists subscription names and amounts; two names stay stacked, a shared total only if more than one.

**Why:** A lone 31st must stay one-seventh of the row. The calendar has to answer “what is this,” not just “how much.”

**Consequences:** Do not drop the trailing blanks to “tighten” the last week.

---

## 2026-08-18 — Spend headline shows mix, not a second stat row

**Status:** accepted

**Context:** The monthly card had a dead lower half. Year and active count repeated the rest of the page. User picked variant B from the lavish comparison.

**Decision:** Keep the monthly total as the only hero. Fill the card with a stacked olive bar of this currency’s categories (top three named, tail folded into remainder if more than four). Year, active count, and other currencies sit on one caption line.

**Why:** “73 EUR” is abstract until you see it is mostly gym + streaming + hosting. Upcoming already owns the next charge; this card owns composition.

**Consequences:** The “By category” list stays as the full breakdown. Do not add a sparkline or vs-last-month here — v1 has no history. Year-as-caption superseded — see 2026-08-20 yearly figure.

---

## 2026-08-18 — Acid-on-charcoal palette, lime as accent only

**Status:** accepted (supersedes forest/olive supporting colors)

**Context:** The user picked a five-swatch palette: lime `#D6F24C`, ink `#0F1115`, charcoal `#1B1F26`, gray `#8A9099`, paper `#F2F4F0`. Olive category marks and the mix bar felt off. Lime should stay scarce.

**Decision:** Semantic tokens map onto those five colors. Canvas is paper, sidebar and type are ink, cards lift to white. Merchant marks are charcoal, not category-colored. Mix and category bars step through ink / charcoal / gray. Lime is reserved for the primary button (and focus rings). Demo chip, today cell, and status pills stay in the neutrals.

**Why:** The named palette is already a complete system. Extra hues on icons and the mix bar competed with the accent.

**Consequences:** Do not reintroduce olive, forest, or a category rainbow. Do not flood lime into chips and bars.

---

## 2026-08-18 — Brighter lime + grape + thistle palette

**Status:** accepted (supersedes acid-on-charcoal neutrals)

**Context:** Charcoal marks and mix segments were too close in value. The user asked for a brighter palette and for today vs charge days to read apart.

**Decision:** Tokens are lime `#D6F24C`, grape `#44355B`, thistle `#DDC4DD`, ink `#221E22`, lilac `#DCCFEC`. Canvas is lilac, sidebar is grape, cards are pale paper. Mix bars and merchant marks cycle grape / thistle / ink so adjacent segments contrast. Lime stays on the primary button and today’s date chip. Charge days use a thistle fill; today uses a lime wash plus a lime disc.

**Why:** The previous gray scale hid the breakdown. These five hues already contrast without adding a sixth.

**Consequences:** Do not flatten marks back to one charcoal. Keep today and charge days on different hues.

---

## 2026-08-18 — Pale canvas, vivid orange / grape / teal marks

**Status:** accepted

**Context:** Lilac `#DCCFEC` as the page was too loud. Mix and icons needed brighter, clearly different hues that still sit together.

**Decision:** Canvas is washed lilac `#F4EFF7`. Mix bars and merchant marks cycle orange `#FF7A33`, grape `#44355B`, teal `#12B5A0`. Lime stays the action accent. Charge-day fill is pale thistle `#EDE4F0`.

**Why:** Orange and teal are complements; grape ties them to the sidebar. A pale page lets those three read as color, not as the room.

**Consequences:** Do not put the loud lilac back on the page. Do not flatten marks to one hue.

---

## 2026-08-18 — Sidebar items are tabs, not in-page anchors

**Status:** accepted

**Context:** Overview, Calendar, and Subscriptions were three stacked sections on one scroll. The user asked to switch them as tabs.

**Decision:** Those three sidebar items set a `tab` state and a `#overview` / `#calendar` / `#list` hash. Only the active pane renders. Add subscription stays on every pane.

**Why:** Each pane is a different job. Scrolling past a dashboard to reach the table made the sidebar lie.

**Consequences:** Do not put all three panes back on one scrolling page without a new decision.

---

## 2026-08-18 — No demo; signed-out home is a landing page

**Status:** accepted (supersedes device-local demo)

**Context:** The user does not want a seeded playground. First visit should sell the product and send people to sign in / sign up.

**Decision:** `/` is a marketing page when there is no session. The tracker mounts only after sign-in. Sign up and sign in share the magic-link form. Demo localStorage is no longer loaded.

**Why:** A demo list that dies on another device is the wrong first impression. An account is the product.

**Consequences:** Preview without auth shows the landing, not a fake list. Do not resurrect a seeded demo without a new decision.

---

## 2026-08-20 — Dashboard “this month” is calendar-month invoices

**Status:** accepted (narrows the 2026-08-18 yearly-normalization decision)

**Context:** The hero labeled “This month” showed yearly ÷ 12. A $119.99 yearly gym looked like $10.00 in August even when the real invoice was $119.99. A July yearly charge still leaked into August as a few cents.

**Decision:** The hero and the mix bar sum **actual charge amounts whose date falls in the current calendar month**. Yearly run-rate stays normalized (weekly×52 / monthly×12 / …) and is shown as “/ year”. Category rows show both: this month and / yr.

**Why:** “This month” in English means the invoices this month, not the amortized average.

**Consequences:** A yearly bill that lands in July is $0 in the August hero and still counts in / year. Weekly can appear 4–5 times in one month. Do not label the amortized figure “this month”.

---

## 2026-08-20 — Yearly figure is a second metric, not a caption

**Status:** accepted (narrows “Spend headline shows mix”)

**Context:** After calendar-month invoices, yearly spend sat on an `xs` caption (`3 active · 153.26 USD / year`) and was easy to miss next to the 5xl this-month number.

**Decision:** Same card: this-month stays the 5xl hero; **Per year** is a labeled 3xl figure beside it. Active count stays a caption. The mix bar still reflects this month only.

**Why:** The two numbers answer different questions. Yearly is the run-rate; it should read as a metric, not a footnote.

**Consequences:** Do not grow yearly to match this-month (5xl). Do not move Upcoming off that row for v1.

---

## 2026-08-20 — One color per category

**Status:** accepted (supersedes cycling orange / grape / teal on mix bars and marks)

**Context:** Eight categories shared three hues, so streaming, hosting, and news looked identical. Mix segments were painted by list order, not category: Fitness could be grape today and orange tomorrow. Merchant marks hashed the name and ignored `category`.

**Decision:** Each category has a stable color used on the mix bar, by-category rows, merchant marks, and the landing mock: streaming orange `#FF7A33`, fitness moss `#3D8B6E`, software periwinkle `#6B63C9`, hosting teal `#12B5A0`, housing dusty rose `#C45C6A`, utilities steel `#4A7BA8`, news ochre `#C9A227`, other mauve `#8A7B96`. Lime stays CTA + today only. Grape stays chrome (sidebar, landing footer), not a category.

**Why:** The mix is a category chart. A color that follows the category, not the sort order, is the chart.

**Consequences:** Do not cycle three tones by index. Do not assign lime to a category. Folded remainder uses `other`.

---

## 2026-08-20 — Known-brand logos on merchant names

**Status:** accepted

**Context:** Recurring charges are the same handful of services for most people. Initials on a colored disc do not help scan Netflix vs Hetzner. The user accepted the trademark risk of shipping those marks.

**Decision:** A curated catalog (~90 services) maps name + aliases to a Simple Icons glyph (vendored paths, not a runtime CDN). The name field is a combobox: as the user types, matching brands appear; picking one fills the canonical name and category. `MerchantMark` uses the glyph when `resolveBrand(name)` hits, otherwise the category-colored initials. Unknown names stay custom. Logos are not a claim of partnership.

**Why:** The list is easier to scan, and the combobox absorbs typos (`netlix` → Netflix) without a free-text-only form.

**Consequences:** Do not fetch logos from the network. Do not add every brand on earth — extend `dev/extract-brands.mjs` and regenerate `brand-catalog.ts`. Unknown gyms and landlords stay initials.

---

## 2026-08-20 — Dashboard aggregates convert to defaultCurrency

**Status:** accepted (supersedes “v1 does no FX”)

**Context:** Overview hero picked one currency — the alphabetically first yearly total — so a 1000 MDL invoice hid Fitness USD and Streaming EUR from “Charged this month”. The mix bar and category widths compared numbers that were not in the same unit.

**Decision:** Rows the user entered (list, upcoming, calendar) keep that subscription’s amount and currency. Metrics that have to add money — this month, per year, mix, by category — convert each integer minor-unit amount into `user.defaultCurrency` at today’s mid-market rate, then sum. Rates come from ExchangeRate-API’s open daily USD feed (`open.er-api.com/v6/latest/USD`), which includes MDL. The process caches by UTC date and keeps yesterday’s table if today’s fetch fails. The hourly reminder cron warms the cache. IEEE floats exist only when ingesting a rate into a 1e8 fixed-point integer; `mulDivRound` does the rest.

**Why:** One headline that ignores other currencies looks like the last bill. Daily rates are enough for a tracker. A key-less feed fits Coolify (no new secret).

**Consequences:** Do not convert the amount on a subscription row. Do not pick a “primary” currency for the hero when rates are available. If rates are missing, prefer `defaultCurrency` and still group leftovers by currency. Do not store historical rates per charge in v1.

