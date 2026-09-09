import { describe, expect, it } from "vitest";

import {
  ANALYTICS_CONSENT_KEY,
  parseAnalyticsConsent,
  posthogPersistence,
  readAnalyticsConsent,
  recordingAllowed,
  writeAnalyticsConsent,
} from "~/lib/analytics-consent";

describe("parseAnalyticsConsent", () => {
  it("accepts stored choices only", () => {
    expect(parseAnalyticsConsent("accepted")).toBe("accepted");
    expect(parseAnalyticsConsent("rejected")).toBe("rejected");
    expect(parseAnalyticsConsent(null)).toBeNull();
    expect(parseAnalyticsConsent("maybe")).toBeNull();
  });
});

describe("read/writeAnalyticsConsent", () => {
  it("round-trips through storage", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    expect(readAnalyticsConsent(storage)).toBeNull();
    writeAnalyticsConsent(storage, "rejected");
    expect(store.get(ANALYTICS_CONSENT_KEY)).toBe("rejected");
    expect(readAnalyticsConsent(storage)).toBe("rejected");
  });
});

describe("recordingAllowed", () => {
  it("is only true after accept", () => {
    expect(recordingAllowed(null)).toBe(false);
    expect(recordingAllowed("rejected")).toBe(false);
    expect(recordingAllowed("accepted")).toBe(true);
  });
});

describe("posthogPersistence", () => {
  it("keeps PostHog cookieless until accept", () => {
    expect(posthogPersistence(null)).toBe("memory");
    expect(posthogPersistence("rejected")).toBe("memory");
    expect(posthogPersistence("accepted")).toBe("localStorage+cookie");
  });
});
