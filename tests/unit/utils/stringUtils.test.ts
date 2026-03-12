/**
 * Unit tests for src/utils/stringUtils.ts
 */

import { describe, it, expect } from "vitest";
import { pluralize } from "../../../src/utils/stringUtils";

describe("pluralize", () => {
  it("should return singular form when count is 1", () => {
    expect(pluralize(1, "task")).toBe("1 task");
  });

  it("should return plural form when count is 0", () => {
    expect(pluralize(0, "task")).toBe("0 tasks");
  });

  it("should return plural form when count is 2", () => {
    expect(pluralize(2, "task")).toBe("2 tasks");
  });

  it("should return plural form for large counts", () => {
    expect(pluralize(100, "item")).toBe("100 items");
  });

  it("should work with multi-word base words", () => {
    expect(pluralize(3, "hidden task")).toBe("3 hidden tasks");
  });
});
