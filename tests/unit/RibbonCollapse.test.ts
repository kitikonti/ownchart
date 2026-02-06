import { describe, it, expect } from "vitest";
import { shouldShowLabel } from "../../src/components/Ribbon/RibbonCollapseContext";
import type { CollapseLevel } from "../../src/components/Ribbon/RibbonCollapseContext";

describe("shouldShowLabel", () => {
  it("level 0 → all labels visible", () => {
    expect(shouldShowLabel(1, 0)).toBe(true);
    expect(shouldShowLabel(2, 0)).toBe(true);
    expect(shouldShowLabel(5, 0)).toBe(true);
  });

  it("level 1 → priority 1 hidden, priority 2+ visible", () => {
    expect(shouldShowLabel(1, 1)).toBe(false);
    expect(shouldShowLabel(2, 1)).toBe(true);
    expect(shouldShowLabel(3, 1)).toBe(true);
    expect(shouldShowLabel(5, 1)).toBe(true);
  });

  it("level 2 → priority 1-2 hidden, priority 3+ visible", () => {
    expect(shouldShowLabel(1, 2)).toBe(false);
    expect(shouldShowLabel(2, 2)).toBe(false);
    expect(shouldShowLabel(3, 2)).toBe(true);
    expect(shouldShowLabel(5, 2)).toBe(true);
  });

  it("level 5 → all priorities hidden", () => {
    expect(shouldShowLabel(1, 5)).toBe(false);
    expect(shouldShowLabel(2, 5)).toBe(false);
    expect(shouldShowLabel(3, 5)).toBe(false);
    expect(shouldShowLabel(4, 5)).toBe(false);
    expect(shouldShowLabel(5, 5)).toBe(false);
  });

  it("undefined priority → always visible regardless of level", () => {
    const levels: CollapseLevel[] = [0, 1, 2, 3, 4, 5];
    for (const level of levels) {
      expect(shouldShowLabel(undefined, level)).toBe(true);
    }
  });
});
