import { describe, expect, it } from "vitest";

import { cronAuthorized } from "~/server/reminders/auth";

describe("cronAuthorized", () => {
  it("rejects a missing secret", () => {
    expect(cronAuthorized(undefined, "Bearer anything")).toBe(false);
    expect(cronAuthorized("", "Bearer anything")).toBe(false);
  });

  it("rejects a missing or wrong bearer token", () => {
    expect(cronAuthorized("s3cret", null)).toBe(false);
    expect(cronAuthorized("s3cret", "Bearer other")).toBe(false);
  });

  it("accepts the matching bearer token", () => {
    expect(cronAuthorized("s3cret", "Bearer s3cret")).toBe(true);
  });
});
