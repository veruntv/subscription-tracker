import { describe, expect, it } from "vitest";

import { CATEGORY_TONES, OVERVIEW_HERO_CAPTION, categoryTone } from "~/lib/domain/labels";
import { CATEGORIES } from "~/lib/domain/types";

describe("category tones", () => {
  it("gives each category a distinct background", () => {
    const backgrounds = CATEGORIES.map((category) => CATEGORY_TONES[category].bg);
    expect(new Set(backgrounds).size).toBe(CATEGORIES.length);
  });

  it("maps remainder to other", () => {
    expect(categoryTone("remainder")).toEqual(CATEGORY_TONES.other);
  });
});

describe("overview hero caption", () => {
  it("says this month is invoices that bill this month and per year includes yearly charges that do not", () => {
    expect(OVERVIEW_HERO_CAPTION).toBe(
      "This month = invoices that bill this month. Per year = the yearly cost of the list, including yearly charges in months they do not bill.",
    );
  });
});
