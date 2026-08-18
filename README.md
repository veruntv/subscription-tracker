# Subscription Tracker

Web app for recurring charges: list, monthly/yearly totals, calendar, reminder email. Signed-out visitors see a landing page. The tracker requires an account (magic link).

Deploy on Hetzner with Coolify — click-by-click: [RELEASE.md](./RELEASE.md).

## Stack

Next.js (App Router) · TypeScript · tRPC · Drizzle ORM · Postgres · Auth.js · Tailwind + shadcn/ui · Resend · Vitest

## Docs

- [SPEC.md](./SPEC.md) — product scope
- [SCHEMA.md](./SCHEMA.md) — tables
- [DECISIONS.md](./DECISIONS.md) — architecture
- [AGENTS.project.md](./AGENTS.project.md) — conventions
- [RELEASE.md](./RELEASE.md) — where to click to go live

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Push schema to Postgres |
