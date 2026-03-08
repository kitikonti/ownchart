/**
 * Unit tests for renderConstants.ts
 *
 * All functions are pure — no mocks needed.
 */

import { describe, it, expect } from "vitest";
import {
  SUMMARY_BRACKET,
  RENDER_COLORS,
  LABEL_RENDER_CONSTANTS,
  DEPENDENCY_RENDER_CONSTANTS,
  calculateMilestoneSize,
  getScaledCornerRadius,
  generateSummaryBracketPath,
  generateMilestonePath,
  getLabelConfig,
} from "../../../../src/utils/export/renderConstants";

// =============================================================================
// Structural consistency
// =============================================================================

describe("RENDER_COLORS is the single source of truth for shared colors", () => {
  it("LABEL_RENDER_CONSTANTS.externalColor matches RENDER_COLORS.textExternal", () => {
    expect(LABEL_RENDER_CONSTANTS.externalColor).toBe(
      RENDER_COLORS.textExternal
    );
  });

  it("LABEL_RENDER_CONSTANTS.internalColor matches RENDER_COLORS.textInternal", () => {
    expect(LABEL_RENDER_CONSTANTS.internalColor).toBe(
      RENDER_COLORS.textInternal
    );
  });

  it("DEPENDENCY_RENDER_CONSTANTS.strokeColor matches RENDER_COLORS.dependency", () => {
    expect(DEPENDENCY_RENDER_CONSTANTS.strokeColor).toBe(
      RENDER_COLORS.dependency
    );
  });
});

// =============================================================================
// calculateMilestoneSize
// =============================================================================

describe("calculateMilestoneSize", () => {
  it("returns minSize when pixelsPerDay is 0", () => {
    expect(calculateMilestoneSize(0)).toBe(6);
  });

  it("returns minSize when computed size is below minimum", () => {
    // sizeFactor = 0.5, so pixelsPerDay=4 → computed=2 < minSize=6
    expect(calculateMilestoneSize(4)).toBe(6);
  });

  it("scales linearly when within bounds", () => {
    // pixelsPerDay=16 → 16*0.5=8, which is between 6 and 10
    expect(calculateMilestoneSize(16)).toBe(8);
  });

  it("returns maxSize when pixelsPerDay is very large", () => {
    expect(calculateMilestoneSize(1000)).toBe(10);
  });

  it("returns maxSize exactly at the boundary", () => {
    // pixelsPerDay=20 → 20*0.5=10 = maxSize
    expect(calculateMilestoneSize(20)).toBe(10);
  });

  it("returns minSize exactly at the boundary", () => {
    // pixelsPerDay=12 → 12*0.5=6 = minSize
    expect(calculateMilestoneSize(12)).toBe(6);
  });
});

// =============================================================================
// getScaledCornerRadius
// =============================================================================

describe("getScaledCornerRadius", () => {
  it("returns baseCornerRadius at base row height (no scaling)", () => {
    // baseRowHeight=44, baseCornerRadius=8 → scale=1 → Math.round(8)=8 ≥ min(4)
    expect(getScaledCornerRadius(44)).toBe(8);
  });

  it("returns minCornerRadius when row height is very small", () => {
    expect(getScaledCornerRadius(1)).toBe(
      DEPENDENCY_RENDER_CONSTANTS.minCornerRadius
    );
  });

  it("scales up proportionally for larger row heights", () => {
    // rowHeight=88 → scale=2 → Math.round(8*2)=16
    expect(getScaledCornerRadius(88)).toBe(16);
  });

  it("never returns less than minCornerRadius", () => {
    const result = getScaledCornerRadius(0);
    expect(result).toBeGreaterThanOrEqual(
      DEPENDENCY_RENDER_CONSTANTS.minCornerRadius
    );
  });

  it("returns an integer (Math.round applied)", () => {
    const result = getScaledCornerRadius(33);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// =============================================================================
// generateSummaryBracketPath
// =============================================================================

describe("generateSummaryBracketPath", () => {
  it("returns a non-empty string", () => {
    const path = generateSummaryBracketPath(0, 0, 100, 20);
    expect(typeof path).toBe("string");
    expect(path.length).toBeGreaterThan(0);
  });

  it("starts with M and ends with Z", () => {
    const path = generateSummaryBracketPath(0, 0, 100, 20);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("contains no consecutive whitespace (normalised)", () => {
    const path = generateSummaryBracketPath(10, 5, 200, 30);
    expect(path).not.toMatch(/\s{2,}/);
  });

  it("incorporates the x offset", () => {
    const path = generateSummaryBracketPath(50, 0, 100, 20);
    // The first M command should reference x + cornerRadius = 50 + 10 = 60
    expect(path).toContain("M 60");
  });

  it("incorporates the y offset", () => {
    const path = generateSummaryBracketPath(0, 30, 100, 20);
    // The path should reference y=30 coordinates
    expect(path).toContain("30");
  });

  it("produces different paths for different sizes", () => {
    const small = generateSummaryBracketPath(0, 0, 50, 10);
    const large = generateSummaryBracketPath(0, 0, 200, 40);
    expect(small).not.toBe(large);
  });
});

// =============================================================================
// generateMilestonePath
// =============================================================================

describe("generateMilestonePath", () => {
  it("returns a non-empty string", () => {
    const path = generateMilestonePath(50, 20, 8);
    expect(typeof path).toBe("string");
    expect(path.length).toBeGreaterThan(0);
  });

  it("starts with M and ends with Z", () => {
    const path = generateMilestonePath(50, 20, 8);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("contains four L commands (diamond has 4 sides)", () => {
    const path = generateMilestonePath(50, 20, 8);
    const lCount = (path.match(/ L /g) || []).length;
    expect(lCount).toBe(3); // M + 3 L commands + Z = 4 points
  });

  it("produces different paths for different sizes", () => {
    const small = generateMilestonePath(50, 20, 4);
    const large = generateMilestonePath(50, 20, 10);
    expect(small).not.toBe(large);
  });

  it("contains the center coordinates", () => {
    const path = generateMilestonePath(100, 50, 8);
    expect(path).toContain("100");
    expect(path).toContain("50");
  });

  it("contains no consecutive whitespace (normalised)", () => {
    const path = generateMilestonePath(10, 10, 5);
    expect(path).not.toMatch(/\s{2,}/);
  });
});

// =============================================================================
// getLabelConfig
// =============================================================================

describe("getLabelConfig — before position", () => {
  const cfg = getLabelConfig({ taskWidth: 100, taskHeight: 30, labelPosition: "before", fontSize: 12 });

  it("x is negative (label to the left of bar)", () => {
    expect(cfg.x).toBeLessThan(0);
  });

  it("textAnchor is end", () => {
    expect(cfg.textAnchor).toBe("end");
  });

  it("clip is false", () => {
    expect(cfg.clip).toBe(false);
  });

  it("fill is the external color", () => {
    expect(cfg.fill).toBe(RENDER_COLORS.textExternal);
  });
});

describe("getLabelConfig — inside position", () => {
  it("x is positive (label inside bar)", () => {
    const cfg = getLabelConfig({ taskWidth: 100, taskHeight: 30, labelPosition: "inside", fontSize: 12 });
    expect(cfg.x).toBeGreaterThan(0);
  });

  it("textAnchor is start", () => {
    const cfg = getLabelConfig({ taskWidth: 100, taskHeight: 30, labelPosition: "inside", fontSize: 12 });
    expect(cfg.textAnchor).toBe("start");
  });

  it("clip is true", () => {
    const cfg = getLabelConfig({ taskWidth: 100, taskHeight: 30, labelPosition: "inside", fontSize: 12 });
    expect(cfg.clip).toBe(true);
  });

  it("uses internal color when no taskColor given", () => {
    const cfg = getLabelConfig({ taskWidth: 100, taskHeight: 30, labelPosition: "inside", fontSize: 12 });
    expect(cfg.fill).toBe(RENDER_COLORS.textInternal);
  });

  it("calculates contrast color when taskColor is provided", () => {
    // Dark task color → white text; light task color → dark text
    const darkCfg = getLabelConfig({ taskWidth: 100, taskHeight: 30, labelPosition: "inside", fontSize: 12, taskColor: "#000000" });
    const lightCfg = getLabelConfig({ taskWidth: 100, taskHeight: 30, labelPosition: "inside", fontSize: 12, taskColor: "#ffffff" });
    // They should differ from each other and from the plain internal color
    expect(darkCfg.fill).not.toBe(lightCfg.fill);
  });
});

describe("getLabelConfig — after position", () => {
  const cfg = getLabelConfig({ taskWidth: 100, taskHeight: 30, labelPosition: "after", fontSize: 12 });

  it("x is greater than taskWidth (label to the right)", () => {
    expect(cfg.x).toBeGreaterThan(100);
  });

  it("textAnchor is start", () => {
    expect(cfg.textAnchor).toBe("start");
  });

  it("clip is false", () => {
    expect(cfg.clip).toBe(false);
  });

  it("fill is the external color", () => {
    expect(cfg.fill).toBe(RENDER_COLORS.textExternal);
  });
});

describe("getLabelConfig — y calculation", () => {
  it("y is approximately half of taskHeight", () => {
    const cfg = getLabelConfig({ taskWidth: 100, taskHeight: 40, labelPosition: "inside", fontSize: 12 });
    // y = taskHeight/2 + fontSize/3 = 20 + 4 = 24
    expect(cfg.y).toBeCloseTo(24, 5);
  });

  it("y scales with fontSize", () => {
    const small = getLabelConfig({ taskWidth: 100, taskHeight: 40, labelPosition: "inside", fontSize: 10 });
    const large = getLabelConfig({ taskWidth: 100, taskHeight: 40, labelPosition: "inside", fontSize: 20 });
    expect(large.y).toBeGreaterThan(small.y);
  });
});

// =============================================================================
// SUMMARY_BRACKET
// =============================================================================

describe("SUMMARY_BRACKET", () => {
  it("tipWidthFactor is approximately 1/tan(60°)", () => {
    const expected = 1 / Math.tan((60 * Math.PI) / 180);
    expect(SUMMARY_BRACKET.tipWidthFactor).toBeCloseTo(expected, 2);
  });

  it("barThicknessRatio + tipHeightRatio <= 1 (fits within bar height)", () => {
    expect(
      SUMMARY_BRACKET.barThicknessRatio + SUMMARY_BRACKET.tipHeightRatio
    ).toBeLessThanOrEqual(1);
  });

  it("fillOpacity is between 0 and 1", () => {
    expect(SUMMARY_BRACKET.fillOpacity).toBeGreaterThan(0);
    expect(SUMMARY_BRACKET.fillOpacity).toBeLessThanOrEqual(1);
  });
});
