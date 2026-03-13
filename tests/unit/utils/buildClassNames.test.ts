/**
 * Unit tests for src/utils/buildClassNames.ts
 */

import { describe, it, expect } from "vitest";
import { buildClassNames } from "@/utils/buildClassNames";

describe("buildClassNames", () => {
  it("should return a single class name unchanged", () => {
    expect(buildClassNames("foo")).toBe("foo");
  });

  it("should join multiple class names with a space", () => {
    expect(buildClassNames("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("should filter out null values", () => {
    expect(buildClassNames("foo", null, "bar")).toBe("foo bar");
  });

  it("should filter out undefined values", () => {
    expect(buildClassNames("foo", undefined, "bar")).toBe("foo bar");
  });

  it("should filter out false values", () => {
    expect(buildClassNames("foo", false, "bar")).toBe("foo bar");
  });

  it("should filter out empty strings", () => {
    expect(buildClassNames("foo", "", "bar")).toBe("foo bar");
  });

  it("should return empty string when all values are falsy", () => {
    expect(buildClassNames(null, undefined, false, "")).toBe("");
  });

  it("should return empty string when called with no arguments", () => {
    expect(buildClassNames()).toBe("");
  });

  it("should flatten nested arrays and join results", () => {
    expect(buildClassNames(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("should filter falsy values inside nested arrays", () => {
    expect(buildClassNames(["foo", null, "bar"], false, "baz")).toBe(
      "foo bar baz"
    );
  });

  it("should support conditional class via && operator pattern", () => {
    const isActive = true;
    const isDisabled = false;
    expect(buildClassNames("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    );
  });

  it("should support ternary operator pattern", () => {
    const variant = "primary";
    expect(
      buildClassNames("btn", variant === "primary" ? "btn-primary" : null)
    ).toBe("btn btn-primary");
  });

  it("should support mixed top-level and array arguments", () => {
    expect(
      buildClassNames("always", ["conditional-a", null, "conditional-b"], undefined)
    ).toBe("always conditional-a conditional-b");
  });
});
