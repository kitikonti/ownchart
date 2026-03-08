/**
 * Unit tests for version constants.
 * Guards against accidental typos when bumping FILE_VERSION or SCHEMA_VERSION.
 */

import { describe, it, expect } from "vitest";
import { FILE_VERSION, SCHEMA_VERSION } from "../../../src/config/version";

describe("FILE_VERSION", () => {
  it("should be a valid semver string (MAJOR.MINOR.PATCH)", () => {
    expect(FILE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should be a non-empty string", () => {
    expect(typeof FILE_VERSION).toBe("string");
    expect(FILE_VERSION.length).toBeGreaterThan(0);
  });
});

describe("SCHEMA_VERSION", () => {
  it("should be a positive integer", () => {
    expect(typeof SCHEMA_VERSION).toBe("number");
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
  });
});
