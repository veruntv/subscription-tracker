import { describe, expect, it } from "vitest";

import { resolveBrand, suggestBrands } from "~/lib/domain/brands";

describe("suggestBrands", () => {
  it("returns nothing for an empty query", () => {
    expect(suggestBrands("")).toEqual([]);
    expect(suggestBrands("  ")).toEqual([]);
  });

  it("ranks prefix matches first", () => {
    const names = suggestBrands("net").map((brand) => brand.name);
    expect(names[0]).toBe("Netflix");
    expect(names).toContain("Netlify");
  });

  it("finds a close misspelling", () => {
    expect(suggestBrands("netlix").map((brand) => brand.name)).toContain("Netflix");
    expect(suggestBrands("spotfy").map((brand) => brand.name)).toContain("Spotify");
  });

  it("matches aliases", () => {
    expect(suggestBrands("office 365").map((brand) => brand.name)).toContain("Microsoft 365");
    expect(suggestBrands("chatgpt").map((brand) => brand.name)).toContain("ChatGPT");
    expect(suggestBrands("prime video").map((brand) => brand.name)).toContain("Prime Video");
  });
});

describe("resolveBrand", () => {
  it("resolves an exact name ignoring case", () => {
    expect(resolveBrand("netflix")?.name).toBe("Netflix");
  });

  it("resolves a longer plan name", () => {
    expect(resolveBrand("Netflix Premium")?.name).toBe("Netflix");
  });

  it("resolves a small typo", () => {
    expect(resolveBrand("Neflix")?.name).toBe("Netflix");
  });

  it("does not invent a brand for an unknown gym", () => {
    expect(resolveBrand("My neighborhood gym")).toBeNull();
  });

  it("does not treat a short alias as a prefix of another name", () => {
    expect(resolveBrand("Prime gym")).toBeNull();
  });
});
