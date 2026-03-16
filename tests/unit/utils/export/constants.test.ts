/**
 * Unit tests for constants.ts
 *
 * Verifies static constant values and derived constants that could silently
 * regress if the underlying design tokens or formulas change.
 */

import { describe, it, expect } from "vitest";
import {
  HEADER_HEIGHT,
  REACT_RENDER_WAIT_MS,
  SVG_FONT_FAMILY,
  EXPORT_COLORS,
  TEXT_BASELINE_OFFSET,
  ARROW_PLACEHOLDER_WIDTH,
  ICON_RENDER_SIZE,
  ICON_TEXT_GAP,
  ICON_SCALE,
  ARROW_FONT_SIZE,
  COLOR_BAR_WIDTH,
  COLOR_BAR_RADIUS,
  COLUMN_HEADER_FONT_SIZE,
  BORDER_STROKE_WIDTH,
  LETTER_SPACING_WIDER,
  EXPORT_CHART_SVG_CLASS,
  EXPORT_TIMELINE_HEADER_SVG_CLASS,
  SVG_NS,
  SVG_BACKGROUND_WHITE,
  TASK_TYPE_ICON_PATHS,
} from "@/utils/export/constants";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

describe("layout constants", () => {
  it("HEADER_HEIGHT is 48 px", () => {
    expect(HEADER_HEIGHT).toBe(48);
  });

  it("REACT_RENDER_WAIT_MS is 100 ms", () => {
    expect(REACT_RENDER_WAIT_MS).toBe(100);
  });

  it("TEXT_BASELINE_OFFSET is 4", () => {
    expect(TEXT_BASELINE_OFFSET).toBe(4);
  });

  it("ARROW_PLACEHOLDER_WIDTH is 16 (Tailwind w-4)", () => {
    expect(ARROW_PLACEHOLDER_WIDTH).toBe(16);
  });

  it("ICON_RENDER_SIZE is 16", () => {
    expect(ICON_RENDER_SIZE).toBe(16);
  });

  it("ICON_TEXT_GAP is 4", () => {
    expect(ICON_TEXT_GAP).toBe(4);
  });

  it("ICON_SCALE equals ICON_RENDER_SIZE / 256", () => {
    expect(ICON_SCALE).toBeCloseTo(16 / 256);
  });

  it("ARROW_FONT_SIZE is 11", () => {
    expect(ARROW_FONT_SIZE).toBe(11);
  });

  it("COLOR_BAR_WIDTH is 6", () => {
    expect(COLOR_BAR_WIDTH).toBe(6);
  });

  it("COLOR_BAR_RADIUS is 3", () => {
    expect(COLOR_BAR_RADIUS).toBe(3);
  });

  it("COLUMN_HEADER_FONT_SIZE is 12 (Tailwind text-xs)", () => {
    expect(COLUMN_HEADER_FONT_SIZE).toBe(12);
  });

  it("BORDER_STROKE_WIDTH is 1", () => {
    expect(BORDER_STROKE_WIDTH).toBe(1);
  });

  it("LETTER_SPACING_WIDER is '0.05em' (Tailwind tracking-wider)", () => {
    expect(LETTER_SPACING_WIDER).toBe("0.05em");
  });
});

// ---------------------------------------------------------------------------
// SVG / DOM selector constants
// ---------------------------------------------------------------------------

describe("SVG / DOM constants", () => {
  it("SVG_FONT_FAMILY starts with Inter", () => {
    expect(SVG_FONT_FAMILY.startsWith("Inter")).toBe(true);
  });

  it("EXPORT_CHART_SVG_CLASS is 'gantt-chart'", () => {
    expect(EXPORT_CHART_SVG_CLASS).toBe("gantt-chart");
  });

  it("EXPORT_TIMELINE_HEADER_SVG_CLASS is 'export-timeline-header'", () => {
    expect(EXPORT_TIMELINE_HEADER_SVG_CLASS).toBe("export-timeline-header");
  });

  it("SVG_NS is the standard SVG namespace", () => {
    expect(SVG_NS).toBe("http://www.w3.org/2000/svg");
  });

  it("SVG_BACKGROUND_WHITE is pure white '#ffffff'", () => {
    expect(SVG_BACKGROUND_WHITE).toBe("#ffffff");
  });
});

// ---------------------------------------------------------------------------
// EXPORT_COLORS — derived from design tokens; must stay in sync with slate scale
// ---------------------------------------------------------------------------

describe("EXPORT_COLORS", () => {
  const HEX_PATTERN = /^#[0-9a-fA-F]{3,6}$/;

  it("all color values are valid hex strings", () => {
    for (const [key, value] of Object.entries(EXPORT_COLORS)) {
      expect(HEX_PATTERN.test(value), `${key} should be a valid hex color`).toBe(true);
    }
  });

  it("textPrimary is slate-700 (#334155)", () => {
    expect(EXPORT_COLORS.textPrimary).toBe("#334155");
  });

  it("textSecondary is slate-600 (#475569)", () => {
    expect(EXPORT_COLORS.textSecondary).toBe("#475569");
  });

  it("textSummary is slate-500 (#64748b)", () => {
    expect(EXPORT_COLORS.textSummary).toBe("#64748b");
  });

  it("border is slate-200 (#e2e8f0)", () => {
    expect(EXPORT_COLORS.border).toBe("#e2e8f0");
  });

  it("borderLight is slate-100 (#f1f5f9)", () => {
    expect(EXPORT_COLORS.borderLight).toBe("#f1f5f9");
  });

  it("headerBg is slate-50 (#f8fafc)", () => {
    expect(EXPORT_COLORS.headerBg).toBe("#f8fafc");
  });
});

// ---------------------------------------------------------------------------
// TASK_TYPE_ICON_PATHS — sanity-check that all three variants are present
// ---------------------------------------------------------------------------

describe("TASK_TYPE_ICON_PATHS", () => {
  it("has paths for 'task', 'milestone', and 'summary'", () => {
    expect(typeof TASK_TYPE_ICON_PATHS.task).toBe("string");
    expect(typeof TASK_TYPE_ICON_PATHS.milestone).toBe("string");
    expect(typeof TASK_TYPE_ICON_PATHS.summary).toBe("string");
  });

  it("all paths are non-empty strings", () => {
    for (const [key, path] of Object.entries(TASK_TYPE_ICON_PATHS)) {
      expect(path.length, `${key} path should be non-empty`).toBeGreaterThan(0);
    }
  });
});
