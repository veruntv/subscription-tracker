# Subscription Tracker

Web app for recurring charges: list, monthly/yearly totals, calendar, reminder email. Signed-out visitors see a landing page. The tracker requires an account (magic link).

Deploy on Hetzner with Coolify — click-by-click: [RELEASE.md](./RELEASE.md).

Local Postgres and `npm run dev`: [LOCAL.md](./LOCAL.md).

## Stack

Next.js (App Router) · TypeScript · tRPC · Drizzle ORM · Postgres · Auth.js · Tailwind + shadcn/ui · Resend · Vitest

## Docs

- [SPEC.md](./SPEC.md) — product scope
- [SCHEMA.md](./SCHEMA.md) — tables
- [DECISIONS.md](./DECISIONS.md) — architecture
- [AGENTS.project.md](./AGENTS.project.md) — conventions
- [RELEASE.md](./RELEASE.md) — where to click to go live
- [LOCAL.md](./LOCAL.md) — local Postgres and how to run the app on this machine

## Scripts

| Command | What it does |
| --- | --- |
| `npm run db:up` | Start local Postgres (`127.0.0.1:5432`) |
| `npm run db:down` | Stop local Postgres |
| `npm run dev` | Next.js on `0.0.0.0:8080` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Push schema to Postgres |
| `npm run db:studio` | Open Drizzle Studio |
