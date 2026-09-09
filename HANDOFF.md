# Handoff — Subscription Tracker

Read this first in a new chat. Then `SPEC.md`, `SCHEMA.md`, `DECISIONS.md`, `AGENTS.project.md`, `RELEASE.md`. Local Postgres on this Windows machine: `LOCAL.md`.

You are continuing an **already deployed** product. Do not scaffold a new app. Do not rebuild on Vercel/Neon unless the user asks.

## Product

Web app: list of recurring charges, monthly/yearly totals, category mix, month calendar, reminder email N days before a charge.

- Signed out → marketing landing (`src/components/landing.tsx`)
- Signed in → tracker (`src/components/tracker-app.tsx`) with tabs Overview / Calendar / Subscriptions
- **No demo mode.** No localStorage list. No CSV, charts, partner sharing, bank APIs, payments, native apps. Dashboard totals convert mixed currencies into `defaultCurrency` at a daily rate; rows keep the entered currency.
- Desktop-primary canvas. Phone/tablet get a stacked layout (see DECISIONS 2026-08-21). Do not design mobile-first or add a native app
- Auth: **magic link only** (Resend). No password, no OTP. Session **30 days**, database strategy when `DATABASE_URL` is set. Sign up = sign in (same email)

## Live infra (2026-08-19)

| Piece | Value |
| --- | --- |
| Site | https://vera-automation.online |
| Old Coolify preview host | http://mul9xotnwdreom1fabporoeh.91.99.124.215.sslip.io (keep as extra domain or ignore) |
| Coolify UI | http://91.99.124.215:8000 |
| Server | Hetzner Cloud, project `n8n`, server `n8n-server`, **CPX22**, Falkenstein, IPv4 **91.99.124.215** |
| App port inside container | **8080** (not 3000, not 8000 — 8000 is Coolify itself) |
| GitHub | https://github.com/veruntv/subscription-tracker (was made Public for Coolify) |
| Postgres | Coolify resource `tracker-db`, image `postgres:18-alpine`, user/db `postgres` |
| DNS | Namecheap, domain `vera-automation.online`. A `@` and `www` → `91.99.124.215` |
| Mail | Resend, region **Ireland**. Domain `vera-automation.online`: DKIM + SPF TXT `send` + MX `send` **Verified** (2026-08-20). Namecheap MX is **Mail Settings → Custom MX** (Host Records Type has no MX). Enable Receiving off |
| Cron | Coolify scheduled task hourly: `curl` `/api/cron/reminders` with `CRON_SECRET`. Do not use Vercel Cron. |

User (Ilya / Vera in Coolify): works **only in the browser**. This Windows machine has Node, git, and **GitHub CLI already logged in as `veruntv`** (`repo` scope, credential helper `gh auth git-credential`). Push with `git push`; do **not** ask her for a GitHub token. Never commit secrets. Never ask her to run git locally.

## Coolify env (names only — never paste secrets into git)

All of these: **Not available during build**, **Available in the container**, then Restart (not always full Deploy).

| Name | Expected value |
| --- | --- |
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@<db-uuid-from-coolify-url>:5432/postgres` |
| `AUTH_SECRET` | long random, already set |
| `AUTH_URL` | `https://vera-automation.online` (no trailing slash) |
| `AUTH_RESEND_KEY` | Resend key with **Full access** (`re_…`). Domain-restricted keys fail while SPF is unverified |
| `EMAIL_FROM` | `Subscription Tracker <noreply@vera-automation.online>` once sending is verified. Temporary fallback Resend allows: `Subscription Tracker <beth.t@example.com>` |
| `CRON_SECRET` | already set |
| `SKIP_ENV_VALIDATION` | optional `1` |
| `NEXT_PUBLIC_POSTHOG_KEY` | not set yet (SUB-29). Public `phc_…` key. **Available during build** |
| `NEXT_PUBLIC_POSTHOG_HOST` | not set yet (SUB-29). `https://eu.i.posthog.com`. **Available during build** |

**Build-time `DATABASE_URL` caused Auth.js error** `Unsupported database type (object)` — keep DB URL off during build. PostHog `NEXT_PUBLIC_*` keys are the opposite: they must be present at build once SUB-29 is done.

Tables were applied: `npx drizzle-kit push --force` inside the **application** Terminal (not the DB terminal). Schema is in `src/server/db/schema.ts`.

## Code map

- `src/app/page.tsx` — landing vs tracker; **dynamic** `import("~/server/auth")` so a bad session cannot 500 the landing
- `src/server/db/index.ts` — real Drizzle instance if `DATABASE_URL` exists (Proxy breaks `@auth/drizzle-adapter`)
- `src/server/auth/config.ts` — Resend provider, Drizzle adapter, 30-day session
- `src/app/login/page.tsx` — email → `signIn("resend")`. Success replaces the form with **Check your email**. Generic red copy if Resend errors (including unverified domain)
- `src/lib/domain/` — schedule (`anchorDay` 31st rule), money as integer minor units, FX convert via 1e8 scaled rates, totals (weekly×52, monthly×12, quarterly×4, yearly×1), `categoryMix`
- `src/server/fx/rates.ts` — daily USD quotes from `open.er-api.com`, in-process cache by UTC date
- `src/app/api/cron/reminders/route.ts` — Bearer `CRON_SECRET`, hourly; send at `user.notifyHour` plus one hour of catch-up

## Design (do not revert)

Pale lilac canvas `#F4EFF7`, grape sidebar `#44355B`, lime accent **only** `#D6F24C` (CTA + today — not a category). Known merchant names (Netflix, Spotify, Hetzner, …) show a vendored brand glyph; unknown names use category-colored initials. Mix bar, unmarked merchants, and by-category use one color per category: streaming orange `#FF7A33`, fitness moss `#3D8B6E`, software periwinkle `#6B63C9`, hosting teal `#12B5A0`, housing dusty rose `#C45C6A`, utilities steel `#4A7BA8`, news ochre `#C9A227`, other mauve `#8A7B96`. Calendar: today = lime disc; charge days = thistle fill. Calendar rows always 7 cells (31st must not stretch). Cells show **names + amounts**, not totals-only.

## What is done

- Landing live on HTTPS domain
- Tracker UI (CRUD, dashboard, calendar, tabs) in code
- Postgres up, schema pushed
- Auth.js + Resend wired; domain sending **Verified**. Magic-link login and reminder mail both work.
- Hourly Coolify cron for `/api/cron/reminders`. Postgres backup on `tracker-db`.
- Sign out, empty state, first-run timezone/currency, phone/tablet stacked layout.
- Reminder slice (Linear **See the reminder**, merged to `main`): last sent on the row, Resend retry, batched same-day same-N mail, Upcoming = 30 days, click Upcoming to edit, `notifyHour` in Settings.
- Git history on `main`. Check `git status` before assuming GitHub is newest.

## What to do next

Product analytics: Linear project [See how people use it](https://linear.app/subscription-track/project/see-how-people-use-it-224181d159f1). PostHog Cloud **EU** only. Do not add GA4 or Microsoft Clarity. Do not self-host PostHog on the Hetzner box.

Order:

1. [SUB-29](https://linear.app/subscription-track/issue/SUB-29/open-posthog-cloud-eu-and-put-keys-in-coolify) — user: PostHog EU account + Coolify keys (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`). Those two must be **available during build**.
2. [SUB-30](https://linear.app/subscription-track/issue/SUB-30/load-posthog-on-landing-login-and-tracker) — load SDK on landing, login, tracker.
3. [SUB-31](https://linear.app/subscription-track/issue/SUB-31/cookie-consent-before-replay-plus-a-privacy-page) — cookie banner + `/privacy`.
4. [SUB-32](https://linear.app/subscription-track/issue/SUB-32/record-sessions-and-heatmaps-mask-money-and-email) — replay/heatmaps, mask money and email.
5. [SUB-33](https://linear.app/subscription-track/issue/SUB-33/track-signup-sign-in-and-subscription-actions) — named events + funnel.

Never send email, name, or subscription amounts to PostHog. Identify by Auth.js `user.id`.

CSV export/import and charge history stay in Backlog. Do not add partner sharing or live FX.

## Pitfalls already paid for

- Rebuild of the Hetzner box used **LAMP** image once; Apache was stopped; Coolify installed on that disk. Do not Rebuild again
- Coolify “this machine” **is** the Hetzner VPS
- Port **8080** in Coolify domain + exposed ports
- `{{` shared-var interpolation in Coolify did not list the DB; URL was built from tracker-db password + id after `/database/`
- Login error “Magic link is not configured yet” is a **generic** UI string for any `signIn("resend")` error — read Runtime Logs. Known log: `The associated domain with your API key is not verified`

## How to talk to the user

Russian, click-by-click (which button, which field). She has no local terminal. Never tell her to use localhost. Never ask her to paste a GitHub token — `gh` is already logged in. Never store tokens in git config.
