\# Handoff — Subscription Tracker

Read this first in a new chat. Then [SPEC.md](http://SPEC.md), [SCHEMA.md](http://SCHEMA.md), [DECISIONS.md](http://DECISIONS.md), [AGENTS.project.md](http://AGENTS.project.md), [RELEASE.md](http://RELEASE.md).

You are continuing an already deployed product. Do not scaffold a new app. Do not rebuild on Vercel/Neon unless the user asks.

\## Product

Web app: list of recurring charges, monthly/yearly totals, category mix, month calendar, reminder email N days before a charge.

\- Signed out → marketing landing (src/components/landing.tsx)

\- Signed in → tracker (src/components/tracker-app.tsx) with tabs Overview / Calendar / Subscriptions

\- No demo mode. No localStorage list. No CSV, charts, partner sharing, bank APIs, payments, native apps. Mixed-currency dashboard totals convert to defaultCurrency at a daily rate.

\- Desktop-primary. Do not design mobile-first

\- Auth: magic link only (Resend). No password, no OTP. Session 30 days, database strategy when DATABASE_URL is set. Sign up = sign in (same email)

\## Live infra (2026-08-19)

\- Site: <https://vera-automation.online>

\- Coolify UI: <http://91.99.124.215:8000>

\- Server: Hetzner Cloud, project n8n, server n8n-server, CPX22, Falkenstein, IPv4 91.99.124.215

\- App port inside container: 8080 (not 3000, not 8000 — 8000 is Coolify itself)

\- GitHub: <https://github.com/veruntv/subscription-tracker> (Public)

\- Postgres: Coolify resource tracker-db, postgres:18-alpine, user/db postgres

\- DNS: Namecheap, [vera-automation.online](http://vera-automation.online). A @ and www → 91.99.124.215

\- Mail: Resend, region Ireland. DKIM Verified. SPF/MX on host send often Pending — Namecheap Host Records has no MX type

\- Cron: not set yet. Coolify scheduled curl to <https://vera-automation.online/api/cron/reminders> with CRON_SECRET. Not Vercel Cron.

User works only in the browser. No local Node. Push via GitHub classic token (repo), then she deletes the token. Never commit secrets.

\## Coolify env (names only)

All: Not available during build, Available in the container, then Restart.

\- DATABASE_URL = postgresql://postgres:PASSWORD@&lt;db-uuid&gt;:5432/postgres

\- AUTH_SECRET = already set

\- AUTH_URL = <https://vera-automation.online> (no trailing slash)

\- AUTH_RESEND_KEY = Full access re\_… (domain-restricted keys fail while SPF unverified)

\- EMAIL_FROM = Subscription Tracker &lt;[noreply@vera-automation.online](mailto:noreply@vera-automation.online)&gt;

\- CRON_SECRET = already set

Keep DATABASE_URL off during build (Auth.js "Unsupported database type (object)").

Local Postgres (this Windows machine): portable 18.6 in `%USERPROFILE%\pgsql`, database `subscription_tracker`, no SSL. Recipe and env: [LOCAL.md](./LOCAL.md). `npm run db:up` then `npm run dev`. Do not point local `.env` at Coolify `tracker-db`.

Tables already pushed: npx drizzle-kit push --force in the application Terminal.

\## Code map

\- src/app/page.tsx — landing vs tracker; dynamic import of auth

\- src/server/db/index.ts — real Drizzle if DATABASE_URL exists (Proxy breaks adapter)

\- src/server/auth/config.ts — Resend, Drizzle adapter, 30-day session

\- src/app/login/page.tsx — signIn("resend"); generic error copy

\- src/lib/domain/ — schedule 31st rule, integer money, totals weekly×52 monthly×12 quarterly×4 yearly×1

\- src/app/api/cron/reminders/route.ts — Bearer CRON_SECRET, 09:00 user-local

\## Design (do not revert)

Canvas #F4EFF7, sidebar #44355B, lime accent only #D6F24C (CTA + today). Mix/icons: #FF7A33, grape, #12B5A0. Calendar: today lime disc; charge days thistle. Grid always 7 cells. Cells show names + amounts.

\## Next

1\. Wait Resend SPF TXT on send = Verified. Try magic link anyway with Full-access key.

2\. Coolify Restart → Get started → [vernovicova@gmail.com](mailto:vernovicova@gmail.com) (spam too)

3\. Push unpushed commits if git status is dirty (30-day session may not be on GitHub yet)

4\. Hourly cron in Coolify

5\. Sign out, empty state, Postgres backup

\## Pitfalls

\- Do not Hetzner Rebuild again (LAMP happened once)

\- Coolify "this machine" is the VPS

\- Domain/app port 8080

\- Login "Magic link is not configured yet" is generic — read Runtime Logs

\- Talk to the user in Russian, click-by-click. No localhost.

This conversation belongs to a Grok project. The project's files are mounted at `/workspace/artifacts` — look there for user-provided sources before concluding the workspace has no project files. Files written there persist to the project across conversations.