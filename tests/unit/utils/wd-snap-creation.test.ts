/**
 * Tests for working-day snapping in task creation/insertion helpers.
 * Covers computeAppendDates and computeInsertionDates with WD context.
 */

import { describe, it, expect } from "vitest";
import { computeAppendDates } from "@/hooks/useNewTaskCreation";
import { computeInsertionDates } from "@/store/slices/insertionActions";
import type { Task } from "@/types/chart.types";
import type { WorkingDaysContext } from "@/utils/workingDaysCalculator";
import { toTaskId } from "@/types/branded.types";
import { toHexColor } from "@/types/branded.types";

const WD_CTX: WorkingDaysContext = {
  enabled: true,
  config: {
    excludeSaturday: true,
    excludeSunday: true,
    excludeHolidays: false,
  },
};

const DISABLED_CTX: WorkingDaysContext = {
  enabled: false,
  config: {
    excludeSaturday: false,
    excludeSunday: false,
    excludeHolidays: false,
  },
};

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: toTaskId("ref-task"),
    name: "Reference",
    startDate: "2025-01-06", // Monday
    endDate: "2025-01-10", // Friday
    duration: 5,
    progress: 0,
    color: toHexColor("#4A90D9"),
    order: 0,
    metadata: {},
    type: "task",
    ...overrides,
  };
}

// =============================================================================
// computeAppendDates
// =============================================================================

describe("computeAppendDates with WD snap", () => {
  // DEFAULT_TASK_DURATION = 7

  it("snaps start forward and computes end via working days", () => {
    // Last task ends Friday 2025-01-10 → new start = Sat Jan 11 → snap to Mon Jan 13
    const result = computeAppendDates({ endDate: "2025-01-10" }, WD_CTX);
    expect(result.startDate).toBe("2025-01-13"); // Monday
    // End = 7 working days from Mon Jan 13 = Tue Jan 21
    // (Mon-Fri = 5wd, next Mon = 6wd, Tue = 7wd)
    expect(result.endDate).toBe("2025-01-21");
    // Calendar duration: Jan 13 to Jan 21 = 9 days
    expect(result.duration).toBe(9);
  });

  it("returns DEFAULT_TASK_DURATION when WD mode is off", () => {
    const result = computeAppendDates({ endDate: "2025-01-10" }, DISABLED_CTX);
    expect(result.startDate).toBe("2025-01-11"); // unsnapped
    expect(result.duration).toBe(7); // DEFAULT_TASK_DURATION
  });

  it("returns DEFAULT_TASK_DURATION when no ctx provided", () => {
    const result = computeAppendDates({ endDate: "2025-01-10" });
    expect(result.startDate).toBe("2025-01-11");
    expect(result.duration).toBe(7);
  });

  it("handles no last task (starts from today)", () => {
    const result = computeAppendDates(null, DISABLED_CTX);
    expect(result.startDate).toBeTruthy();
    expect(result.duration).toBe(7);
  });
});

// =============================================================================
// computeInsertionDates
// =============================================================================

describe("computeInsertionDates with WD snap", () => {
  const refTask = makeTask();

  describe("insert below", () => {
    it("snaps start forward and computes end via working days", () => {
      // Ref ends Fri Jan 10 → new start = Sat Jan 11 → snap to Mon Jan 13
      const result = computeInsertionDates(refTask, "below", 0, WD_CTX);
      expect(result.startDate).toBe("2025-01-13"); // Monday
      // End = 7wd from Mon Jan 13 = Tue Jan 21
      expect(result.endDate).toBe("2025-01-21");
      // Calendar duration: Jan 13 to Jan 21 = 9 days
      expect(result.duration).toBe(9);
    });

    it("does not snap when WD mode is off", () => {
      const result = computeInsertionDates(refTask, "below", 0, DISABLED_CTX);
      expect(result.startDate).toBe("2025-01-11"); // Sat, unsnapped
      expect(result.duration).toBe(7); // DEFAULT_TASK_DURATION
    });
  });

  describe("insert above", () => {
    it("snaps end backward and computes start via subtractWorkingDays", () => {
      // Ref starts Mon Jan 6 → end = Jan 5 (Sun) → snap backward to Fri Jan 3
      const result = computeInsertionDates(refTask, "above", 0, WD_CTX);
      expect(result.endDate).toBe("2025-01-03"); // Friday
      // Start = 7wd backward from Fri Jan 3:
      // Fri=1, Thu=2, Wed=3, Tue=4, Mon=5, (skip Sun+Sat), Fri Dec 27=6, Thu Dec 26=7
      // subtractWorkingDays("2025-01-03", 7) = Thu 2024-12-26
      // Wait — subtractWorkingDays counts endDate as day 1 if it's a working day.
      // Fri Jan 3 = day 1, Thu=2, Wed=3, Tue=4, Mon Dec 30=5, skip Sat+Sun, Fri Dec 26=6, Thu Dec 25=7
      // But Dec 25 is Christmas — not excluded since excludeHolidays is false.
      // So subtractWorkingDays("2025-01-03", 7) = 2024-12-26
      expect(result.startDate).toBe("2024-12-26");
      // Calendar duration: Dec 26 to Jan 3 = 9 days
      expect(result.duration).toBe(9);
    });

    it("does not snap when WD mode is off", () => {
      const result = computeInsertionDates(refTask, "above", 0, DISABLED_CTX);
      expect(result.endDate).toBe("2025-01-05"); // Sun, unsnapped
      expect(result.duration).toBe(7); // DEFAULT_TASK_DURATION
    });

    it("stays before reference task (no overlap)", () => {
      const result = computeInsertionDates(refTask, "above", 0, WD_CTX);
      expect(result.endDate < refTask.startDate).toBe(true);
    });
  });
});
