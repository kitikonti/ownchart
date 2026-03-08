/**
 * Unit tests for renderConstants.ts
 *
 * These functions are pure utilities used in the critical SVG/PDF export path.
 * All branches and clamping behaviour are tested.
 */

import { describe, it, expect } from "vitest";
import {
  calculateMilestoneSize,
  MILESTONE_RENDER_CONSTANTS,
  getScaledCornerRadius,
  MIN_CORNER_RADIUS,
  DEPENDENCY_RENDER_CONSTANTS,
  generateSummaryBracketPath,
  generateMilestonePath,
  getLabelConfig,
  LABEL_RENDER_CONSTANTS,
  RENDER_COLORS,
  computeBracketGeometry,
} from "../../../../src/utils/export/renderConstants";
import type { BracketGeometry } from "../../../../src/utils/export/renderConstants";

// ---------------------------------------------------------------------------
// calculateMilestoneSize
// ---------------------------------------------------------------------------

describe("calculateMilestoneSize", () => {
  it("returns minSize when pixelsPerDay is very small", () => {
    expect(calculateMilestoneSize(0)).toBe(MILESTONE_RENDER_CONSTANTS.minSize);
    expect(calculateMilestoneSize(1)).toBe(MILESTONE_RENDER_CONSTANTS.minSize);
  });

  it("returns maxSize when pixelsPerDay is very large", () => {
    expect(calculateMilestoneSize(1000)).toBe(
      MILESTONE_RENDER_CONSTANTS.maxSize
    );
  });

  it("returns a scaled value within bounds for a mid-range pixelsPerDay", () => {
    // pixelsPerDay=16, sizeFactor=0.5 → raw=8, clamped to [6,10] = 8
    const result = calculateMilestoneSize(16);
    expect(result).toBeGreaterThanOrEqual(MILESTONE_RENDER_CONSTANTS.minSize);
    expect(result).toBeLessThanOrEqual(MILESTONE_RENDER_CONSTANTS.maxSize);
    expect(result).toBe(8);
  });

  it("clamps at minSize when scaled result is below minimum", () => {
    // pixelsPerDay=2, sizeFactor=0.5 → raw=1, clamped to 6
    expect(calculateMilestoneSize(2)).toBe(MILESTONE_RENDER_CONSTANTS.minSize);
  });

  it("clamps at maxSize when scaled result exceeds maximum", () => {
    // pixelsPerDay=100, sizeFactor=0.5 → raw=50, clamped to 10
    expect(calculateMilestoneSize(100)).toBe(MILESTONE_RENDER_CONSTANTS.maxSize);
  });
});

// ---------------------------------------------------------------------------
// getScaledCornerRadius
// ---------------------------------------------------------------------------

describe("getScaledCornerRadius", () => {
  it("returns the base corner radius at base row height", () => {
    const baseHeight = DEPENDENCY_RENDER_CONSTANTS.baseRowHeight; // 44
    const result = getScaledCornerRadius(baseHeight);
    // scale=1 → Math.round(8*1) = 8, max(4, 8) = 8
    expect(result).toBe(DEPENDENCY_RENDER_CONSTANTS.baseCornerRadius);
  });

  it("enforces MIN_CORNER_RADIUS at very small row heights", () => {
    // rowHeight=1, scale≈0.023, Math.round(8*0.023)=0, max(4,0)=4
    expect(getScaledCornerRadius(1)).toBe(MIN_CORNER_RADIUS);
  });

  it("scales up proportionally at double the base row height", () => {
    const doubleHeight = DEPENDENCY_RENDER_CONSTANTS.baseRowHeight * 2;
    const result = getScaledCornerRadius(doubleHeight);
    // scale=2, Math.round(8*2)=16, max(4,16)=16
    expect(result).toBe(DEPENDENCY_RENDER_CONSTANTS.baseCornerRadius * 2);
  });

  it("returns at least MIN_CORNER_RADIUS for rowHeight=0", () => {
    expect(getScaledCornerRadius(0)).toBe(MIN_CORNER_RADIUS);
  });
});

// ---------------------------------------------------------------------------
// computeBracketGeometry (@internal)
// ---------------------------------------------------------------------------

describe("computeBracketGeometry", () => {
  it("returns a BracketGeometry with the expected fields", () => {
    const geo: BracketGeometry = computeBracketGeometry(100, 20);
    expect(typeof geo.tipHeight).toBe("number");
    expect(typeof geo.barThickness).toBe("number");
    expect(typeof geo.tipWidth).toBe("number");
    expect(typeof geo.cornerRadius).toBe("number");
    expect(typeof geo.innerRadius).toBe("number");
  });

  it("clamps tipWidth so two tips never overlap on very narrow tasks", () => {
    // width=4 → raw tipWidth could exceed width/2 without clamping
    const geo = computeBracketGeometry(4, 20);
    expect(geo.tipWidth).toBeLessThanOrEqual(4 / 2);
  });

  it("clamps cornerRadius to barThickness/2 on short rows", () => {
    // height=10 → barThickness=3, SUMMARY_BRACKET.cornerRadius=10 → clamped to 1.5
    const geo = computeBracketGeometry(200, 10);
    expect(geo.cornerRadius).toBeLessThanOrEqual(geo.barThickness / 2);
  });

  it("clamps innerRadius to barThickness/2 on short rows", () => {
    const geo = computeBracketGeometry(200, 10);
    expect(geo.innerRadius).toBeLessThanOrEqual(geo.barThickness / 2);
  });

  it("returns proportional values for normal-size inputs", () => {
    const geo = computeBracketGeometry(200, 40);
    // barThicknessRatio=0.3 → barThickness=12
    expect(geo.barThickness).toBeCloseTo(12);
    // tipHeightRatio=0.5 → tipHeight=20
    expect(geo.tipHeight).toBeCloseTo(20);
  });
});

// ---------------------------------------------------------------------------
// generateSummaryBracketPath
// ---------------------------------------------------------------------------

describe("generateSummaryBracketPath", () => {
  it("returns a non-empty path string", () => {
    const path = generateSummaryBracketPath(0, 0, 100, 20);
    expect(typeof path).toBe("string");
    expect(path.length).toBeGreaterThan(0);
  });

  it("starts with M (move-to) and ends with Z (close)", () => {
    const path = generateSummaryBracketPath(0, 0, 100, 20);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("contains expected SVG commands (L, Q)", () => {
    const path = generateSummaryBracketPath(0, 0, 100, 20);
    expect(path).toMatch(/\bL\b/);
    expect(path).toMatch(/\bQ\b/);
  });

  it("incorporates the x/y offset into the path coordinates", () => {
    const path = generateSummaryBracketPath(50, 100, 200, 30);
    // The path should reference the offset x=50 and y=100
    expect(path).toContain("50");
    expect(path).toContain("100");
  });

  it("produces no consecutive whitespace (normalized)", () => {
    const path = generateSummaryBracketPath(0, 0, 80, 16);
    expect(path).not.toMatch(/\s{2,}/);
  });

  it("returns empty string for zero width", () => {
    expect(generateSummaryBracketPath(0, 0, 0, 20)).toBe("");
  });

  it("returns empty string for zero height", () => {
    expect(generateSummaryBracketPath(0, 0, 100, 0)).toBe("");
  });

  it("returns empty string for negative width", () => {
    expect(generateSummaryBracketPath(0, 0, -10, 20)).toBe("");
  });

  it("returns empty string for negative height", () => {
    expect(generateSummaryBracketPath(0, 0, 100, -5)).toBe("");
  });

  it("produces a valid (non-empty) path for very short rows where cornerRadius > barThickness", () => {
    // height=10 → barThickness=3, cornerRadius would be 10 without clamping
    // → invalid arc; after clamping the path should still be a valid string
    const path = generateSummaryBracketPath(0, 0, 200, 10);
    expect(path.length).toBeGreaterThan(0);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("produces a valid path for very narrow tasks where tips would otherwise overlap", () => {
    // width=4 → raw tipWidth could exceed width/2 without clamping
    const path = generateSummaryBracketPath(0, 0, 4, 20);
    expect(path.length).toBeGreaterThan(0);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generateMilestonePath
// ---------------------------------------------------------------------------

describe("generateMilestonePath", () => {
  it("returns a non-empty path string", () => {
    const path = generateMilestonePath(50, 50, 8);
    expect(typeof path).toBe("string");
    expect(path.length).toBeGreaterThan(0);
  });

  it("starts with M and ends with Z", () => {
    const path = generateMilestonePath(0, 0, 5);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("contains four line-to commands for a diamond shape", () => {
    const path = generateMilestonePath(0, 0, 5);
    const lineMatches = path.match(/\bL\b/g);
    expect(lineMatches).toHaveLength(3); // M + 3L + Z = 4 points
  });

  it("produces normalized output with no extra whitespace", () => {
    const path = generateMilestonePath(10, 20, 6);
    expect(path).not.toMatch(/\s{2,}/);
  });

  it("returns empty string for zero size", () => {
    expect(generateMilestonePath(50, 50, 0)).toBe("");
  });

  it("returns empty string for negative size", () => {
    expect(generateMilestonePath(50, 50, -3)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// getLabelConfig
// ---------------------------------------------------------------------------

describe("getLabelConfig", () => {
  const taskWidth = 100;
  const taskHeight = 30;
  const fontSize = 12;
  const padding = LABEL_RENDER_CONSTANTS.padding;
  const yOffset = fontSize * LABEL_RENDER_CONSTANTS.verticalOffsetFactor;
  const expectedY = taskHeight / 2 + yOffset;

  describe("before position", () => {
    it("returns negative x (left of bar) with end anchor", () => {
      const config = getLabelConfig({ taskWidth, taskHeight, labelPosition: "before", fontSize });
      expect(config.x).toBe(-padding);
      expect(config.textAnchor).toBe("end");
      expect(config.clip).toBe(false);
    });

    it("uses external color", () => {
      const config = getLabelConfig({ taskWidth, taskHeight, labelPosition: "before", fontSize });
      expect(config.fill).toBe(RENDER_COLORS.textExternal);
    });

    it("computes correct y", () => {
      const config = getLabelConfig({ taskWidth, taskHeight, labelPosition: "before", fontSize });
      expect(config.y).toBeCloseTo(expectedY);
    });
  });

  describe("after position", () => {
    it("returns x past the bar width with start anchor", () => {
      const config = getLabelConfig({ taskWidth, taskHeight, labelPosition: "after", fontSize });
      expect(config.x).toBe(taskWidth + padding);
      expect(config.textAnchor).toBe("start");
      expect(config.clip).toBe(false);
    });

    it("uses external color", () => {
      const config = getLabelConfig({ taskWidth, taskHeight, labelPosition: "after", fontSize });
      expect(config.fill).toBe(RENDER_COLORS.textExternal);
    });
  });

  describe("inside position", () => {
    it("returns positive x with start anchor and clip=true", () => {
      const config = getLabelConfig({ taskWidth, taskHeight, labelPosition: "inside", fontSize });
      expect(config.x).toBe(padding);
      expect(config.textAnchor).toBe("start");
      expect(config.clip).toBe(true);
    });

    it("falls back to internalColor when no taskColor given", () => {
      const config = getLabelConfig({ taskWidth, taskHeight, labelPosition: "inside", fontSize });
      expect(config.fill).toBe(LABEL_RENDER_CONSTANTS.internalColor);
    });

    it("uses contrast color when taskColor is provided (light bg → dark text)", () => {
      // White background → dark text expected
      const config = getLabelConfig({
        taskWidth,
        taskHeight,
        labelPosition: "inside",
        fontSize,
        taskColor: "#ffffff",
      });
      // getContrastTextColor("#ffffff") should return a dark color
      expect(config.fill).not.toBe(LABEL_RENDER_CONSTANTS.internalColor);
    });

    it("uses contrast color when taskColor is provided (dark bg → light text)", () => {
      // Black background → light text expected
      const config = getLabelConfig({
        taskWidth,
        taskHeight,
        labelPosition: "inside",
        fontSize,
        taskColor: "#000000",
      });
      // For a dark background, contrast text should be light (white)
      expect(config.fill).toBe(LABEL_RENDER_CONSTANTS.internalColor);
    });
  });

  describe("exhaustiveness guard", () => {
    it("throws for an unknown label position", () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getLabelConfig({ taskWidth, taskHeight, labelPosition: "unknown" as any, fontSize })
      ).toThrow("Unknown labelPosition");
    });
  });
});

// ---------------------------------------------------------------------------
// RENDER_COLORS canary tests
// Guards against accidental hex value changes in the critical color constants.
// ---------------------------------------------------------------------------

describe("RENDER_COLORS (canary)", () => {
  it("taskDefault is brand-600 (#0F6CBD)", () => {
    expect(RENDER_COLORS.taskDefault).toBe("#0F6CBD");
  });

  it("todayMarker matches taskDefault hex (semantic duplicate — both brand-600)", () => {
    expect(RENDER_COLORS.todayMarker).toBe(RENDER_COLORS.taskDefault);
  });

  it("dependency line color is slate-300 equivalent (#94a3b8)", () => {
    expect(RENDER_COLORS.dependency).toBe("#94a3b8");
  });

  it("gridLine color is slate-200 (#e2e8f0)", () => {
    expect(RENDER_COLORS.gridLine).toBe("#e2e8f0");
  });

  it("weekendBackground is composited neutral-100/50% over white (#f8fafc)", () => {
    expect(RENDER_COLORS.weekendBackground).toBe("#f8fafc");
  });

  it("holidayBackground is composited amber-100/50% over white (#fef9e3)", () => {
    expect(RENDER_COLORS.holidayBackground).toBe("#fef9e3");
  });

  it("tableText is slate-900 equivalent (#1e293b)", () => {
    expect(RENDER_COLORS.tableText).toBe("#1e293b");
  });

  it("headerBackground and weekendBackground share the same slate-100 value (#f8fafc)", () => {
    expect(RENDER_COLORS.headerBackground).toBe(RENDER_COLORS.weekendBackground);
    expect(RENDER_COLORS.headerBackground).toBe("#f8fafc");
  });

  it("tableBorder and gridLine share the same slate-200 value (#e2e8f0)", () => {
    expect(RENDER_COLORS.tableBorder).toBe(RENDER_COLORS.gridLine);
    expect(RENDER_COLORS.tableBorder).toBe("#e2e8f0");
  });

  it("headerText is slate-600 (#475569)", () => {
    expect(RENDER_COLORS.headerText).toBe("#475569");
  });
});
