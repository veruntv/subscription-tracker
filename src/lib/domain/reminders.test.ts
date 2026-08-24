import { describe, expect, it } from "vitest";

import {
  deliverReminderBatch,
  groupDueReminders,
  isDueThisHour,
  isUniqueViolation,
  reminderCivilDate,
  reminderEmailSubject,
  reminderEmailText,
  reminderSentCopy,
} from "~/lib/domain/reminders";
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

const claude: Subscription = {
  ...base,
  id: "sub-claude",
  name: "Claude",
  amount: 2000,
  currency: "USD",
  category: "software",
};

const gym: Subscription = {
  ...base,
  id: "sub-gym",
  name: "Gym",
  amount: 4000,
  currency: "EUR",
  category: "fitness",
  cancelUrl: "https://gym.example/cancel",
};

describe("groupDueReminders", () => {
  it("batches the same user, charge date, and notify window", () => {
    const groups = groupDueReminders([
      { userId: "u1", email: "a@example.com", subscription: gym },
      { userId: "u1", email: "a@example.com", subscription: claude },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.subscriptions.map((row) => row.name)).toEqual(["Claude", "Gym"]);
  });

  it("keeps different notifyDaysBefore in separate emails", () => {
    const groups = groupDueReminders([
      { userId: "u1", email: "a@example.com", subscription: claude },
      {
        userId: "u1",
        email: "a@example.com",
        subscription: { ...gym, notifyDaysBefore: 1 },
      },
    ]);
    expect(groups).toHaveLength(2);
  });

  it("keeps different charge dates in separate emails", () => {
    const groups = groupDueReminders([
      { userId: "u1", email: "a@example.com", subscription: claude },
      {
        userId: "u1",
        email: "a@example.com",
        subscription: { ...gym, nextChargeAt: { year: 2026, month: 8, day: 21 } },
      },
    ]);
    expect(groups).toHaveLength(2);
  });

  it("keeps different users in separate emails", () => {
    const groups = groupDueReminders([
      { userId: "u1", email: "a@example.com", subscription: claude },
      { userId: "u2", email: "b@example.com", subscription: gym },
    ]);
    expect(groups).toHaveLength(2);
  });
});

describe("reminder email copy", () => {
  it("keeps a single-name subject", () => {
    expect(reminderEmailSubject([claude])).toBe("Claude charges in 3 day(s)");
  });

  it("uses a count subject for two or more", () => {
    expect(reminderEmailSubject([claude, gym])).toBe("2 subscriptions charge in 3 day(s)");
  });

  it("lists each amount, date, and cancel URL", () => {
    const text = reminderEmailText([claude, gym]);
    expect(text).toContain("Claude · 20.00 USD on 2026-08-20.");
    expect(text).not.toContain("Claude · 20.00 USD on 2026-08-20.\nManage");
    expect(text).toContain("Gym · 40.00 EUR on 2026-08-20.");
    expect(text).toContain("Manage / cancel: https://gym.example/cancel");
  });
});

describe("deliverReminderBatch", () => {
  it("sends one email for newly claimed rows and keeps the claims", async () => {
    const claimed: string[] = [];
    const released: string[] = [];
    const sent: { subject: string; text: string }[] = [];

    const result = await deliverReminderBatch({
      items: [claude, gym],
      to: "a@example.com",
      claim: async (key) => {
        claimed.push(key.subscriptionId);
        return "inserted";
      },
      release: async (keys) => {
        released.push(...keys.map((key) => key.subscriptionId));
      },
      send: async (message) => {
        sent.push(message);
        return true;
      },
    });

    expect(result).toEqual({ sent: 2, skipped: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.subject).toBe("2 subscriptions charge in 3 day(s)");
    expect(sent[0]?.text).toContain("Claude");
    expect(sent[0]?.text).toContain("Gym");
    expect(released).toEqual([]);
  });

  it("omits already-claimed rows from the email", async () => {
    const sent: { subject: string; text: string }[] = [];
    const result = await deliverReminderBatch({
      items: [claude, gym],
      to: "a@example.com",
      claim: async (key) => (key.subscriptionId === claude.id ? "duplicate" : "inserted"),
      release: async () => {
        throw new Error("should not release");
      },
      send: async (message) => {
        sent.push(message);
        return true;
      },
    });

    expect(result).toEqual({ sent: 1, skipped: 1 });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.subject).toBe("Gym charges in 3 day(s)");
    expect(sent[0]?.text).toContain("Gym");
    expect(sent[0]?.text).not.toContain("Claude");
  });

  it("releases claims when Resend rejects so the next hour can retry", async () => {
    const released: string[] = [];
    const result = await deliverReminderBatch({
      items: [claude, gym],
      to: "a@example.com",
      claim: async () => "inserted",
      release: async (keys) => {
        released.push(...keys.map((key) => key.subscriptionId));
      },
      send: async () => false,
    });

    expect(result).toEqual({ sent: 0, skipped: 2 });
    expect(released.sort()).toEqual([claude.id, gym.id].sort());
  });

  it("releases claims when Resend throws", async () => {
    const released: string[] = [];
    const result = await deliverReminderBatch({
      items: [claude],
      to: "a@example.com",
      claim: async () => "inserted",
      release: async (keys) => {
        released.push(...keys.map((key) => key.subscriptionId));
      },
      send: async () => {
        throw new Error("network");
      },
    });

    expect(result).toEqual({ sent: 0, skipped: 1 });
    expect(released).toEqual([claude.id]);
  });

  it("does not send when every row was already claimed", async () => {
    let sends = 0;
    const result = await deliverReminderBatch({
      items: [claude, gym],
      to: "a@example.com",
      claim: async () => "duplicate",
      release: async () => {
        throw new Error("should not release");
      },
      send: async () => {
        sends += 1;
        return true;
      },
    });

    expect(result).toEqual({ sent: 0, skipped: 2 });
    expect(sends).toBe(0);
  });
});

describe("reminderSentCopy", () => {
  it("says no reminder yet when nothing was sent", () => {
    expect(reminderSentCopy(null, "Europe/Chisinau")).toBe("No reminder yet");
  });

  it("shows the local send date", () => {
    expect(reminderSentCopy("2026-08-17T06:00:00.000Z", "Europe/Chisinau")).toBe(
      "Reminded 17 Aug 2026",
    );
  });
});

