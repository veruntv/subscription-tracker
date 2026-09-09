"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, type ReactNode } from "react";

import { env } from "~/env";
import {
  ANALYTICS_CONSENT_EVENT,
  readAnalyticsConsent,
} from "~/lib/analytics-consent";
import { posthogInitOptions, shouldInitPosthog } from "~/lib/posthog";

let pendingUserId: string | null = null;

export function PostHogProvider({ children }: { children: ReactNode }) {
  const key = env.NEXT_PUBLIC_POSTHOG_KEY;

  useEffect(() => {
    if (!shouldInitPosthog(key) || !key) return;
    const consent = readAnalyticsConsent(window.localStorage);
    if (!posthog.__loaded) {
      posthog.init(key, {
        ...posthogInitOptions(env.NEXT_PUBLIC_POSTHOG_HOST, consent),
        loaded: (client) => {
          if (pendingUserId) client.identify(pendingUserId);
        },
      });
    }

    const onConsent = () => {
      if (!posthog.__loaded) return;
      const next = readAnalyticsConsent(window.localStorage);
      posthog.set_config(posthogInitOptions(env.NEXT_PUBLIC_POSTHOG_HOST, next));
      if (next === "accepted") posthog.startSessionRecording();
      else posthog.stopSessionRecording();
    };
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, onConsent);
  }, [key]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function PostHogIdentify({ userId }: { userId: string }) {
  useEffect(() => {
    if (!shouldInitPosthog(env.NEXT_PUBLIC_POSTHOG_KEY)) return;
    pendingUserId = userId;
    if (posthog.__loaded) posthog.identify(userId);
    return () => {
      if (pendingUserId === userId) pendingUserId = null;
    };
  }, [userId]);

  return null;
}
