/**
 * Unit tests for export calculations (calculateEffectiveZoom, getEffectiveDateRange,
 * calculateDurationDays, getDefaultColumnWidth, calculateTaskTableWidth,
 * calculateOptimalColumnWidths).
 */

import { describe, it, expect } from "vitest";
import {
  calculateEffectiveZoom,
  getEffectiveDateRange,
  calculateDurationDays,
  BASE_PIXELS_PER_DAY,
  getDefaultColumnWidth,
  calculateTaskTableWidth,
  calculateOptimalColumnWidths,
  calculateOptimalColumnWidth,
} from "@/utils/export/calculations";
import type { ExportOptions } from "@/utils/export/types";
import { DEFAULT_EXPORT_OPTIONS } from "@/utils/export/types";
import type { Task } from "@/types/chart.types";

const baseOptions: ExportOptions = {
  ...DEFAULT_EXPORT_OPTIONS,
};

describe("calculateEffectiveZoom", () => {
  it("returns currentAppZoom for currentView mode", () => {
    const options = { ...baseOptions, zoomMode: "currentView" as const };
    expect(calculateEffectiveZoom(options, 1.5, 100, 200)).toBe(1.5);
  });

  it("returns timelineZoom for custom mode", () => {
    const options = {
      ...baseOptions,
      zoomMode: "custom" as const,
      timelineZoom: 0.75,
    };
    expect(calculateEffectiveZoom(options, 1.5, 100, 200)).toBe(0.75);
  });

  it("calculates correctly for fitToWidth mode", () => {
    const options = {
      ...baseOptions,
      zoomMode: "fitToWidth" as const,
      fitToWidth: 1920,
    };
    const taskTableWidth = 400;
    const durationDays = 60;

    const result = calculateEffectiveZoom(
      options,
      1.0,
      durationDays,
      taskTableWidth
    );
    // timelineWidth = max(100, 1920 - 400) = 1520
    // zoom = 1520 / (60 * 25) = 1520 / 1500 = 1.0133...
    const expected = (1920 - taskTableWidth) / (durationDays * BASE_PIXELS_PER_DAY);
    expect(result).toBeCloseTo(expected, 5);
  });

  it("enforces minimum timeline width of 100px for fitToWidth", () => {
    const options = {
      ...baseOptions,
      zoomMode: "fitToWidth" as const,
      fitToWidth: 300, // very small
    };
    const taskTableWidth = 400; // larger than fitToWidth
    const durationDays = 60;

    const result = calculateEffectiveZoom(
      options,
      1.0,
      durationDays,
      taskTableWidth
    );
    // timelineWidth = max(100, 300 - 400) = max(100, -100) = 100
    const expected = 100 / (durationDays * BASE_PIXELS_PER_DAY);
    expect(result).toBeCloseTo(expected, 5);
  });

  it("returns 1 for fitToWidth with zero duration days", () => {
    const options = {
      ...baseOptions,
      zoomMode: "fitToWidth" as const,
      fitToWidth: 1920,
    };
    expect(calculateEffectiveZoom(options, 1.0, 0, 200)).toBe(1);
  });

  it("returns timelineZoom for unknown zoom mode (default case)", () => {
    const options = {
      ...baseOptions,
      zoomMode: "unknown" as ExportOptions["zoomMode"],
      timelineZoom: 2.0,
    };
    expect(calculateEffectiveZoom(options, 1.0, 100, 200)).toBe(2.0);
  });
});

describe("getEffectiveDateRange", () => {
  const projectDateRange = {
    start: new Date("2025-01-01"),
    end: new Date("2025-03-01"),
  };

  it("adds 7-day base padding for 'all' mode", () => {
    const options = { ...baseOptions, dateRangeMode: "all" as const };
    const result = getEffectiveDateRange(options, projectDateRange, undefined);

    const minDate = new Date(result.min);
    const maxDate = new Date(result.max);
    const expectedMin = new Date("2024-12-25"); // Jan 1 - 7
    const expectedMax = new Date("2025-03-08"); // Mar 1 + 7

    expect(minDate.getTime()).toBe(expectedMin.getTime());
    expect(maxDate.getTime()).toBe(expectedMax.getTime());
  });

  it("passes through ranges for 'visible' mode", () => {
    const options = { ...baseOptions, dateRangeMode: "visible" as const };
    const visibleRange = {
      start: new Date("2025-02-01"),
      end: new Date("2025-02-15"),
    };
    const result = getEffectiveDateRange(
      options,
      projectDateRange,
      visibleRange
    );
    expect(result.min).toBe("2025-02-01");
    expect(result.max).toBe("2025-02-15");
  });

  it("passes through ranges for 'custom' mode", () => {
    const options = {
      ...baseOptions,
      dateRangeMode: "custom" as const,
      customDateStart: "2025-01-15",
      customDateEnd: "2025-02-15",
    };
    const result = getEffectiveDateRange(
      options,
      projectDateRange,
      undefined
    );
    expect(result.min).toBe("2025-01-15");
    expect(result.max).toBe("2025-02-15");
  });

  it("returns default range when visible mode has no range", () => {
    const options = { ...baseOptions, dateRangeMode: "visible" as const };
    const result = getEffectiveDateRange(options, undefined, undefined);
    // Should return default (today-7 to today+30)
    expect(result.min).toBeTruthy();
    expect(result.max).toBeTruthy();
  });

  it("returns default range for 'custom' mode when only customDateStart is provided", () => {
    const options = {
      ...baseOptions,
      dateRangeMode: "custom" as const,
      customDateStart: "2025-01-15",
      // customDateEnd intentionally omitted
    };
    const result = getEffectiveDateRange(options, undefined, undefined);
    // Both dates must be present; missing end date falls back to default range
    expect(result.min).toBeTruthy();
    expect(result.max).toBeTruthy();
    // The result must NOT be the custom start date (it fell back)
    expect(result.min).not.toBe("2025-01-15");
  });

  it("returns default range for 'custom' mode when only customDateEnd is provided", () => {
    const options = {
      ...baseOptions,
      dateRangeMode: "custom" as const,
      // customDateStart intentionally omitted
      customDateEnd: "2025-02-15",
    };
    const result = getEffectiveDateRange(options, undefined, undefined);
    // Both dates must be present; missing start date falls back to default range
    expect(result.min).toBeTruthy();
    expect(result.max).toBeTruthy();
    expect(result.max).not.toBe("2025-02-15");
  });
});

describe("calculateDurationDays", () => {
  it("calculates correct day count", () => {
    const result = calculateDurationDays({
      min: "2025-01-01",
      max: "2025-01-31",
    });
    expect(result).toBe(30);
  });

  it("returns 0 for same start and end date", () => {
    const result = calculateDurationDays({
      min: "2025-01-01",
      max: "2025-01-01",
    });
    expect(result).toBe(0);
  });

  it("handles year boundaries", () => {
    const result = calculateDurationDays({
      min: "2024-12-01",
      max: "2025-01-31",
    });
    expect(result).toBe(61);
  });

  it("returns exactly 1 day across a DST spring-forward boundary (ISO strings are UTC)", () => {
    // US Eastern spring-forward: 2025-03-09 02:00 → 03:00
    // ISO date strings are parsed as UTC midnight, so the difference is
    // exactly 86 400 000 ms regardless of local DST transitions.
    const result = calculateDurationDays({
      min: "2025-03-09",
      max: "2025-03-10",
    });
    expect(result).toBe(1);
  });

  it("returns exactly 1 day across a DST fall-back boundary (ISO strings are UTC)", () => {
    // US Eastern fall-back: 2025-11-02 02:00 → 01:00
    const result = calculateDurationDays({
      min: "2025-11-02",
      max: "2025-11-03",
    });
    expect(result).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getDefaultColumnWidth
// ---------------------------------------------------------------------------

describe("getDefaultColumnWidth", () => {
  it("returns color column width for 'color' key", () => {
    const result = getDefaultColumnWidth("color", "comfortable");
    expect(result).toBeGreaterThan(0);
  });

  it("returns nameMin width for 'name' key", () => {
    const result = getDefaultColumnWidth("name", "comfortable");
    expect(result).toBeGreaterThan(0);
  });

  it("returns startDate width for 'startDate' key", () => {
    const result = getDefaultColumnWidth("startDate", "comfortable");
    expect(result).toBeGreaterThan(0);
  });

  it("returns endDate width for 'endDate' key", () => {
    const result = getDefaultColumnWidth("endDate", "comfortable");
    expect(result).toBeGreaterThan(0);
  });

  it("returns duration width for 'duration' key", () => {
    const result = getDefaultColumnWidth("duration", "comfortable");
    expect(result).toBeGreaterThan(0);
  });

  it("returns progress width for 'progress' key", () => {
    const result = getDefaultColumnWidth("progress", "comfortable");
    expect(result).toBeGreaterThan(0);
  });

  it("returns 100 for an unknown column key (fallback branch)", () => {
    // The default branch exists as a safety net; exercise it explicitly.
    const result = getDefaultColumnWidth(
      "unknown" as Parameters<typeof getDefaultColumnWidth>[0],
      "comfortable"
    );
    expect(result).toBe(100);
  });

  it("returns different widths for different densities", () => {
    const compact = getDefaultColumnWidth("name", "compact");
    const comfortable = getDefaultColumnWidth("name", "comfortable");
    // Comfortable density should have wider name columns than compact
    expect(comfortable).toBeGreaterThan(compact);
  });
});

// ---------------------------------------------------------------------------
// calculateTaskTableWidth
// ---------------------------------------------------------------------------

describe("calculateTaskTableWidth", () => {
  it("returns 0 for an empty column list", () => {
    const result = calculateTaskTableWidth([], {}, "comfortable");
    expect(result).toBe(0);
  });

  it("sums density-default widths when columnWidths map is empty", () => {
    const colorWidth = getDefaultColumnWidth("color", "comfortable");
    const nameWidth = getDefaultColumnWidth("name", "comfortable");
    const result = calculateTaskTableWidth(
      ["color", "name"],
      {},
      "comfortable"
    );
    expect(result).toBe(colorWidth + nameWidth);
  });

  it("uses the provided width when a key is present in columnWidths", () => {
    const result = calculateTaskTableWidth(
      ["name"],
      { name: 300 },
      "comfortable"
    );
    expect(result).toBe(300);
  });

  it("respects a stored width of 0 (undefined-guard, not falsy-guard)", () => {
    // A stored value of 0 must be kept rather than falling back to the default.
    const result = calculateTaskTableWidth(
      ["progress"],
      { progress: 0 },
      "comfortable"
    );
    expect(result).toBe(0);
  });

  it("mixes explicit widths and density defaults across columns", () => {
    const endDateDefault = getDefaultColumnWidth("endDate", "comfortable");
    const result = calculateTaskTableWidth(
      ["name", "endDate"],
      { name: 200 },
      "comfortable"
    );
    expect(result).toBe(200 + endDateDefault);
  });

  it("produces different totals for different density settings", () => {
    const compact = calculateTaskTableWidth(
      ["color", "name"],
      {},
      "compact"
    );
    const comfortable = calculateTaskTableWidth(
      ["color", "name"],
      {},
      "comfortable"
    );
    // Comfortable density uses wider columns
    expect(comfortable).toBeGreaterThan(compact);
  });
});

// ---------------------------------------------------------------------------
// calculateOptimalColumnWidths
// ---------------------------------------------------------------------------

describe("calculateOptimalColumnWidths", () => {
  it("calculates widths for selected columns when no existing widths provided", () => {
    const result = calculateOptimalColumnWidths(
      ["color", "name"],
      [],
      "comfortable"
    );
    expect(result).toHaveProperty("color");
    expect(result).toHaveProperty("name");
    expect(result.color).toBeGreaterThan(0);
    expect(result.name).toBeGreaterThan(0);
  });

  it("respects existing width when it is a positive number", () => {
    const existingWidths = { name: 300 };
    const result = calculateOptimalColumnWidths(
      ["name", "startDate"],
      [],
      "comfortable",
      existingWidths
    );
    expect(result.name).toBe(300);
  });

  it("respects existing width even when it is 0 (undefined-guard, not falsy-guard)", () => {
    // A stored value of 0 must be kept rather than replaced by the calculated width
    const existingWidths = { progress: 0 };
    const result = calculateOptimalColumnWidths(
      ["progress"],
      [],
      "comfortable",
      existingWidths
    );
    expect(result.progress).toBe(0);
  });

  it("calculates width for columns absent from existingWidths", () => {
    const existingWidths = { name: 250 };
    const result = calculateOptimalColumnWidths(
      ["name", "endDate"],
      [],
      "comfortable",
      existingWidths
    );
    // endDate not in existingWidths — should be calculated
    expect(result.endDate).toBeGreaterThan(0);
  });

  it("returns empty object for empty selectedColumns", () => {
    const result = calculateOptimalColumnWidths([], [], "comfortable");
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// calculateOptimalColumnWidth (singular)
// ---------------------------------------------------------------------------

const makeTask = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  name: `Task ${id}`,
  startDate: "2025-01-01",
  endDate: "2025-01-15",
  duration: 14,
  progress: 0,
  color: "#4A90E2",
  order: 0,
  metadata: {},
  type: "task",
  ...overrides,
});

describe("calculateOptimalColumnWidth", () => {
  it("returns the fixed color column width for the 'color' key (early-return path)", () => {
    const result = calculateOptimalColumnWidth("color", [], "comfortable");
    const defaultWidth = getDefaultColumnWidth("color", "comfortable");
    // The color column always returns its density default regardless of tasks
    expect(result).toBe(defaultWidth);
  });

  it("returns a positive width for the 'name' column with flat tasks", () => {
    const tasks = [makeTask("1"), makeTask("2")];
    const result = calculateOptimalColumnWidth("name", tasks, "comfortable");
    expect(result).toBeGreaterThan(0);
  });

  it("returns a wider 'name' column for deeply nested tasks (extra indent)", () => {
    const flat = [makeTask("root")];
    const nested = [
      makeTask("root"),
      makeTask("child", { parent: "root" }),
      makeTask("grandchild", { parent: "child" }),
    ];
    const flatWidth = calculateOptimalColumnWidth("name", flat, "comfortable");
    const nestedWidth = calculateOptimalColumnWidth(
      "name",
      nested,
      "comfortable"
    );
    // Deeper nesting adds indent pixels → wider optimal width
    expect(nestedWidth).toBeGreaterThanOrEqual(flatWidth);
  });

  it("returns a positive width for a data column like 'startDate'", () => {
    const tasks = [makeTask("1", { startDate: "2025-03-01" })];
    const result = calculateOptimalColumnWidth("startDate", tasks, "comfortable");
    expect(result).toBeGreaterThan(0);
  });

  it("returns a positive width for an empty task list (header label drives minimum)", () => {
    const result = calculateOptimalColumnWidth("endDate", [], "comfortable");
    expect(result).toBeGreaterThan(0);
  });

  it("assigns level 0 to a task whose parent ID does not exist in the list (orphan-parent fallback)", () => {
    // computeTaskLevel: task.parent is set but taskById.has(task.parent) is false
    // → falls back to level 0, same as a genuine root task with the same name.
    // Use the same name so text-measurement width is identical.
    const sameName = "Identical Task Name";
    const orphan = makeTask("orphan", { name: sameName, parent: "non-existent-id" });
    const flat = makeTask("flat", { name: sameName });
    const orphanWidth = calculateOptimalColumnWidth(
      "name",
      [orphan],
      "comfortable"
    );
    const flatWidth = calculateOptimalColumnWidth("name", [flat], "comfortable");
    // Both are treated as root-level (no indent) — widths must match exactly
    expect(orphanWidth).toBe(flatWidth);
  });
});

// ---------------------------------------------------------------------------
// getEffectiveDateRange — label-padding branch ('all' mode with tasks + zoom)
// ---------------------------------------------------------------------------

describe("getEffectiveDateRange — label-padding branch", () => {
  const projectDateRange = {
    start: new Date("2025-01-01"),
    end: new Date("2025-03-01"),
  };

  it("produces a wider range when tasks with long names and low zoom are provided", () => {
    const baseOptions = { ...DEFAULT_EXPORT_OPTIONS, dateRangeMode: "all" as const };

    // Baseline: no tasks, no extra label padding applied
    const baseResult = getEffectiveDateRange(
      baseOptions,
      projectDateRange,
      undefined
    );

    // With tasks and a low zoom the label-padding path adds extra days on each side
    const tasks = [
      makeTask("1", {
        name: "Very Long Task Name That Extends Past Bar Edge",
        startDate: "2025-01-01",
        endDate: "2025-03-01",
      }),
    ];
    const paddedResult = getEffectiveDateRange(
      baseOptions,
      projectDateRange,
      undefined,
      tasks,
      0.1 // very low zoom → large pixels-per-day → potential label overflow
    );

    // The padded range must be at least as wide as the base-padded range
    const baseMinMs = new Date(baseResult.min).getTime();
    const baseMaxMs = new Date(baseResult.max).getTime();
    const paddedMinMs = new Date(paddedResult.min).getTime();
    const paddedMaxMs = new Date(paddedResult.max).getTime();

    expect(paddedMinMs).toBeLessThanOrEqual(baseMinMs);
    expect(paddedMaxMs).toBeGreaterThanOrEqual(baseMaxMs);
  });

  it("uses the default range (no tasks, no zoom) when no projectDateRange is provided", () => {
    const options = { ...DEFAULT_EXPORT_OPTIONS, dateRangeMode: "all" as const };
    const result = getEffectiveDateRange(options, undefined, undefined, [], 1.0);
    // Should fall back to today ± default look-back/ahead
    expect(result.min).toBeTruthy();
    expect(result.max).toBeTruthy();
    // Result should not be the custom project range
    expect(result.min).not.toBe("2024-12-25");
  });

  it("does NOT add extra label padding when tasks list is empty (early-return guard)", () => {
    const options = { ...DEFAULT_EXPORT_OPTIONS, dateRangeMode: "all" as const };

    // Passing tasks=[] and effectiveZoom=0 hits the early-return guard in
    // calculateLabelExtraPadding, which returns { leftDays: 0, rightDays: 0 }.
    // The result must equal the plain 7-day-padded range with no extra days.
    const withEmptyTasks = getEffectiveDateRange(
      options,
      projectDateRange,
      undefined,
      [],
      0
    );
    // Base result with no tasks/zoom provided (same guard via ?? defaults)
    const withNoArgs = getEffectiveDateRange(
      options,
      projectDateRange,
      undefined
    );

    // Both paths must produce the same date range — label padding is zero in
    // each case because either tasks is empty or effectiveZoom is 0.
    expect(withEmptyTasks.min).toBe(withNoArgs.min);
    expect(withEmptyTasks.max).toBe(withNoArgs.max);
  });
});
