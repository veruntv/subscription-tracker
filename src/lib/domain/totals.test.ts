import { describe, expect, it } from "vitest";

import { categoryMix, type CategoryTotals } from "~/lib/domain/totals";

function row(
  category: CategoryTotals["category"],
  monthly: number,
  currency = "EUR",
): CategoryTotals {
  return { category, currency, monthly, yearly: monthly * 12 };
}

describe("categoryMix", () => {
  it("shows four categories without folding", () => {
    const mix = categoryMix(
      [row("fitness", 2900), row("streaming", 1800), row("hosting", 1500), row("software", 800)],
      "EUR",
    );
    expect(mix.map((s) => s.category)).toEqual(["fitness", "streaming", "hosting", "software"]);
  });

  it("folds the tail into remainder past four categories", () => {
    const mix = categoryMix(
      [
        row("fitness", 2900),
        row("streaming", 1800),
        row("hosting", 1500),
        row("software", 800),
        row("news", 300),
      ],
      "EUR",
    );
    expect(mix).toHaveLength(4);
    expect(mix[3]).toMatchObject({ category: "remainder", monthly: 1100 });
  });

  it("ignores other currencies", () => {
    const mix = categoryMix([row("fitness", 2900), row("software", 992, "USD")], "EUR");
    expect(mix).toHaveLength(1);
    expect(mix[0]?.category).toBe("fitness");
  });
});
