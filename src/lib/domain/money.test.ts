import { describe, expect, it } from "vitest";

import {
  formatMinor,
  monthlyMinor,
  parseAmountInput,
  yearlyMinor,
} from "~/lib/domain/money";

describe("yearlyMinor", () => {
  it("uses weekly ×52, monthly ×12, quarterly ×4, yearly ×1", () => {
    expect(yearlyMinor(999, "weekly", 1)).toBe(51948);
    expect(yearlyMinor(1299, "monthly", 1)).toBe(15588);
    expect(yearlyMinor(2500, "quarterly", 1)).toBe(10000);
    expect(yearlyMinor(1400, "yearly", 1)).toBe(1400);
  });

  it("divides by intervalCount", () => {
    expect(yearlyMinor(2000, "monthly", 2)).toBe(12000);
  });
});

describe("monthlyMinor", () => {
  it("is yearly / 12", () => {
    expect(monthlyMinor(1299, "monthly", 1)).toBe(1299);
    expect(monthlyMinor(1400, "yearly", 1)).toBe(117);
  });
});

describe("parseAmountInput", () => {
  it("parses euro cents", () => {
    expect(parseAmountInput("12.99", "EUR")).toBe(1299);
    expect(parseAmountInput("12,99", "EUR")).toBe(1299);
  });

  it("rejects extra fraction digits and zero", () => {
    expect(parseAmountInput("12.999", "EUR")).toBeNull();
    expect(parseAmountInput("0", "EUR")).toBeNull();
  });
});

describe("formatMinor", () => {
  it("formats with the currency code", () => {
    expect(formatMinor(1299, "EUR")).toBe("12.99 EUR");
    expect(formatMinor(1500, "JPY")).toBe("1500 JPY");
  });
});
