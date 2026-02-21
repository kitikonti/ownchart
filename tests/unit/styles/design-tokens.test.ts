import { describe, it, expect } from "vitest";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
  TRANSITIONS,
  TOOLBAR,
  CONTEXT_MENU,
  TABLE_HEADER,
  GRID,
  TIMELINE_HEADER,
  CONNECTION_HANDLE,
  ROW_NUMBER,
  TOAST,
} from "../../../src/styles/design-tokens";

const HEX_RE = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

/**
 * Recursively collect all string values that look like hex colors (#...).
 */
function collectHexValues(
  obj: Record<string, unknown>,
  path = ""
): Array<{ path: string; value: string }> {
  const results: Array<{ path: string; value: string }> = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (typeof value === "string" && value.startsWith("#")) {
      results.push({ path: fullPath, value });
    } else if (typeof value === "object" && value !== null) {
      results.push(
        ...collectHexValues(value as Record<string, unknown>, fullPath)
      );
    }
  }
  return results;
}

// ── Hex format validation ──────────────────────────────────────────────────

describe("design-tokens hex format", () => {
  const tokenSections = {
    COLORS,
    TABLE_HEADER,
    GRID,
    TIMELINE_HEADER,
    CONNECTION_HANDLE,
    ROW_NUMBER,
    TOAST,
  };

  const allHexValues = collectHexValues(
    tokenSections as unknown as Record<string, unknown>
  );

  it("should have at least 20 hex color values across all sections", () => {
    expect(allHexValues.length).toBeGreaterThanOrEqual(20);
  });

  it.each(allHexValues.map(({ path, value }) => [path, value]))(
    "%s = %s should be valid hex (#RGB or #RRGGBB)",
    (_path, value) => {
      expect(value).toMatch(HEX_RE);
    }
  );
});

// ── Scale consistency ──────────────────────────────────────────────────────

describe("design-tokens scale consistency", () => {
  it("neutral[0] should be white", () => {
    expect(COLORS.neutral[0]).toBe("#ffffff");
  });

  it("brand[600] should be Outlook Blue (#0F6CBD)", () => {
    expect(COLORS.brand[600]).toBe("#0F6CBD");
  });

  it("chart.taskDefault should reference brand[600]", () => {
    expect(COLORS.chart.taskDefault).toBe(COLORS.brand[600]);
  });

  it("chart.todayMarker should reference brand[600]", () => {
    expect(COLORS.chart.todayMarker).toBe(COLORS.brand[600]);
  });
});

// ── Export completeness ────────────────────────────────────────────────────

describe("design-tokens export completeness", () => {
  it.each([
    ["COLORS", COLORS],
    ["SPACING", SPACING],
    ["TYPOGRAPHY", TYPOGRAPHY],
    ["RADIUS", RADIUS],
    ["SHADOWS", SHADOWS],
    ["TRANSITIONS", TRANSITIONS],
    ["TOOLBAR", TOOLBAR],
    ["CONTEXT_MENU", CONTEXT_MENU],
    ["TABLE_HEADER", TABLE_HEADER],
    ["GRID", GRID],
    ["TIMELINE_HEADER", TIMELINE_HEADER],
    ["CONNECTION_HANDLE", CONNECTION_HANDLE],
    ["ROW_NUMBER", ROW_NUMBER],
    ["TOAST", TOAST],
  ])("%s should be defined and non-empty", (_name, token) => {
    expect(token).toBeDefined();
    expect(Object.keys(token).length).toBeGreaterThan(0);
  });
});

// ── Inline snapshots for regression protection ─────────────────────────────

describe("design-tokens snapshots", () => {
  it("GRID tokens should match snapshot", () => {
    expect(GRID).toMatchInlineSnapshot(`
      {
        "holidayBg": "#fce7f3",
        "lineDaily": "#e9ecef",
        "lineDailyWeekend": "#dee2e6",
        "lineHorizontal": "#e9ecef",
        "lineWeeklyMonthly": "#d1d5db",
        "weekendBg": "#f1f3f5",
      }
    `);
  });

  it("TIMELINE_HEADER tokens should match snapshot", () => {
    expect(TIMELINE_HEADER).toMatchInlineSnapshot(`
      {
        "bg": "#f8f9fa",
        "border": "#dee2e6",
      }
    `);
  });

  it("TOAST tokens should match snapshot", () => {
    expect(TOAST).toMatchInlineSnapshot(`
      {
        "bg": "#1e293b",
        "text": "#f8fafc",
      }
    `);
  });
});
