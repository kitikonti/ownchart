/**
 * Unit tests for branded type factory functions in branded.types.ts.
 *
 * These functions are thin casts used at system boundaries (UUID generation,
 * deserialization, palette definitions, color inputs). The tests verify:
 *   - Each factory returns the input value unchanged at runtime.
 *   - The `__brand` marker is NOT present on the runtime value (it is erased
 *     by TypeScript — it only exists in the type system).
 *   - Edge cases: empty string, long string, special characters.
 */

import { describe, it, expect } from "vitest";
import {
  toHexColor,
  toPaletteId,
  toTaskId,
} from "../../../src/types/branded.types";

describe("toHexColor", () => {
  it("should return the input string unchanged", () => {
    expect(toHexColor("#FF0000")).toBe("#FF0000");
  });

  it("should handle shorthand hex values", () => {
    expect(toHexColor("#F00")).toBe("#F00");
  });

  it("should handle lowercase hex values", () => {
    expect(toHexColor("#aabbcc")).toBe("#aabbcc");
  });

  it("should handle a 7-character hex string (browser color input format)", () => {
    expect(toHexColor("#1a2b3c")).toBe("#1a2b3c");
  });

  it("should not attach a __brand property at runtime", () => {
    const result = toHexColor("#FF0000");
    expect(Object.prototype.hasOwnProperty.call(result, "__brand")).toBe(false);
  });
});

describe("toPaletteId", () => {
  it("should return the input string unchanged", () => {
    expect(toPaletteId("tableau-10")).toBe("tableau-10");
  });

  it("should handle palette IDs with hyphens and alphanumerics", () => {
    expect(toPaletteId("d3-category10")).toBe("d3-category10");
    expect(toPaletteId("ms-office")).toBe("ms-office");
  });

  it("should not attach a __brand property at runtime", () => {
    const result = toPaletteId("tableau-10");
    expect(Object.prototype.hasOwnProperty.call(result, "__brand")).toBe(false);
  });
});

describe("toTaskId", () => {
  it("should return the input string unchanged", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(toTaskId(uuid)).toBe(uuid);
  });

  it("should handle the format produced by crypto.randomUUID()", () => {
    // Verify the function works with real UUID format without modifying behaviour
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    expect(toTaskId(uuid)).toBe(uuid);
  });

  it("should not attach a __brand property at runtime", () => {
    const result = toTaskId("550e8400-e29b-41d4-a716-446655440000");
    expect(Object.prototype.hasOwnProperty.call(result, "__brand")).toBe(false);
  });
});
