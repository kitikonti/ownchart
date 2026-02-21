import { describe, it, expect } from "vitest";
import {
  TASK_COLUMNS,
  getVisibleColumns,
  getHideableColumns,
  getColumnPixelWidth,
  getDensityAwareWidth,
} from "../../../src/config/tableColumns";
import { DENSITY_CONFIG } from "../../../src/config/densityConfig";
import type { DensityConfig } from "../../../src/types/preferences.types";

const normalDensity: DensityConfig = DENSITY_CONFIG.normal;

// ── TASK_COLUMNS ─────────────────────────────────────────────────────────────

describe("TASK_COLUMNS", () => {
  it("should define 7 columns in order", () => {
    const ids = TASK_COLUMNS.map((c) => c.id);
    expect(ids).toEqual([
      "rowNumber",
      "color",
      "name",
      "startDate",
      "endDate",
      "duration",
      "progress",
    ]);
  });

  it("should have unique column IDs", () => {
    const ids = TASK_COLUMNS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should mark startDate, endDate, duration, progress as hideable", () => {
    const hideable = TASK_COLUMNS.filter((c) => c.hideable).map((c) => c.id);
    expect(hideable).toEqual(["startDate", "endDate", "duration", "progress"]);
  });

  it("should mark rowNumber as non-editable", () => {
    const rowNum = TASK_COLUMNS.find((c) => c.id === "rowNumber");
    expect(rowNum?.editable).toBe(false);
  });
});

// ── getVisibleColumns ────────────────────────────────────────────────────────

describe("getVisibleColumns", () => {
  it("should return all columns when nothing is hidden", () => {
    const visible = getVisibleColumns([]);
    expect(visible.length).toBe(TASK_COLUMNS.length);
  });

  it("should hide a single hideable column", () => {
    const visible = getVisibleColumns(["startDate"]);
    expect(visible.find((c) => c.id === "startDate")).toBeUndefined();
    expect(visible.length).toBe(TASK_COLUMNS.length - 1);
  });

  it("should hide multiple hideable columns", () => {
    const visible = getVisibleColumns(["startDate", "endDate", "progress"]);
    const ids = visible.map((c) => c.id);
    expect(ids).not.toContain("startDate");
    expect(ids).not.toContain("endDate");
    expect(ids).not.toContain("progress");
    expect(visible.length).toBe(TASK_COLUMNS.length - 3);
  });

  it("should not hide non-hideable columns even if listed", () => {
    const visible = getVisibleColumns(["name", "rowNumber", "color"]);
    expect(visible.length).toBe(TASK_COLUMNS.length);
  });

  it("should ignore unknown column IDs", () => {
    const visible = getVisibleColumns(["nonexistent"]);
    expect(visible.length).toBe(TASK_COLUMNS.length);
  });
});

// ── getHideableColumns ───────────────────────────────────────────────────────

describe("getHideableColumns", () => {
  it("should return only hideable columns", () => {
    const hideable = getHideableColumns();
    expect(hideable.every((c) => c.hideable)).toBe(true);
    expect(hideable.length).toBe(4);
  });
});

// ── getColumnPixelWidth ──────────────────────────────────────────────────────

describe("getColumnPixelWidth", () => {
  it("should return stored width when available", () => {
    const result = getColumnPixelWidth(
      "startDate",
      { startDate: 200 },
      normalDensity
    );
    expect(result).toBe(200);
  });

  it("should fall back to density default for known columns", () => {
    const result = getColumnPixelWidth("startDate", {}, normalDensity);
    expect(result).toBe(normalDensity.columnWidths.startDate);
  });

  it("should return density defaults for all mapped columns", () => {
    const mappedColumns = [
      "rowNumber",
      "color",
      "startDate",
      "endDate",
      "duration",
      "progress",
    ] as const;

    for (const colId of mappedColumns) {
      const result = getColumnPixelWidth(colId, {}, normalDensity);
      expect(result).toBe(
        normalDensity.columnWidths[colId as keyof typeof normalDensity.columnWidths]
      );
    }
  });

  it("should return default 100px for unknown columns", () => {
    const result = getColumnPixelWidth("unknown", {}, normalDensity);
    expect(result).toBe(100);
  });

  it("should return default for name column (uses minmax in grid)", () => {
    const result = getColumnPixelWidth("name", {}, normalDensity);
    expect(result).toBe(100);
  });

  it("should prefer stored width over density default", () => {
    const result = getColumnPixelWidth(
      "rowNumber",
      { rowNumber: 60 },
      normalDensity
    );
    expect(result).toBe(60);
  });

  it("should respect different density configs", () => {
    const compact = DENSITY_CONFIG.compact;
    const comfortable = DENSITY_CONFIG.comfortable;

    expect(getColumnPixelWidth("startDate", {}, compact)).toBe(
      compact.columnWidths.startDate
    );
    expect(getColumnPixelWidth("startDate", {}, comfortable)).toBe(
      comfortable.columnWidths.startDate
    );
    expect(
      getColumnPixelWidth("startDate", {}, compact)
    ).not.toBe(
      getColumnPixelWidth("startDate", {}, comfortable)
    );
  });
});

// ── getDensityAwareWidth ─────────────────────────────────────────────────────

describe("getDensityAwareWidth", () => {
  it("should return minmax for name column", () => {
    const result = getDensityAwareWidth("name", normalDensity);
    expect(result).toBe(`minmax(${normalDensity.columnWidths.nameMin}px, 1fr)`);
  });

  it("should return px string for mapped columns", () => {
    expect(getDensityAwareWidth("startDate", normalDensity)).toBe(
      `${normalDensity.columnWidths.startDate}px`
    );
    expect(getDensityAwareWidth("rowNumber", normalDensity)).toBe(
      `${normalDensity.columnWidths.rowNumber}px`
    );
  });

  it("should fall back to column definition defaultWidth for unknown columns", () => {
    // "name" is handled separately; test a truly unknown column
    const result = getDensityAwareWidth("nonexistent", normalDensity);
    expect(result).toBe("100px");
  });

  it("should respect different density configs for name column", () => {
    const compact = DENSITY_CONFIG.compact;
    const comfortable = DENSITY_CONFIG.comfortable;

    expect(getDensityAwareWidth("name", compact)).toBe(
      `minmax(${compact.columnWidths.nameMin}px, 1fr)`
    );
    expect(getDensityAwareWidth("name", comfortable)).toBe(
      `minmax(${comfortable.columnWidths.nameMin}px, 1fr)`
    );
  });
});

// ── Column validators ────────────────────────────────────────────────────────

describe("column validators", () => {
  const durationCol = TASK_COLUMNS.find((c) => c.id === "duration");
  const progressCol = TASK_COLUMNS.find((c) => c.id === "progress");

  it("should validate duration >= 1", () => {
    const validate = durationCol!.validator!;
    expect(validate(5)).toEqual({ valid: true });
    expect(validate(1)).toEqual({ valid: true });
    expect(validate(0).valid).toBe(false);
    expect(validate(-1).valid).toBe(false);
    expect(validate("abc").valid).toBe(false);
  });

  it("should format duration with correct pluralization", () => {
    const format = durationCol!.formatter!;
    expect(format(1)).toBe("1 day");
    expect(format(5)).toBe("5 days");
  });

  it("should format progress with percent sign", () => {
    const format = progressCol!.formatter!;
    expect(format(50)).toBe("50%");
    expect(format(0)).toBe("0%");
  });
});
