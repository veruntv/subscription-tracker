import { describe, expect, it } from "vitest";

import { civilToIso, todayInZone } from "~/lib/domain/civil-date";

describe("todayInZone", () => {
  it("is the next local date after midnight in Europe/Chisinau while UTC is still the previous day", () => {
    // 21:30 UTC on 20 Aug is 00:30 EEST (UTC+3) on 21 Aug
    const now = new Date("2026-08-20T21:30:00.000Z");
    expect(civilToIso(todayInZone("Europe/Chisinau", now))).toBe("2026-08-21");
    expect(civilToIso(todayInZone("UTC", now))).toBe("2026-08-20");
  });

  it("stays on the same winter morning after Chisinau falls back", () => {
    // Last Sunday of October 2026 is the 25th. 00:30 UTC is 02:30 EET (UTC+2).
    const now = new Date("2026-10-25T00:30:00.000Z");
    expect(civilToIso(todayInZone("Europe/Chisinau", now))).toBe("2026-10-25");
  });
});
