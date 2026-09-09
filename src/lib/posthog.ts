export const POSTHOG_EU_HOST = "https://eu.i.posthog.com";

export function shouldInitPosthog(key: string | undefined): boolean {
  return Boolean(key);
}

export function posthogApiHost(host: string | undefined): string {
  if (!host) return POSTHOG_EU_HOST;
  return host;
}

export function posthogInitOptions(host: string | undefined) {
  return {
    api_host: posthogApiHost(host),
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    // Replay waits for cookie consent (SUB-31 / SUB-32).
    disable_session_recording: true,
    person_profiles: "identified_only" as const,
  };
}
