import {
  type AnalyticsConsent,
  posthogPersistence,
  recordingAllowed,
} from "~/lib/analytics-consent";

export const POSTHOG_EU_HOST = "https://eu.i.posthog.com";

export function shouldInitPosthog(key: string | undefined): boolean {
  return Boolean(key);
}

export function posthogApiHost(host: string | undefined): string {
  if (!host) return POSTHOG_EU_HOST;
  return host;
}

export function posthogInitOptions(
  host: string | undefined,
  consent: AnalyticsConsent | null = null,
) {
  const allowRecord = recordingAllowed(consent);
  return {
    api_host: posthogApiHost(host),
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    persistence: posthogPersistence(consent),
    disable_session_recording: !allowRecord,
    enable_heatmaps: allowRecord,
    person_profiles: "identified_only" as const,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: ".ph-no-capture",
    },
  };
}
