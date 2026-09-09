import { describe, expect, it } from "vitest";

import {
  POSTHOG_EU_HOST,
  posthogApiHost,
  posthogInitOptions,
  shouldInitPosthog,
} from "~/lib/posthog";

describe("shouldInitPosthog", () => {
  it("skips when the key is missing", () => {
    expect(shouldInitPosthog(undefined)).toBe(false);
    expect(shouldInitPosthog("")).toBe(false);
  });

  it("inits when a project token is present", () => {
    expect(shouldInitPosthog("phc_test")).toBe(true);
  });
});

describe("posthogApiHost", () => {
  it("defaults to the EU ingest host", () => {
    expect(posthogApiHost(undefined)).toBe(POSTHOG_EU_HOST);
  });

  it("uses the configured host", () => {
    expect(posthogApiHost("https://eu.i.posthog.com")).toBe(
      "https://eu.i.posthog.com",
    );
  });
});

describe("posthogInitOptions", () => {
  it("captures pageviews and leaves recordings off until consent", () => {
    const options = posthogInitOptions(undefined);
    expect(options.capture_pageview).toBe(true);
    expect(options.autocapture).toBe(true);
    expect(options.disable_session_recording).toBe(true);
    expect(options.enable_heatmaps).toBe(false);
    expect(options.persistence).toBe("memory");
    expect(options.person_profiles).toBe("identified_only");
    expect(options.api_host).toBe(POSTHOG_EU_HOST);
  });

  it("enables recording and cookies only after accept", () => {
    const options = posthogInitOptions(undefined, "accepted");
    expect(options.disable_session_recording).toBe(false);
    expect(options.enable_heatmaps).toBe(true);
    expect(options.persistence).toBe("localStorage+cookie");
    expect(options.session_recording.maskAllInputs).toBe(true);
  });

  it("keeps reject cookieless", () => {
    const options = posthogInitOptions(undefined, "rejected");
    expect(options.disable_session_recording).toBe(true);
    expect(options.enable_heatmaps).toBe(false);
    expect(options.persistence).toBe("memory");
  });
});
