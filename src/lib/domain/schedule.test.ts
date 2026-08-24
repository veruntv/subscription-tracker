import { describe, expect, it } from "vitest";

import { civilToIso } from "~/lib/domain/civil-date";
import { nextChargeOnOrAfter, occurrencesInMonth, occurrencesThrough } from "~/lib/domain/schedule";

describe("nextChargeOnOrAfter", () => {
  it("keeps a 31st anchor through February", () => {
    const startedAt = { year: 2026, month: 1, day: 31 };
    const feb = nextChargeOnOrAfter({
      startedAt,
      cadence: "monthly",
      intervalCount: 1,
      anchorDay: 31,
      from: { year: 2026, month: 2, day: 1 },
    });
    const mar = nextChargeOnOrAfter({
      startedAt,
      cadence: "monthly",
      intervalCount: 1,
      anchorDay: 31,
      from: { year: 2026, month: 3, day: 1 },
    });
    expect(civilToIso(feb)).toBe("2026-02-28");
    expect(civilToIso(mar)).toBe("2026-03-31");
  });

  it("returns the start date when it is still in the future", () => {
    const startedAt = { year: 2026, month: 6, day: 15 };
    const next = nextChargeOnOrAfter({
      startedAt,
      cadence: "monthly",
      intervalCount: 1,
      anchorDay: 15,
      from: { year: 2026, month: 1, day: 1 },
    });
    expect(civilToIso(next)).toBe("2026-06-15");
  });

  it("walks weekly by intervalCount weeks", () => {
    const startedAt = { year: 2026, month: 1, day: 5 }; // Monday
    const next = nextChargeOnOrAfter({
      startedAt,
      cadence: "weekly",
      intervalCount: 2,
      anchorDay: 1,
      from: { year: 2026, month: 1, day: 6 },
    });
    expect(civilToIso(next)).toBe("2026-01-19");
  });
});

describe("occurrencesInMonth", () => {
  it("lists the February collapse for a 31st subscription", () => {
    const dates = occurrencesInMonth(
      {
        startedAt: { year: 2026, month: 1, day: 31 },
        cadence: "monthly",
        intervalCount: 1,
        anchorDay: 31,
        status: "active",
      },
      2026,
      2,
    );
    expect(dates.map(civilToIso)).toEqual(["2026-02-28"]);
  });

  it("skips paused rows", () => {
    const dates = occurrencesInMonth(
      {
        startedAt: { year: 2026, month: 1, day: 1 },
        cadence: "monthly",
        intervalCount: 1,
        anchorDay: 1,
        status: "paused",
      },
      2026,
      2,
    );
    expect(dates).toEqual([]);
  });
});

describe("occurrencesThrough", () => {
  it("walks weekly dates through a 30-day window", () => {
    const dates = occurrencesThrough(
      {
        startedAt: { year: 2026, month: 8, day: 24 },
        cadence: "weekly",
        intervalCount: 1,
        anchorDay: 1,
        status: "active",
      },
      { year: 2026, month: 8, day: 24 },
      { year: 2026, month: 9, day: 23 },
    );
    expect(dates.map(civilToIso)).toEqual([
      "2026-08-24",
      "2026-08-31",
      "2026-09-07",
      "2026-09-14",
      "2026-09-21",
    ]);
  });
});
