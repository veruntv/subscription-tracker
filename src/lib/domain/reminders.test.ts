import { describe, expect, it } from "vitest";

import { isDueThisHour, isUniqueViolation, reminderCivilDate } from "~/lib/domain/reminders";
import type { Subscription } from "~/lib/domain/types";

const base: Subscription = {
  id: "sub-1",
  name: "Netflix",
  amount: 1299,
  currency: "EUR",
  cadence: "monthly",
  intervalCount: 1,
  anchorDay: 20,
  startedAt: { year: 2026, month: 1, day: 20 },
  nextChargeAt: { year: 2026, month: 8, day: 20 },
  status: "active",
  notifyDaysBefore: 3,
  category: "streaming",
  cancelUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("reminderCivilDate", () => {
  it("is N days before the charge", () => {
    expect(reminderCivilDate(base)).toEqual({ year: 2026, month: 8, day: 17 });
  });
});

describe("isDueThisHour", () => {
  it("fires at 09:00 Europe/Chisinau on the reminder day", () => {
    // 06:00 UTC is 09:00 in Chisinau (EEST, UTC+3) in August
    const now = new Date("2026-08-17T06:00:00.000Z");
    expect(
      isDueThisHour({
        subscription: base,
        settings: { timezone: "Europe/Chisinau", defaultCurrency: "EUR" },
        now,
      }),
    ).toBe(true);
  });

  it("does not fire before 09:00 local", () => {
    const now = new Date("2026-08-17T05:00:00.000Z");
    expect(
      isDueThisHour({
        subscription: base,
        settings: { timezone: "Europe/Chisinau", defaultCurrency: "EUR" },
        now,
      }),
    ).toBe(false);
  });

  it("still fires later the same local morning if the 09:00 tick was missed", () => {
    // 07:00 UTC is 10:00 in Chisinau (EEST, UTC+3) in August
    const now = new Date("2026-08-17T07:00:00.000Z");
    expect(
      isDueThisHour({
        subscription: base,
        settings: { timezone: "Europe/Chisinau", defaultCurrency: "EUR" },
        now,
      }),
    ).toBe(true);
  });

  it("does not fire for paused subscriptions", () => {
    const now = new Date("2026-08-17T06:00:00.000Z");
    expect(
      isDueThisHour({
        subscription: { ...base, status: "paused" },
        settings: { timezone: "Europe/Chisinau", defaultCurrency: "EUR" },
        now,
      }),
    ).toBe(false);
  });

  it("does not fire the next local day", () => {
    const now = new Date("2026-08-18T06:00:00.000Z");
    expect(
      isDueThisHour({
        subscription: base,
        settings: { timezone: "Europe/Chisinau", defaultCurrency: "EUR" },
        now,
      }),
    ).toBe(false);
  });
});

describe("isUniqueViolation", () => {
  it("is true only for Postgres unique_violation", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
    expect(isUniqueViolation(new Error("connection lost"))).toBe(false);
  });
});

