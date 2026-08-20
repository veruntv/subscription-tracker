import { describe, expect, it } from "vitest";

import { applyStatus, buildSubscription, rollNextChargeIfPast } from "~/lib/domain/subscription";
import type { Subscription, SubscriptionInput } from "~/lib/domain/types";

const input: SubscriptionInput = {
  name: "Netflix",
  amount: 1399,
  currency: "EUR",
  cadence: "monthly",
  intervalCount: 1,
  startedAt: { year: 2026, month: 1, day: 20 },
  category: "streaming",
  cancelUrl: null,
  notifyDaysBefore: 3,
};

const monthly: Subscription = {
  id: "sub-1",
  name: "Netflix",
  amount: 1399,
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

describe("rollNextChargeIfPast", () => {
  it("does not roll on the charge day, even after a reminder would have sent", () => {
    const reminderDay = { year: 2026, month: 8, day: 17 };
    const chargeDay = { year: 2026, month: 8, day: 20 };
    expect(rollNextChargeIfPast(monthly, reminderDay).nextChargeAt).toEqual(chargeDay);
    expect(rollNextChargeIfPast(monthly, chargeDay).nextChargeAt).toEqual(chargeDay);
  });

  it("rolls to the next occurrence the day after the charge", () => {
    const rolled = rollNextChargeIfPast(monthly, { year: 2026, month: 8, day: 21 });
    expect(rolled.nextChargeAt).toEqual({ year: 2026, month: 9, day: 20 });
  });

  it("leaves paused rows alone", () => {
    const paused = { ...monthly, status: "paused" as const };
    expect(rollNextChargeIfPast(paused, { year: 2026, month: 8, day: 21 }).nextChargeAt).toEqual(
      monthly.nextChargeAt,
    );
  });
});

describe("applyStatus", () => {
  it("rebuilds nextChargeAt from today when resuming a past-due row", () => {
    const paused = {
      ...monthly,
      status: "paused" as const,
      nextChargeAt: { year: 2026, month: 7, day: 20 },
    };
    const resumed = applyStatus(paused, "active", { year: 2026, month: 8, day: 21 });
    expect(resumed.status).toBe("active");
    expect(resumed.nextChargeAt).toEqual({ year: 2026, month: 9, day: 20 });
  });
});

describe("buildSubscription", () => {
  it("computes nextChargeAt from the given local today, not UTC", () => {
    const built = buildSubscription(input, "sub-1", "2026-01-01T00:00:00.000Z", {
      year: 2026,
      month: 8,
      day: 21,
    });
    expect(built.nextChargeAt).toEqual({ year: 2026, month: 9, day: 20 });
  });
});
