import { afterEach, describe, expect, it } from "vitest";

import { getDailyFxRates, resetFxCacheForTests } from "~/server/fx/rates";

afterEach(() => {
  resetFxCacheForTests();
});

function jsonResponse(body: unknown, ok = true): Response {
  return new Response(JSON.stringify(body), { status: ok ? 200 : 500 });
}

describe("getDailyFxRates", () => {
  it("scales quotes to integers and reuses the same UTC day", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return jsonResponse({
        result: "success",
        time_last_update_utc: "Thu, 20 Aug 2026 00:02:31 +0000",
        base_code: "USD",
        rates: { USD: 1, EUR: 0.86, MDL: 17, GBP: 0.74 },
      });
    };

    const first = await getDailyFxRates(new Date("2026-08-20T10:00:00Z"), fetchImpl);
    const second = await getDailyFxRates(new Date("2026-08-20T23:50:00Z"), fetchImpl);

    expect(calls).toBe(1);
    expect(first).toEqual(second);
    expect(first?.base).toBe("USD");
    expect(first?.asOf).toBe("2026-08-20");
    expect(first?.quotes.EUR).toBe(86_000_000);
    expect(first?.quotes.MDL).toBe(1_700_000_000);
  });

  it("refetches when the UTC date rolls over", async () => {
    let eur = 0.86;
    const fetchImpl: typeof fetch = async () =>
      jsonResponse({
        result: "success",
        time_last_update_utc: "Fri, 21 Aug 2026 00:02:31 +0000",
        base_code: "USD",
        rates: { USD: 1, EUR: eur },
      });

    await getDailyFxRates(new Date("2026-08-20T10:00:00Z"), fetchImpl);
    eur = 0.87;
    const next = await getDailyFxRates(new Date("2026-08-21T00:10:00Z"), fetchImpl);
    expect(next?.quotes.EUR).toBe(87_000_000);
  });

  it("returns yesterday's table when today's fetch fails", async () => {
    let fail = false;
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      if (fail) return jsonResponse({ result: "error" }, false);
      return jsonResponse({
        result: "success",
        time_last_update_utc: "Thu, 20 Aug 2026 00:02:31 +0000",
        base_code: "USD",
        rates: { USD: 1, EUR: 0.86 },
      });
    };

    const good = await getDailyFxRates(new Date("2026-08-20T10:00:00Z"), fetchImpl);
    fail = true;
    const stale = await getDailyFxRates(new Date("2026-08-21T10:00:00Z"), fetchImpl);
    const again = await getDailyFxRates(new Date("2026-08-21T18:00:00Z"), fetchImpl);
    expect(stale).toEqual(good);
    expect(again).toEqual(good);
    expect(calls).toBe(2);
  });

  it("returns null when no rate has ever been fetched", async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse({ result: "error" }, false);
    await expect(getDailyFxRates(new Date("2026-08-20T10:00:00Z"), fetchImpl)).resolves.toBeNull();
  });
});
