import { describe, expect, it } from "vitest";

import { convertMinor, type FxTable } from "~/lib/domain/fx";

/** 1 USD = 0.86 EUR, 17 MDL, 150 JPY. Scale 1e8. */
function table(): FxTable {
  const scale = 100_000_000;
  return {
    base: "USD",
    asOf: "2026-08-20",
    scale,
    quotes: {
      USD: scale,
      EUR: 86_000_000,
      MDL: 1_700_000_000,
      JPY: 15_000_000_000,
    },
  };
}

describe("convertMinor", () => {
  it("leaves the amount unchanged when currencies match", () => {
    expect(convertMinor(1199, "EUR", "EUR", table())).toBe(1199);
  });

  it("converts MDL minor units into EUR at the given rate", () => {
    // 1000.00 MDL → 1000 / 17 USD → × 0.86 EUR = 50.588… → 50.59 EUR
    expect(convertMinor(100_000, "MDL", "EUR", table())).toBe(5059);
  });

  it("converts USD into EUR", () => {
    // 123.27 USD × 0.86 = 106.0122 → 106.01 EUR
    expect(convertMinor(12_327, "USD", "EUR", table())).toBe(10601);
  });

  it("adjusts exponents when converting JPY (0 decimals) to USD", () => {
    // 1500 JPY / 150 = 10.00 USD
    expect(convertMinor(1500, "JPY", "USD", table())).toBe(1000);
  });

  it("returns null when a quote is missing", () => {
    expect(convertMinor(100, "GBP", "EUR", table())).toBeNull();
  });
});
