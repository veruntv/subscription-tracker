import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "~/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy policy — Subscription Tracker",
  description:
    "How Subscription Tracker uses account data and PostHog analytics cookies.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-5 sm:px-10 sm:py-6">
        <p className="min-w-0 truncate text-sm font-semibold tracking-tight">
          Subscription Tracker
        </p>
        <Button asChild variant="ghost">
          <Link href="/">Back</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-24 sm:px-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy policy
        </h1>
        <p className="mt-2 text-sm text-muted">Last updated 10 September 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-fg">Who we are</h2>
            <p>
              Subscription Tracker is a web app at vera-automation.online. It keeps
              the list of recurring charges you add to your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-fg">Account data</h2>
            <p>
              When you sign in we store your email address, timezone, currency
              preference, and the subscriptions you enter. This stays on our
              servers in the EU (Hetzner, Falkenstein). We do not sell it and we
              do not connect to your bank.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-fg">
              Analytics cookies
            </h2>
            <p>
              We use PostHog Cloud EU (Frankfurt) as our analytics provider, to
              see how people use the product: pages opened, buttons clicked, and
              — if you accept cookies — session recordings and heatmaps. PostHog
              is a data processor. That data is stored in the European Union.
            </p>
            <p>
              If you accept cookies, PostHog may set a cookie on your device and
              remember you as a returning visitor. Form fields in recordings are
              masked. We do not send your email, name, subscription amounts, or
              merchant names to PostHog. A signed-in person is a random id, not
              an email address.
            </p>
            <p>
              If you decline cookies, you can still use the product. We do not
              record your session, and PostHog does not set a persistent cookie.
              We may still count page views without storing a cookie.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-fg">
              How long we keep it
            </h2>
            <p>
              Analytics events are kept for up to one year. Session recordings
              are kept for up to 30 days. Account data stays until you delete
              the row or the account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-fg">Your choice</h2>
            <p>
              On a first visit, a banner asks you to accept or decline analytics
              cookies. Your choice is stored in this browser. Clear site data
              for this domain if you want the banner again.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
