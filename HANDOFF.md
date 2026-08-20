# Handoff — Subscription Tracker

Read this first in a new chat. Then `SPEC.md`, `SCHEMA.md`, `DECISIONS.md`, `AGENTS.project.md`, `RELEASE.md`.

You are continuing an **already deployed** product. Do not scaffold a new app. Do not rebuild on Vercel/Neon unless the user asks.

## Product

Web app: list of recurring charges, monthly/yearly totals, category mix, month calendar, reminder email N days before a charge.

- Signed out → marketing landing (`src/components/landing.tsx`)
- Signed in → tracker (`src/components/tracker-app.tsx`) with tabs Overview / Calendar / Subscriptions
- **No demo mode.** No localStorage list. No CSV, FX, charts, partner sharing, bank APIs, payments, native apps
- Desktop-primary. Do not design mobile-first
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
| Cron | **Not set yet.** Do not use Vercel Cron. Coolify scheduled task should `curl` `/api/cron/reminders` hourly with `CRON_SECRET` |

User (Ilya / Vera in Coolify): works **only in the browser**. No local Node. You push via GitHub token she pastes (classic `repo`, then she **deletes** the token). Never commit secrets. Never ask her to run git locally.

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

**Build-time `DATABASE_URL` caused Auth.js error** `Unsupported database type (object)` — keep DB URL off during build.

Tables were applied: `npx drizzle-kit push --force` inside the **application** Terminal (not the DB terminal). Schema is in `src/server/db/schema.ts`.

## Code map

- `src/app/page.tsx` — landing vs tracker; **dynamic** `import("~/server/auth")` so a bad session cannot 500 the landing
- `src/server/db/index.ts` — real Drizzle instance if `DATABASE_URL` exists (Proxy breaks `@auth/drizzle-adapter`)
- `src/server/auth/config.ts` — Resend provider, Drizzle adapter, 30-day session
- `src/app/login/page.tsx` — email → `signIn("resend")`. Generic red copy if Resend errors (including unverified domain)
- `src/lib/domain/` — schedule (`anchorDay` 31st rule), money as integer minor units, totals (weekly×52, monthly×12, quarterly×4, yearly×1), `categoryMix`
- `src/app/api/cron/reminders/route.ts` — Bearer `CRON_SECRET`, hourly 09:00 user-local

## Design (do not revert)

Pale lilac canvas `#F4EFF7`, grape sidebar `#44355B`, lime accent **only** `#D6F24C` (CTA + today). Mix bar / merchant marks: orange `#FF7A33`, grape, teal `#12B5A0`. Calendar: today = lime disc; charge days = thistle fill. Calendar rows always 7 cells (31st must not stretch). Cells show **names + amounts**, not totals-only.

## What is done

- Landing live on HTTPS domain
- Tracker UI (CRUD, dashboard, calendar, tabs) in code
- Postgres up, schema pushed
- Auth.js + Resend wired; domain sending **Verified**. Try Get started after Coolify Restart.
- Git history on `main` (latest local session also has unpushed 30-day session + `page.tsx` auth isolation — **check `git status` before assuming GitHub is newest**)

## What to do next (order)

1. Coolify Restart → Get started → `vernovicova@gmail.com` (spam too). EMAIL_FROM `Subscription Tracker <noreply@vera-automation.online>`
3. Push any unpushed commits (need a fresh GitHub classic token `repo`, then she deletes it)
4. Coolify cron hourly: `curl -fsS -H "Authorization: Bearer CRON_SECRET" https://vera-automation.online/api/cron/reminders`
5. Sign out button, empty state after first login, Postgres backup in Coolify
6. Optional nicer domain later — add in Coolify + Namecheap A record; keep this one

## Pitfalls already paid for

- Rebuild of the Hetzner box used **LAMP** image once; Apache was stopped; Coolify installed on that disk. Do not Rebuild again
- Coolify “this machine” **is** the Hetzner VPS
- Port **8080** in Coolify domain + exposed ports
- `{{` shared-var interpolation in Coolify did not list the DB; URL was built from tracker-db password + id after `/database/`
- Login error “Magic link is not configured yet” is a **generic** UI string for any `signIn("resend")` error — read Runtime Logs. Known log: `The associated domain with your API key is not verified`

## How to talk to the user

Russian, click-by-click (which button, which field). She has no local terminal. Never tell her to use localhost. Never store tokens in git config after push.
