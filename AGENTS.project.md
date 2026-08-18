# Subscription Tracker

Web app for tracking recurring charges: list, dashboard (month / year / categories), month-forward calendar, reminder email N days before a charge. Signed-out visitors see a marketing landing. The tracker requires an account.

**v1 is web only, desktop-primary.** No native apps. Do not design mobile-first.

## Specs (read these first)

- [SPEC.md](./SPEC.md) — v1 scope, v2 deferred, never-do
- [SCHEMA.md](./SCHEMA.md) — tables, types, indexes
- [DECISIONS.md](./DECISIONS.md) — architectural decisions

Before any architectural choice, check `DECISIONS.md`. If you decide something new, append it there.

## Stack

- Next.js (App Router) + TypeScript
- tRPC
- Drizzle ORM
- Postgres (Neon)
- Auth.js — magic link
- Tailwind + shadcn/ui
- Resend (transactional email)
- Vercel Cron (hourly reminder worker)
- Vitest
- Deploy: Vercel

## Conventions

- Code, comments, identifiers, and commit messages are **English**
- Strict TypeScript — no `any`
- Business logic lives in plain functions / modules, not in React components
- Layout is **desktop-first** (laptop/desktop browser). Do not design for mobile; a narrow window is not a v1 target
- Money is integer minor units; dates in the DB are UTC; see `DECISIONS.md`
- Do not add bank APIs, payments, FX, or a native client
