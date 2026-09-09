"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { env } from "~/env";
import {
  ANALYTICS_CONSENT_EVENT,
  type AnalyticsConsent,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "~/lib/analytics-consent";
import { posthogInitOptions, shouldInitPosthog } from "~/lib/posthog";

function applyConsent(consent: AnalyticsConsent) {
  if (typeof window === "undefined") return;
  writeAnalyticsConsent(window.localStorage, consent);
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
  if (!shouldInitPosthog(env.NEXT_PUBLIC_POSTHOG_KEY) || !posthog.__loaded) return;
  posthog.set_config(posthogInitOptions(env.NEXT_PUBLIC_POSTHOG_HOST, consent));
  if (consent === "accepted") posthog.startSessionRecording();
  else posthog.stopSessionRecording();
}

export function CookieBanner() {
  const [choice, setChoice] = useState<AnalyticsConsent | "pending" | null>("pending");

  useEffect(() => {
    setChoice(readAnalyticsConsent(window.localStorage));
  }, []);

  if (choice !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-grape text-lilac"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p className="max-w-xl text-sm leading-relaxed text-thistle">
          We use tracking cookies to understand how you use the product and help
          us improve it. If you accept, we may also record your session.{" "}
          <Link href="/privacy" className="text-accent underline-offset-4 hover:underline">
            Privacy policy
          </Link>
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            className="bg-transparent text-lilac shadow-none ring-1 ring-lilac/30 hover:bg-lilac/10 hover:text-lilac"
            onClick={() => {
              applyConsent("rejected");
              setChoice("rejected");
            }}
          >
            Decline cookies
          </Button>
          <Button
            onClick={() => {
              applyConsent("accepted");
              setChoice("accepted");
            }}
          >
            Accept cookies
          </Button>
        </div>
      </div>
    </div>
  );
}
