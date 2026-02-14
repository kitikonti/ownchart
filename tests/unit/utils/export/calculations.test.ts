/**
 * Unit tests for export calculations (calculateEffectiveZoom, getEffectiveDateRange, calculateDurationDays).
 */

import { describe, it, expect } from "vitest";
import {
  calculateEffectiveZoom,
  getEffectiveDateRange,
  calculateDurationDays,
  BASE_PIXELS_PER_DAY,
} from "../../../../src/utils/export/calculations";
import type { ExportOptions } from "../../../../src/utils/export/types";
import { DEFAULT_EXPORT_OPTIONS } from "../../../../src/utils/export/types";

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
});
