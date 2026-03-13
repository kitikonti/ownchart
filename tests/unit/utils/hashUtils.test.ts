/**
 * Tests for hashUtils - DJB2 stable string hashing
 */

import { describe, it, expect } from "vitest";
import { stableHash } from "@/utils/hashUtils";

describe("stableHash", () => {
  it("returns a non-negative integer", () => {
    const result = stableHash("task-123");
    expect(result).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("is deterministic — same input always yields same output", () => {
    const id = "ownchart-unique-id-xyz";
    const results = Array.from({ length: 5 }, () => stableHash(id));
    expect(new Set(results).size).toBe(1);
  });

  it("returns DJB2 seed (5381) for empty string", () => {
    // Loop doesn't execute for empty string, so the seed is returned unchanged
    expect(stableHash("")).toBe(5381);
  });

  it("produces different values for different inputs", () => {
    const h1 = stableHash("task-1");
    const h2 = stableHash("task-2");
    const h3 = stableHash("group-abc");
    expect(h1).not.toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h2).not.toBe(h3);
  });

  it("stays within 31-bit positive integer range", () => {
    const longString = "a".repeat(1000);
    const result = stableHash(longString);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(0x7fffffff);
  });

  it("handles non-BMP characters (emoji) stably", () => {
    // Surrogate pairs are hashed as two UTF-16 units — result must still be
    // a non-negative integer and stable across calls.
    const result1 = stableHash("task-🎯");
    const result2 = stableHash("task-🎯");
    expect(result1).toBe(result2);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result1).toBeLessThanOrEqual(0x7fffffff);
  });
});
