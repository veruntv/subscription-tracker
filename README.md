# Subscription Tracker

Web app for tracking recurring charges. This repo is a deployable skeleton (Next.js App Router, tRPC, Drizzle, Auth.js, Tailwind, shadcn/ui). Product behavior is not implemented yet — see [SPEC.md](./SPEC.md).

## Stack

Next.js (App Router) · TypeScript · tRPC · Drizzle ORM · Postgres (Neon) · Auth.js · Tailwind + shadcn/ui · Vitest · Vercel

## Local setup

1. **Node 22** and npm.
2. Copy environment template and fill values (see comments in the file):

   ```bash
   cp .env.example .env
   ```

   Minimum to run the empty site: you can leave secrets blank. The home page does not touch the database.
3. Install and start:

   ```bash
   npm install
   npm run dev
   ```

   Dev server: `http://localhost:3000` if you change the port; this repo’s `npm run dev` binds **port 8080**.
4. Optional checks:

   ```bash
   npm test
   npm run typecheck
   npm run build
   ```

Do **not** run `db:push` / `db:migrate` yet — application tables are not in the schema.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Drizzle SQL from schema (later) |
| `npm run db:push` | Push schema to Neon (later) |

## Docs

- [SPEC.md](./SPEC.md) — product scope
- [SCHEMA.md](./SCHEMA.md) — tables (not applied yet)
- [DECISIONS.md](./DECISIONS.md) — architecture
- [AGENTS.project.md](./AGENTS.project.md) — conventions
