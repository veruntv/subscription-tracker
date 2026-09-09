export const ANALYTICS_CONSENT_KEY = "st-analytics-consent";
export const ANALYTICS_CONSENT_EVENT = "st-analytics-consent";

export type AnalyticsConsent = "accepted" | "rejected";

export function parseAnalyticsConsent(raw: string | null | undefined): AnalyticsConsent | null {
  if (raw === "accepted" || raw === "rejected") return raw;
  return null;
}

export function readAnalyticsConsent(storage: {
  getItem: (key: string) => string | null;
}): AnalyticsConsent | null {
  return parseAnalyticsConsent(storage.getItem(ANALYTICS_CONSENT_KEY));
}

export function writeAnalyticsConsent(
  storage: { setItem: (key: string, value: string) => void },
  consent: AnalyticsConsent,
): void {
  storage.setItem(ANALYTICS_CONSENT_KEY, consent);
}

export function recordingAllowed(consent: AnalyticsConsent | null): boolean {
  return consent === "accepted";
}

export function posthogPersistence(
  consent: AnalyticsConsent | null,
): "memory" | "localStorage+cookie" {
  return recordingAllowed(consent) ? "localStorage+cookie" : "memory";
}
