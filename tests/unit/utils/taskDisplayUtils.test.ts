/**
 * Tests for computeDisplayTask pure utility.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseISO } from "date-fns";

// Mock holidayService so the holiday test below is deterministic and does not
// depend on network or runtime locale data. computeDisplayTask only reaches
// the service via calculateWorkingDays when `excludeHolidays === true`, so
// existing tests with the weekend-only config are unaffected.
vi.mock("@/services/holidayService", () => ({
  holidayService: {
    setRegion: vi.fn(),
    getHolidayForDateString: vi.fn().mockReturnValue(null),
    getHolidaysInRange: vi.fn().mockReturnValue([]),
  },
}));

import { computeDisplayTask } from "@/utils/taskDisplayUtils";
import { holidayService } from "@/services/holidayService";
import type { Task } from "@/types/chart.types";
import type { WorkingDaysConfig } from "@/types/preferences.types";

const mockGetHolidayForDateString =
  holidayService.getHolidayForDateString as ReturnType<typeof vi.fn>;
const mockGetHolidaysInRange = holidayService.getHolidaysInRange as ReturnType<
  typeof vi.fn
>;
import { tid } from "../../helpers/branded";
import { hex } from "../../helpers/branded";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: tid("task-1"),
    name: "Test Task",
    startDate: "2025-01-10",
    endDate: "2025-01-17",
    duration: 7,
    progress: 50,
    color: hex("#4A90D9"),
    order: 0,
    type: "task",
    metadata: {},
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockGetHolidayForDateString.mockReturnValue(null);
  mockGetHolidaysInRange.mockReturnValue([]);
});

describe("computeDisplayTask", () => {
  it("should recalculate duration for a regular task with both dates", () => {
    const task = makeTask({
      startDate: "2025-01-01",
      endDate: "2025-01-05",
      duration: 999, // stale value
    });

    const result = computeDisplayTask(task, null);

    expect(result.duration).toBe(5);
    expect(result.startDate).toBe("2025-01-01");
    expect(result.endDate).toBe("2025-01-05");
  });

  it("should return original task reference when no dates are set", () => {
    const task = makeTask({ startDate: "", endDate: "", duration: 0 });

    const result = computeDisplayTask(task, null);

    expect(result).toBe(task); // same reference
  });

  it("should return original task when only startDate is set", () => {
    const task = makeTask({ startDate: "2025-01-01", endDate: "" });

    const result = computeDisplayTask(task, null);

    expect(result).toBe(task);
  });

  it("should return original task when only endDate is set", () => {
    const task = makeTask({ startDate: "", endDate: "2025-01-05" });

    const result = computeDisplayTask(task, null);

    expect(result).toBe(task);
  });

  describe("summary tasks", () => {
    it("should derive dates from children", () => {
      const summary = makeTask({
        id: tid("summary-1"),
        type: "summary",
        startDate: "",
        endDate: "",
        duration: 0,
      });
      const child1 = makeTask({
        id: tid("child-1"),
        parent: tid("summary-1"),
        startDate: "2025-01-10",
        endDate: "2025-01-15",
      });
      const child2 = makeTask({
        id: tid("child-2"),
        parent: tid("summary-1"),
        startDate: "2025-01-05",
        endDate: "2025-01-20",
      });

      const tasks = [summary, child1, child2];
      const result = computeDisplayTask(summary, tasks);

      expect(result.startDate).toBe("2025-01-05");
      expect(result.endDate).toBe("2025-01-20");
      expect(result.duration).toBe(16);
    });

    it("should return empty dates and duration 0 when summary has no children with dates", () => {
      const summary = makeTask({
        id: tid("summary-1"),
        type: "summary",
        startDate: "",
        endDate: "",
        duration: 0,
      });

      // Only the summary itself — no children
      const tasks = [summary];
      const result = computeDisplayTask(summary, tasks);

      expect(result.startDate).toBe("");
      expect(result.endDate).toBe("");
      expect(result.duration).toBe(0);
    });

    it("should return empty dates when tasks is null (summary without store data)", () => {
      const summary = makeTask({
        id: tid("summary-1"),
        type: "summary",
        startDate: "",
        endDate: "",
        duration: 0,
      });

      // tasks is null → falls through to no-dates branch → returns original
      const result = computeDisplayTask(summary, null);

      expect(result).toBe(summary);
    });
  });

  describe("working-days display context (#81)", () => {
    const wdConfig: WorkingDaysConfig = {
      excludeSaturday: true,
      excludeSunday: true,
      excludeHolidays: false,
    };

    it("reports duration as working days for a task spanning a weekend", () => {
      // 2025-01-06 (Mon) → 2025-01-12 (Sun) = 7 calendar days, 5 working days
      const task = makeTask({
        startDate: "2025-01-06",
        endDate: "2025-01-12",
        duration: 999,
      });

      const result = computeDisplayTask(task, null, {
        mode: true,
        config: wdConfig,
      });

      expect(result.duration).toBe(5);
    });

    it("falls back to calendar duration when mode is false", () => {
      const task = makeTask({
        startDate: "2025-01-06",
        endDate: "2025-01-12",
      });

      const result = computeDisplayTask(task, null, {
        mode: false,
        config: wdConfig,
      });

      expect(result.duration).toBe(7);
    });

    it("returns 0 WD for a milestone-style single-day task on a weekend", () => {
      // 2025-01-11 is a Saturday → 0 working days under EXCLUDE_WEEKENDS.
      // Milestones in the data model have start === end; the display utility
      // should not crash and should report 0.
      const milestone = makeTask({
        type: "milestone",
        startDate: "2025-01-11",
        endDate: "2025-01-11",
      });

      const result = computeDisplayTask(milestone, null, {
        mode: true,
        config: wdConfig,
      });

      expect(result.duration).toBe(0);
    });

    it("excludes a holiday in the span when excludeHolidays is true", () => {
      // 2025-01-06 (Mon) → 2025-01-10 (Fri) = 5 working days normally.
      // Mock 2025-01-08 as a holiday → expected 4 WD.
      mockGetHolidayForDateString.mockImplementation((dateStr: string) =>
        dateStr === "2025-01-08"
          ? { date: parseISO("2025-01-08"), name: "Test", type: "public" }
          : null
      );
      mockGetHolidaysInRange.mockReturnValue([
        { date: parseISO("2025-01-08"), name: "Test", type: "public" as const },
      ]);

      const task = makeTask({
        startDate: "2025-01-06",
        endDate: "2025-01-10",
      });

      const result = computeDisplayTask(task, null, {
        mode: true,
        config: {
          excludeSaturday: true,
          excludeSunday: true,
          excludeHolidays: true,
        },
        region: "US",
      });

      expect(result.duration).toBe(4);
    });

    it("computes parent WD duration over the parent's calendar span (D5), not sum of child WDs", () => {
      // Parent span: 2025-01-06 (Mon) → 2025-01-19 (Sun) = 14 calendar days
      // Working days in that span (Mon-Fri only): weeks of Jan 6 and Jan 13 → 10 WD
      // Sum of child WDs would be 5 + 5 = 10 here as well, so use a configuration
      // that distinguishes them: child gaps. Two children with a weekend gap show
      // the same WD as the parent calendar span (10), proving the rollup walks
      // the parent's span, not the children's individual WDs.
      const summary = makeTask({
        id: tid("summary-1"),
        type: "summary",
        startDate: "",
        endDate: "",
        duration: 0,
      });
      const child1 = makeTask({
        id: tid("child-1"),
        parent: tid("summary-1"),
        startDate: "2025-01-06", // Mon
        endDate: "2025-01-10", // Fri (5 WD)
      });
      const child2 = makeTask({
        id: tid("child-2"),
        parent: tid("summary-1"),
        startDate: "2025-01-13", // Mon
        endDate: "2025-01-19", // Sun (5 WD: Mon–Fri)
      });

      const result = computeDisplayTask(
        summary,
        [summary, child1, child2],
        { mode: true, config: wdConfig }
      );

      expect(result.startDate).toBe("2025-01-06");
      expect(result.endDate).toBe("2025-01-19");
      // Parent calendar span Mon Jan 6 → Sun Jan 19 = 10 working days
      expect(result.duration).toBe(10);
    });
  });
});
