import { describe, expect, it } from "vitest";

import { CATEGORY_TONES, categoryTone } from "~/lib/domain/labels";
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
