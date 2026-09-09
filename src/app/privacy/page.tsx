import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "~/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy — Subscription Tracker",
  description: "How Subscription Tracker uses PostHog in the EU.",
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
        <p className="text-sm text-muted">Privacy</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          How we look at usage
        </h1>
        <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted">
          <p>
            Subscription Tracker uses <strong className="font-medium text-fg">PostHog Cloud EU</strong>{" "}
            (Frankfurt) for product analytics and session replay. Events go to{" "}
            <code className="text-fg">eu.i.posthog.com</code>. We do not use Google Analytics
            or Microsoft Clarity.
          </p>
          <p>
            Page views can load so we know the product is used. Session recordings and
            heatmaps start only after you accept analytics cookies on the banner.
            Reject keeps the app working; we do not record that session, and PostHog
            does not set a persistent cookie.
          </p>
          <p>
            A signed-in person is identified by an internal user id, never by email
            or name. Subscription amounts, merchant names, and the email field are
            not sent as analytics properties. Input fields are masked in recordings.
          </p>
          <p>
            The choice is stored in this browser. Clearing site data for this domain
            shows the banner again.
          </p>
        </div>
      </main>
    </div>
  );
}
