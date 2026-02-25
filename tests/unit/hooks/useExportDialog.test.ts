/**
 * Tests for pure computation helpers exported from useExportDialog.
 */

import { describe, it, expect } from "vitest";
import {
  computeProjectDateRange,
  computeVisibleDateRange,
  computeReadabilityStatus,
} from "../../../src/hooks/useExportDialog";
import type { Task } from "../../../src/types/chart.types";
import type { TimelineScale } from "../../../src/utils/timelineUtils";
import {
  EXPORT_ZOOM_READABLE_THRESHOLD,
  EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD,
} from "../../../src/utils/export/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    name: "Task",
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    duration: 10,
    progress: 0,
    color: "#0F6CBD",
    type: "task",
    ...overrides,
  };
}

function makeScale(overrides: Partial<TimelineScale> = {}): TimelineScale {
  return {
    minDate: "2025-01-01",
    maxDate: "2025-03-31",
    pixelsPerDay: 10,
    totalWidth: 900,
    totalDays: 90,
    zoom: 1,
    scales: [],
    ...overrides,
  };
}

// ── computeProjectDateRange ─────────────────────────────────────────────────

describe("computeProjectDateRange", () => {
  it("should return undefined for empty tasks array", () => {
    expect(computeProjectDateRange([])).toBeUndefined();
  });

  it("should return undefined when all tasks have missing dates", () => {
    const tasks = [
      makeTask({ id: "1", startDate: undefined, endDate: undefined }),
      makeTask({ id: "2", startDate: undefined, endDate: undefined }),
    ];
    expect(computeProjectDateRange(tasks)).toBeUndefined();
  });

  it("should skip tasks with missing startDate", () => {
    const tasks = [
      makeTask({ id: "1", startDate: undefined }),
      makeTask({ id: "2", startDate: "2025-03-01", endDate: "2025-03-15" }),
    ];
    const result = computeProjectDateRange(tasks);
    expect(result).toBeDefined();
    expect(result!.start.toISOString().slice(0, 10)).toBe("2025-03-01");
    expect(result!.end.toISOString().slice(0, 10)).toBe("2025-03-15");
  });

  it("should skip tasks with missing endDate", () => {
    const tasks = [
      makeTask({ id: "1", endDate: undefined }),
      makeTask({ id: "2", startDate: "2025-02-01", endDate: "2025-02-28" }),
    ];
    const result = computeProjectDateRange(tasks);
    expect(result).toBeDefined();
    expect(result!.start.toISOString().slice(0, 10)).toBe("2025-02-01");
  });

  it("should skip tasks with invalid dates", () => {
    const tasks = [
      makeTask({ id: "1", startDate: "not-a-date", endDate: "also-bad" }),
      makeTask({ id: "2", startDate: "2025-06-01", endDate: "2025-06-30" }),
    ];
    const result = computeProjectDateRange(tasks);
    expect(result).toBeDefined();
    expect(result!.start.toISOString().slice(0, 10)).toBe("2025-06-01");
    expect(result!.end.toISOString().slice(0, 10)).toBe("2025-06-30");
  });

  it("should return correct min/max across multiple tasks", () => {
    const tasks = [
      makeTask({ id: "1", startDate: "2025-03-15", endDate: "2025-04-01" }),
      makeTask({ id: "2", startDate: "2025-01-10", endDate: "2025-02-20" }),
      makeTask({ id: "3", startDate: "2025-05-01", endDate: "2025-06-15" }),
    ];
    const result = computeProjectDateRange(tasks);
    expect(result).toBeDefined();
    expect(result!.start.toISOString().slice(0, 10)).toBe("2025-01-10");
    expect(result!.end.toISOString().slice(0, 10)).toBe("2025-06-15");
  });

  it("should handle a single task", () => {
    const tasks = [
      makeTask({ id: "1", startDate: "2025-07-01", endDate: "2025-07-31" }),
    ];
    const result = computeProjectDateRange(tasks);
    expect(result).toBeDefined();
    expect(result!.start.toISOString().slice(0, 10)).toBe("2025-07-01");
    expect(result!.end.toISOString().slice(0, 10)).toBe("2025-07-31");
  });

  it("should return undefined when only invalid tasks exist", () => {
    const tasks = [
      makeTask({ id: "1", startDate: "bad", endDate: "2025-01-01" }),
      makeTask({ id: "2", startDate: "2025-01-01", endDate: "bad" }),
    ];
    expect(computeProjectDateRange(tasks)).toBeUndefined();
  });
});

// ── computeVisibleDateRange ─────────────────────────────────────────────────

describe("computeVisibleDateRange", () => {
  it("should return undefined when scale is null", () => {
    expect(computeVisibleDateRange(null, 0, 800)).toBeUndefined();
  });

  it("should return undefined when viewportWidth is 0", () => {
    const scale = makeScale();
    expect(computeVisibleDateRange(scale, 0, 0)).toBeUndefined();
  });

  it("should return correct date range at scroll position 0", () => {
    const scale = makeScale({
      minDate: "2025-01-01",
      pixelsPerDay: 10,
    });
    // viewport: 0 to 100px = 0 to 10 days
    const result = computeVisibleDateRange(scale, 0, 100);
    expect(result).toBeDefined();
    expect(result!.start.toISOString().slice(0, 10)).toBe("2025-01-01");
    expect(result!.end.toISOString().slice(0, 10)).toBe("2025-01-11");
  });

  it("should offset start date based on scroll position", () => {
    const scale = makeScale({
      minDate: "2025-01-01",
      pixelsPerDay: 10,
    });
    // scrollLeft 50px = 5 days offset, viewport 100px = 10 more days
    const result = computeVisibleDateRange(scale, 50, 100);
    expect(result).toBeDefined();
    expect(result!.start.toISOString().slice(0, 10)).toBe("2025-01-06");
    expect(result!.end.toISOString().slice(0, 10)).toBe("2025-01-16");
  });

  it("should handle fractional day offsets with floor/ceil", () => {
    const scale = makeScale({
      minDate: "2025-01-01",
      pixelsPerDay: 10,
    });
    // scrollLeft 13px = 1.3 days → floor → 1 day offset
    // endOffset 13+100=113px = 11.3 days → ceil → 12 days
    const result = computeVisibleDateRange(scale, 13, 100);
    expect(result).toBeDefined();
    expect(result!.start.toISOString().slice(0, 10)).toBe("2025-01-02");
    expect(result!.end.toISOString().slice(0, 10)).toBe("2025-01-13");
  });
});

// ── computeReadabilityStatus ────────────────────────────────────────────────

describe("computeReadabilityStatus", () => {
  it("should return 'good' at or above the readable threshold", () => {
    const result = computeReadabilityStatus(EXPORT_ZOOM_READABLE_THRESHOLD);
    expect(result.level).toBe("good");
    expect(result.message).toBe("Labels clearly readable");
  });

  it("should return 'good' well above the threshold", () => {
    const result = computeReadabilityStatus(1.0);
    expect(result.level).toBe("good");
  });

  it("should return 'warning' between thresholds", () => {
    const midpoint =
      (EXPORT_ZOOM_READABLE_THRESHOLD + EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD) /
      2;
    const result = computeReadabilityStatus(midpoint);
    expect(result.level).toBe("warning");
    expect(result.message).toBe("Labels may be hard to read");
  });

  it("should return 'warning' at exactly the labels-hidden threshold", () => {
    const result = computeReadabilityStatus(
      EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD
    );
    expect(result.level).toBe("warning");
  });

  it("should return 'critical' below the labels-hidden threshold", () => {
    const result = computeReadabilityStatus(
      EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD - 0.01
    );
    expect(result.level).toBe("critical");
    expect(result.message).toBe("Labels will be hidden");
  });

  it("should return 'critical' at zoom 0", () => {
    const result = computeReadabilityStatus(0);
    expect(result.level).toBe("critical");
  });
});
