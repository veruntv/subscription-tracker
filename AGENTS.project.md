# Conventions — Subscription Tracker

Canonical current state and next work: `HANDOFF.md`. Then `SPEC.md`, `SCHEMA.md`, `DECISIONS.md`, `RELEASE.md`, `LOCAL.md`.

You are continuing an **already deployed** product. Do not scaffold a new app. Do not rebuild on Vercel/Neon unless the user asks.

## Product constraints

- Signed out → landing. Signed in → tracker (Overview / Calendar / Subscriptions).
- No demo mode. No localStorage list. No bank APIs, payments, or native apps.
- CSV, spend charts, partner sharing, live FX stay out of the current slice unless the user moves a Backlog ticket.
- Desktop-primary canvas. Phone/tablet stack. Do not design mobile-first.
- Auth: magic link only (Resend). No password, no OTP.

## Analytics

PostHog Cloud **EU** is the analytics product (`DECISIONS.md`). Do not add Google Analytics 4 or Microsoft Clarity. Do not self-host PostHog on the Hetzner box. Do not send email, name, or amounts.

Current tickets: Linear project [See how people use it](https://linear.app/subscription-track/project/see-how-people-use-it-224181d159f1). Start at SUB-29 (keys in Coolify), then code.

## How to talk to the user

Russian, click-by-click (which button, which field). She has no local terminal. Never tell her to use localhost. Never ask her to paste a GitHub token — `gh` is already logged in as `veruntv`. Never store tokens in git config.
