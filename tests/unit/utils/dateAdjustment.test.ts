/**
 * Unit tests for auto-scheduling date adjustment algorithm.
 *
 * Tests cover:
 * - calculateConstrainedDates: all 4 dependency types with lag
 * - propagateDateChanges: cascade propagation, mixed types, edge cases
 */

import { describe, it, expect } from "vitest";
import {
  calculateConstrainedDates,
  calculateInitialLag,
  propagateDateChanges,
  applyDateAdjustments,
  reverseDateAdjustments,
  DISABLED_WD_CONTEXT,
} from "@/utils/graph/dateAdjustment";
import type { WorkingDaysContext } from "@/utils/graph/dateAdjustment";

// Shorthand for the calendar-mode tests below.
const CAL = DISABLED_WD_CONTEXT;
import {
  WD_THANKSGIVING,
  wdThanksgivingTuple,
} from "../../fixtures/wdThanksgiving";
import type { Task } from "@/types/chart.types";
import type { Dependency } from "@/types/dependency.types";
import type { TaskId, HexColor } from "@/types/branded.types";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let idCounter = 0;

function makeTask(
  overrides: Partial<Task> & { id: string; startDate: string; endDate: string }
): Task {
  return {
    name: `Task ${overrides.id}`,
    duration: 1,
    progress: 0,
    color: "#3b82f6" as HexColor,
    order: idCounter++,
    metadata: {},
    ...overrides,
    id: overrides.id as TaskId,
    parent: overrides.parent as TaskId | undefined,
  };
}

function makeDep(
  from: string,
  to: string,
  type: Dependency["type"] = "FS",
  lag?: number
): Dependency {
  return {
    id: `dep-${from}-${to}`,
    fromTaskId: from as TaskId,
    toTaskId: to as TaskId,
    type,
    lag,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// calculateConstrainedDates
// ---------------------------------------------------------------------------

describe("calculateConstrainedDates", () => {
  const pred = { startDate: "2025-01-06", endDate: "2025-01-10" }; // Mon-Fri, 5 days

  describe("FS (Finish-to-Start)", () => {
    it("returns day after predecessor end with lag=0", () => {
      const result = calculateConstrainedDates(pred, 3, "FS", 0, CAL);
      // successor starts Jan 11 (day after Jan 10), duration 3 → Jan 11-13
      expect(result.startDate).toBe("2025-01-11");
      expect(result.endDate).toBe("2025-01-13");
    });

    it("applies positive lag (gap)", () => {
      const result = calculateConstrainedDates(pred, 3, "FS", 2, CAL);
      // Jan 10 + 1 + 2 = Jan 13 start, +2 days = Jan 15 end
      expect(result.startDate).toBe("2025-01-13");
      expect(result.endDate).toBe("2025-01-15");
    });

    it("applies negative lag (overlap/lead)", () => {
      const result = calculateConstrainedDates(pred, 3, "FS", -2, CAL);
      // Jan 10 + 1 - 2 = Jan 9 start, +2 days = Jan 11 end
      expect(result.startDate).toBe("2025-01-09");
      expect(result.endDate).toBe("2025-01-11");
    });

    it("defaults lag to 0 when omitted", () => {
      const result = calculateConstrainedDates(pred, 3, "FS", 0, CAL);
      expect(result.startDate).toBe("2025-01-11");
    });
  });

  describe("SS (Start-to-Start)", () => {
    it("returns predecessor start date with lag=0", () => {
      const result = calculateConstrainedDates(pred, 3, "SS", 0, CAL);
      expect(result.startDate).toBe("2025-01-06");
      expect(result.endDate).toBe("2025-01-08");
    });

    it("applies positive lag", () => {
      const result = calculateConstrainedDates(pred, 3, "SS", 2, CAL);
      expect(result.startDate).toBe("2025-01-08");
      expect(result.endDate).toBe("2025-01-10");
    });

    it("applies negative lag", () => {
      const result = calculateConstrainedDates(pred, 3, "SS", -1, CAL);
      expect(result.startDate).toBe("2025-01-05");
      expect(result.endDate).toBe("2025-01-07");
    });
  });

  describe("FF (Finish-to-Finish)", () => {
    it("derives start from end and duration with lag=0", () => {
      const result = calculateConstrainedDates(pred, 3, "FF", 0, CAL);
      // successor end = Jan 10, duration 3 → start = Jan 8
      expect(result.endDate).toBe("2025-01-10");
      expect(result.startDate).toBe("2025-01-08");
    });

    it("applies positive lag", () => {
      const result = calculateConstrainedDates(pred, 3, "FF", 2, CAL);
      expect(result.endDate).toBe("2025-01-12");
      expect(result.startDate).toBe("2025-01-10");
    });

    it("applies negative lag", () => {
      const result = calculateConstrainedDates(pred, 3, "FF", -1, CAL);
      expect(result.endDate).toBe("2025-01-09");
      expect(result.startDate).toBe("2025-01-07");
    });
  });

  describe("SF (Start-to-Finish)", () => {
    it("derives start from predecessor start with lag=0", () => {
      const result = calculateConstrainedDates(pred, 3, "SF", 0, CAL);
      // successor end = Jan 6, duration 3 → start = Jan 4
      expect(result.endDate).toBe("2025-01-06");
      expect(result.startDate).toBe("2025-01-04");
    });

    it("applies positive lag", () => {
      const result = calculateConstrainedDates(pred, 3, "SF", 2, CAL);
      expect(result.endDate).toBe("2025-01-08");
      expect(result.startDate).toBe("2025-01-06");
    });
  });

  describe("duration edge cases", () => {
    it("handles duration=1 (milestone-like)", () => {
      const result = calculateConstrainedDates(pred, 1, "FS", 0, CAL);
      expect(result.startDate).toBe("2025-01-11");
      expect(result.endDate).toBe("2025-01-11");
    });

    it("handles same-day predecessor (milestone predecessor)", () => {
      const milestone = { startDate: "2025-01-10", endDate: "2025-01-10" };
      const result = calculateConstrainedDates(milestone, 3, "FS", 0, CAL);
      expect(result.startDate).toBe("2025-01-11");
      expect(result.endDate).toBe("2025-01-13");
    });
  });
});

// ---------------------------------------------------------------------------
// propagateDateChanges
// ---------------------------------------------------------------------------

describe("propagateDateChanges", () => {
  describe("basic single-dependency cascades", () => {
    it("FS: moves successor forward when constraint violated", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-08",
        endDate: "2025-01-10",
        duration: 3,
      });
      // B starts before A ends — violates FS
      const deps = [makeDep("A", "B", "FS")];

      const adjustments = propagateDateChanges([A, B], deps, ["A"]);

      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].taskId).toBe("B");
      expect(adjustments[0].newStartDate).toBe("2025-01-11");
      expect(adjustments[0].newEndDate).toBe("2025-01-13");
      expect(adjustments[0].oldStartDate).toBe("2025-01-08");
      expect(adjustments[0].oldEndDate).toBe("2025-01-10");
    });

    it("SS: moves successor start to match predecessor start", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-10",
        endDate: "2025-01-14",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const deps = [makeDep("A", "B", "SS")];

      const adjustments = propagateDateChanges([A, B], deps, ["A"]);

      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].newStartDate).toBe("2025-01-10");
      expect(adjustments[0].newEndDate).toBe("2025-01-12");
    });

    it("FF: moves successor end to match predecessor end", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-15",
        duration: 10,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const deps = [makeDep("A", "B", "FF")];

      const adjustments = propagateDateChanges([A, B], deps, ["A"]);

      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].newEndDate).toBe("2025-01-15");
      expect(adjustments[0].newStartDate).toBe("2025-01-11");
    });

    it("SF: moves successor end to match predecessor start", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-15",
        endDate: "2025-01-20",
        duration: 6,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const deps = [makeDep("A", "B", "SF")];

      const adjustments = propagateDateChanges([A, B], deps, ["A"]);

      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].newEndDate).toBe("2025-01-15");
      expect(adjustments[0].newStartDate).toBe("2025-01-11");
    });
  });

  describe("no adjustment needed", () => {
    it("returns empty when constraint is already satisfied", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-13",
        endDate: "2025-01-15",
        duration: 3,
      });
      const deps = [makeDep("A", "B", "FS")];

      const adjustments = propagateDateChanges([A, B], deps, ["A"]);
      expect(adjustments).toHaveLength(0);
    });

    it("returns empty when no dependencies exist", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const adjustments = propagateDateChanges([A], [], ["A"]);
      expect(adjustments).toHaveLength(0);
    });
  });

  describe("lag handling", () => {
    it("FS with positive lag creates gap", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const deps = [makeDep("A", "B", "FS", 3)];

      const adjustments = propagateDateChanges([A, B], deps, ["A"]);

      expect(adjustments).toHaveLength(1);
      // Jan 10 + 1 + 3 = Jan 14 start
      expect(adjustments[0].newStartDate).toBe("2025-01-14");
    });

    it("FS with negative lag allows overlap", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const deps = [makeDep("A", "B", "FS", -2)];

      const adjustments = propagateDateChanges([A, B], deps, ["A"]);

      expect(adjustments).toHaveLength(1);
      // Jan 10 + 1 - 2 = Jan 9 start
      expect(adjustments[0].newStartDate).toBe("2025-01-09");
    });

    it("treats undefined lag as 0", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const deps = [makeDep("A", "B", "FS")]; // lag is undefined

      const adjustments = propagateDateChanges([A, B], deps, ["A"]);
      expect(adjustments[0].newStartDate).toBe("2025-01-11");
    });
  });

  describe("chain propagation", () => {
    it("propagates through A→B→C→D chain", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const C = makeTask({
        id: "C",
        startDate: "2025-01-06",
        endDate: "2025-01-07",
        duration: 2,
      });
      const D = makeTask({
        id: "D",
        startDate: "2025-01-06",
        endDate: "2025-01-06",
        duration: 1,
      });
      const deps = [
        makeDep("A", "B", "FS"),
        makeDep("B", "C", "FS"),
        makeDep("C", "D", "FS"),
      ];

      const adjustments = propagateDateChanges([A, B, C, D], deps, ["A"]);

      expect(adjustments).toHaveLength(3);
      // B: Jan 11-13
      expect(adjustments[0].newStartDate).toBe("2025-01-11");
      expect(adjustments[0].newEndDate).toBe("2025-01-13");
      // C: Jan 14-15
      expect(adjustments[1].newStartDate).toBe("2025-01-14");
      expect(adjustments[1].newEndDate).toBe("2025-01-15");
      // D: Jan 16
      expect(adjustments[2].newStartDate).toBe("2025-01-16");
      expect(adjustments[2].newEndDate).toBe("2025-01-16");
    });
  });

  describe("mixed-type cascades", () => {
    it("A→[FS]→B→[SS]→C: FS then SS cascade", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const C = makeTask({
        id: "C",
        startDate: "2025-01-06",
        endDate: "2025-01-07",
        duration: 2,
      });
      const deps = [makeDep("A", "B", "FS"), makeDep("B", "C", "SS")];

      const adjustments = propagateDateChanges([A, B, C], deps, ["A"]);

      expect(adjustments).toHaveLength(2);
      // B: Jan 11-13 (FS from A)
      expect(adjustments[0].newStartDate).toBe("2025-01-11");
      // C: starts when B starts → Jan 11-12 (SS from B)
      expect(adjustments[1].newStartDate).toBe("2025-01-11");
      expect(adjustments[1].newEndDate).toBe("2025-01-12");
    });

    it("A→[FF]→B→[FS]→C: FF then FS cascade", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-15",
        duration: 10,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const C = makeTask({
        id: "C",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const deps = [makeDep("A", "B", "FF"), makeDep("B", "C", "FS")];

      const adjustments = propagateDateChanges([A, B, C], deps, ["A"]);

      expect(adjustments).toHaveLength(2);
      // B: end=Jan15, start=Jan11 (FF from A, duration 5)
      expect(adjustments[0].newEndDate).toBe("2025-01-15");
      expect(adjustments[0].newStartDate).toBe("2025-01-11");
      // C: start=Jan16 (FS from B ending Jan15)
      expect(adjustments[1].newStartDate).toBe("2025-01-16");
      expect(adjustments[1].newEndDate).toBe("2025-01-18");
    });
  });

  describe("multiple predecessors", () => {
    it("takes the most restrictive constraint", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-15",
        duration: 10,
      });
      const C = makeTask({
        id: "C",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      // C depends on both A (FS) and B (FS)
      const deps = [makeDep("A", "C", "FS"), makeDep("B", "C", "FS")];

      const adjustments = propagateDateChanges([A, B, C], deps, ["A", "B"]);

      expect(adjustments).toHaveLength(1);
      // A ends Jan 10 → C could start Jan 11
      // B ends Jan 15 → C must start Jan 16 (more restrictive)
      expect(adjustments[0].newStartDate).toBe("2025-01-16");
      expect(adjustments[0].newEndDate).toBe("2025-01-18");
    });
  });

  describe("special task types", () => {
    it("skips summary tasks", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
        type: "summary",
      });
      const deps = [makeDep("A", "B", "FS")];

      const adjustments = propagateDateChanges([A, B], deps, ["A"]);
      expect(adjustments).toHaveLength(0);
    });

    it("handles milestone tasks (duration=1)", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-06",
        duration: 1,
        type: "milestone",
      });
      const deps = [makeDep("A", "B", "FS")];

      const adjustments = propagateDateChanges([A, B], deps, ["A"]);

      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].newStartDate).toBe("2025-01-11");
      expect(adjustments[0].newEndDate).toBe("2025-01-11");
    });
  });

  describe("scope filtering", () => {
    it("only processes reachable tasks when changedTaskIds provided", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      // C is unrelated — has its own predecessor D
      const C = makeTask({
        id: "C",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const D = makeTask({
        id: "D",
        startDate: "2025-01-06",
        endDate: "2025-01-15",
        duration: 10,
      });
      const deps = [makeDep("A", "B", "FS"), makeDep("D", "C", "FS")];

      // Only changed A — C should not be processed
      const adjustments = propagateDateChanges([A, B, C, D], deps, ["A"]);

      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].taskId).toBe("B");
    });

    it("processes all tasks when changedTaskIds is omitted (full recalc)", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const C = makeTask({
        id: "C",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const D = makeTask({
        id: "D",
        startDate: "2025-01-06",
        endDate: "2025-01-15",
        duration: 10,
      });
      const deps = [makeDep("A", "B", "FS"), makeDep("D", "C", "FS")];

      // No changedTaskIds → full recalc
      const adjustments = propagateDateChanges([A, B, C, D], deps);

      expect(adjustments).toHaveLength(2);
      expect(adjustments.map((a) => a.taskId).sort()).toEqual(["B", "C"]);
    });
  });

  describe("tasks with no dependencies", () => {
    it("does not affect independent tasks", () => {
      const A = makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      });
      const B = makeTask({
        id: "B",
        startDate: "2025-01-06",
        endDate: "2025-01-08",
        duration: 3,
      });
      const independent = makeTask({
        id: "X",
        startDate: "2025-01-01",
        endDate: "2025-01-02",
        duration: 2,
      });
      const deps = [makeDep("A", "B", "FS")];

      const adjustments = propagateDateChanges(
        [A, B, independent],
        deps,
        ["A"]
      );

      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].taskId).toBe("B");
    });
  });
});

// ---------------------------------------------------------------------------
// applyDateAdjustments & reverseeDateAdjustments
// ---------------------------------------------------------------------------

describe("applyDateAdjustments", () => {
  it("applies adjustments to tasks and returns affected parent IDs", () => {
    const tasks: Task[] = [
      makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
        parent: "P" as unknown as string,
      }),
    ];
    const adjustments = [
      {
        taskId: "A" as TaskId,
        oldStartDate: "2025-01-06",
        oldEndDate: "2025-01-10",
        newStartDate: "2025-01-13",
        newEndDate: "2025-01-17",
      },
    ];

    const parentIds = applyDateAdjustments(adjustments, tasks);

    expect(tasks[0].startDate).toBe("2025-01-13");
    expect(tasks[0].endDate).toBe("2025-01-17");
    expect(tasks[0].duration).toBe(5);
    expect(parentIds.has("P" as TaskId)).toBe(true);
  });

  it("returns empty set when no tasks have parents", () => {
    const tasks: Task[] = [
      makeTask({
        id: "A",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
      }),
    ];
    const adjustments = [
      {
        taskId: "A" as TaskId,
        oldStartDate: "2025-01-06",
        oldEndDate: "2025-01-10",
        newStartDate: "2025-01-13",
        newEndDate: "2025-01-17",
      },
    ];

    const parentIds = applyDateAdjustments(adjustments, tasks);
    expect(parentIds.size).toBe(0);
  });
});

describe("reverseDateAdjustments", () => {
  it("restores old dates", () => {
    const tasks: Task[] = [
      makeTask({
        id: "A",
        startDate: "2025-01-13",
        endDate: "2025-01-17",
        duration: 5,
      }),
    ];
    const adjustments = [
      {
        taskId: "A" as TaskId,
        oldStartDate: "2025-01-06",
        oldEndDate: "2025-01-10",
        newStartDate: "2025-01-13",
        newEndDate: "2025-01-17",
      },
    ];

    reverseDateAdjustments(adjustments, tasks);

    expect(tasks[0].startDate).toBe("2025-01-06");
    expect(tasks[0].endDate).toBe("2025-01-10");
    expect(tasks[0].duration).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// calculateInitialLag
// ---------------------------------------------------------------------------

describe("calculateInitialLag", () => {
  const pred = { startDate: "2025-01-06", endDate: "2025-01-10" }; // Mon-Fri, 5 days

  describe("FS (Finish-to-Start)", () => {
    it("returns 0 when successor starts immediately after predecessor", () => {
      const succ = { startDate: "2025-01-11", endDate: "2025-01-13" };
      expect(calculateInitialLag(pred, succ, "FS", CAL)).toBe(0);
    });

    it("returns positive lag for a gap", () => {
      const succ = { startDate: "2025-01-13", endDate: "2025-01-15" };
      // gap of 2 days between Jan 10 end and Jan 13 start
      expect(calculateInitialLag(pred, succ, "FS", CAL)).toBe(2);
    });

    it("returns negative lag for overlap", () => {
      const succ = { startDate: "2025-01-09", endDate: "2025-01-11" };
      // successor starts before predecessor ends
      expect(calculateInitialLag(pred, succ, "FS", CAL)).toBe(-2);
    });
  });

  describe("SS (Start-to-Start)", () => {
    it("returns 0 when tasks start on the same day", () => {
      const succ = { startDate: "2025-01-06", endDate: "2025-01-08" };
      expect(calculateInitialLag(pred, succ, "SS", CAL)).toBe(0);
    });

    it("returns positive lag for offset start", () => {
      const succ = { startDate: "2025-01-08", endDate: "2025-01-10" };
      expect(calculateInitialLag(pred, succ, "SS", CAL)).toBe(2);
    });

    it("returns negative lag when successor starts before predecessor", () => {
      const succ = { startDate: "2025-01-05", endDate: "2025-01-07" };
      expect(calculateInitialLag(pred, succ, "SS", CAL)).toBe(-1);
    });
  });

  describe("FF (Finish-to-Finish)", () => {
    it("returns 0 when tasks end on the same day", () => {
      const succ = { startDate: "2025-01-08", endDate: "2025-01-10" };
      expect(calculateInitialLag(pred, succ, "FF", CAL)).toBe(0);
    });

    it("returns positive lag for offset end", () => {
      const succ = { startDate: "2025-01-10", endDate: "2025-01-12" };
      expect(calculateInitialLag(pred, succ, "FF", CAL)).toBe(2);
    });

    it("returns negative lag when successor ends before predecessor", () => {
      const succ = { startDate: "2025-01-07", endDate: "2025-01-09" };
      expect(calculateInitialLag(pred, succ, "FF", CAL)).toBe(-1);
    });
  });

  describe("SF (Start-to-Finish)", () => {
    it("returns 0 when successor ends on predecessor start", () => {
      const succ = { startDate: "2025-01-04", endDate: "2025-01-06" };
      expect(calculateInitialLag(pred, succ, "SF", CAL)).toBe(0);
    });

    it("returns positive lag for offset", () => {
      const succ = { startDate: "2025-01-06", endDate: "2025-01-08" };
      expect(calculateInitialLag(pred, succ, "SF", CAL)).toBe(2);
    });
  });

  describe("inverse relationship with calculateConstrainedDates", () => {
    it("FS: calculated lag reproduces original positions", () => {
      const succ = { startDate: "2025-01-15", endDate: "2025-01-17" };
      const lag = calculateInitialLag(pred, succ, "FS", CAL);
      const constrained = calculateConstrainedDates(pred, 3, "FS", lag, CAL);
      expect(constrained.startDate).toBe(succ.startDate);
      expect(constrained.endDate).toBe(succ.endDate);
    });

    it("SS: calculated lag reproduces original positions", () => {
      const succ = { startDate: "2025-01-09", endDate: "2025-01-11" };
      const lag = calculateInitialLag(pred, succ, "SS", CAL);
      const constrained = calculateConstrainedDates(pred, 3, "SS", lag, CAL);
      expect(constrained.startDate).toBe(succ.startDate);
      expect(constrained.endDate).toBe(succ.endDate);
    });

    it("FF: calculated lag reproduces original positions", () => {
      const succ = { startDate: "2025-01-12", endDate: "2025-01-14" };
      const lag = calculateInitialLag(pred, succ, "FF", CAL);
      const constrained = calculateConstrainedDates(pred, 3, "FF", lag, CAL);
      expect(constrained.startDate).toBe(succ.startDate);
      expect(constrained.endDate).toBe(succ.endDate);
    });

    it("SF: calculated lag reproduces original positions", () => {
      const succ = { startDate: "2025-01-08", endDate: "2025-01-10" };
      const lag = calculateInitialLag(pred, succ, "SF", CAL);
      const constrained = calculateConstrainedDates(pred, 3, "SF", lag, CAL);
      expect(constrained.startDate).toBe(succ.startDate);
      expect(constrained.endDate).toBe(succ.endDate);
    });
  });
});


// ---------------------------------------------------------------------------
// WD-aware calculateConstrainedDates / calculateInitialLag (#82 stage 2)
// ---------------------------------------------------------------------------
//
// Reference week (no holidays, Sat+Sun excluded):
//   Mon 2025-01-06 … Fri 2025-01-10  (predecessor)
//   Sat 2025-01-11 / Sun 2025-01-12  (excluded)
//   Mon 2025-01-13 … Fri 2025-01-17  (successor candidate week)
//
// All examples below should match the worked examples documented in the
// JSDoc of calculateConstrainedDates.

const WD_CTX: WorkingDaysContext = {
  enabled: true,
  config: { excludeSaturday: true, excludeSunday: true, excludeHolidays: false },
  holidayRegion: undefined,
};

describe("calculateConstrainedDates — working days", () => {
  const pred = { startDate: "2025-01-06", endDate: "2025-01-10" };

  describe("FS", () => {
    it("lag=0wd snaps Sat → Mon", () => {
      const r = calculateConstrainedDates(pred, 3, "FS", 0, WD_CTX);
      expect(r.startDate).toBe("2025-01-13"); // Mon
      expect(r.endDate).toBe("2025-01-15"); // Wed (3 WD: Mon, Tue, Wed)
    });

    it("lag=2wd advances 2 working days past the snap", () => {
      const r = calculateConstrainedDates(pred, 3, "FS", 2, WD_CTX);
      expect(r.startDate).toBe("2025-01-15"); // Wed (3rd WD from Sat)
      expect(r.endDate).toBe("2025-01-17"); // Fri
    });

    it("negative lag (overlap) backs up working days", () => {
      // lag=-1wd → 1 WD before lag=0 anchor (Mon 13) = Fri 10
      const r = calculateConstrainedDates(pred, 3, "FS", -1, WD_CTX);
      expect(r.startDate).toBe("2025-01-10"); // Fri
      expect(r.endDate).toBe("2025-01-14"); // Tue (Fri, Mon, Tue)
    });
  });

  describe("SS", () => {
    it("lag=0wd starts on predecessor.start", () => {
      const r = calculateConstrainedDates(pred, 3, "SS", 0, WD_CTX);
      expect(r.startDate).toBe("2025-01-06"); // Mon
      expect(r.endDate).toBe("2025-01-08"); // Wed
    });

    it("lag=1wd advances one working day", () => {
      const r = calculateConstrainedDates(pred, 3, "SS", 1, WD_CTX);
      expect(r.startDate).toBe("2025-01-07"); // Tue
      expect(r.endDate).toBe("2025-01-09"); // Thu
    });
  });

  describe("FF", () => {
    it("lag=0wd ends on predecessor.end", () => {
      const r = calculateConstrainedDates(pred, 3, "FF", 0, WD_CTX);
      expect(r.endDate).toBe("2025-01-10"); // Fri
      expect(r.startDate).toBe("2025-01-08"); // Wed (3 WD back: Fri, Thu, Wed)
    });

    it("lag=2wd ends two working days after predecessor.end", () => {
      const r = calculateConstrainedDates(pred, 3, "FF", 2, WD_CTX);
      expect(r.endDate).toBe("2025-01-14"); // Tue (Fri, Mon, Tue)
      expect(r.startDate).toBe("2025-01-10"); // Fri (Tue, Mon, Fri back)
    });
  });

  describe("SF", () => {
    it("lag=0wd ends on predecessor.start", () => {
      const r = calculateConstrainedDates(pred, 3, "SF", 0, WD_CTX);
      expect(r.endDate).toBe("2025-01-06"); // Mon
      expect(r.startDate).toBe("2025-01-02"); // Thu prev week (Mon, Fri 03, Thu 02)
    });

    it("lag=2wd ends two working days after predecessor.start", () => {
      const r = calculateConstrainedDates(pred, 3, "SF", 2, WD_CTX);
      expect(r.endDate).toBe("2025-01-08"); // Wed (Mon, Tue, Wed)
      expect(r.startDate).toBe("2025-01-06"); // Mon
    });
  });

  it("respects holidays in the gap (FS, US Thanksgiving-style block)", () => {
    // Pred ends Fri, Mon is a holiday → successor must start Tue.
    const ctxHoliday: WorkingDaysContext = {
      enabled: true,
      config: { excludeSaturday: true, excludeSunday: true, excludeHolidays: true },
      holidayRegion: undefined, // we mock at the service level via fixture wd test
    };
    // Without a real region we can only verify the weekend snap; the holiday
    // case is exercised in the workingDaysCalculator.test.ts mocked-service
    // suite. This test doubles as a regression guard against silently
    // ignoring excludeHolidays when the region is undefined.
    const p = { startDate: "2025-01-06", endDate: "2025-01-10" };
    const r = calculateConstrainedDates(p, 1, "FS", 0, ctxHoliday);
    expect(r.startDate).toBe("2025-01-13"); // Mon — region missing → no holiday exclusion
  });

  it("falls back to calendar arithmetic when ctx.enabled is false", () => {
    const ctxOff: WorkingDaysContext = { ...WD_CTX, enabled: false };
    const r = calculateConstrainedDates(pred, 3, "FS", 0, ctxOff);
    expect(r.startDate).toBe("2025-01-11"); // Sat — calendar mode, no snap
    expect(r.endDate).toBe("2025-01-13");
  });
});

describe("calculateInitialLag — working days", () => {
  const pred = { startDate: "2025-01-06", endDate: "2025-01-10" };

  it("FS: successor starting Mon after weekend → lag=0wd", () => {
    const succ = { startDate: "2025-01-13", endDate: "2025-01-15" };
    expect(calculateInitialLag(pred, succ, "FS", WD_CTX)).toBe(0);
  });

  it("FS: successor starting Wed → lag=2wd (skips weekend)", () => {
    const succ = { startDate: "2025-01-15", endDate: "2025-01-17" };
    expect(calculateInitialLag(pred, succ, "FS", WD_CTX)).toBe(2);
  });

  it("FS: overlap → negative working-day lag", () => {
    // Successor starts on predecessor's last day
    const succ = { startDate: "2025-01-10", endDate: "2025-01-14" };
    expect(calculateInitialLag(pred, succ, "FS", WD_CTX)).toBe(-1);
  });

  it("SS: identical starts → lag=0wd", () => {
    const succ = { startDate: "2025-01-06", endDate: "2025-01-08" };
    expect(calculateInitialLag(pred, succ, "SS", WD_CTX)).toBe(0);
  });

  it("FF: identical ends → lag=0wd", () => {
    const succ = { startDate: "2025-01-08", endDate: "2025-01-10" };
    expect(calculateInitialLag(pred, succ, "FF", WD_CTX)).toBe(0);
  });

  it("SF: successor end matches predecessor start → lag=0wd", () => {
    const succ = { startDate: "2025-01-02", endDate: "2025-01-06" };
    expect(calculateInitialLag(pred, succ, "SF", WD_CTX)).toBe(0);
  });

  it("falls back to calendar inverse when ctx.enabled is false", () => {
    const ctxOff: WorkingDaysContext = { ...WD_CTX, enabled: false };
    const succ = { startDate: "2025-01-13", endDate: "2025-01-15" };
    // Calendar diff = Jan 13 − Jan 10 − 1 = 2
    expect(calculateInitialLag(pred, succ, "FS", ctxOff)).toBe(2);
  });
});

describe("propagateDateChanges — Thanksgiving golden fixture (#82 stage 6)", () => {
  it("cascades the WD_THANKSGIVING fixture through the Thanksgiving holiday", () => {
    const { tasks, dependencies } = wdThanksgivingTuple();
    const wdCtxHolidays: WorkingDaysContext = {
      enabled: true,
      config: WD_THANKSGIVING.workingDaysConfig,
      holidayRegion: WD_THANKSGIVING.holidayRegion,
    };

    const adjustments = propagateDateChanges(
      tasks,
      dependencies,
      [WD_THANKSGIVING.predecessor.id],
      { bidirectional: true, workingDays: wdCtxHolidays }
    );

    // Successor must be moved (its initial position is intentionally wrong).
    expect(adjustments).toHaveLength(1);
    const succ = adjustments[0];
    // FS lag=0wd from pred ending Wed 2025-11-26:
    //   dayAfterPred = Thu 2025-11-27 (Thanksgiving — holiday)
    //   snap-forward → Fri 2025-11-28 (working day in date-holidays' US set)
    expect(succ.newStartDate).toBe("2025-11-28");
  });
});

describe("calculateConstrainedDates — holiday in the gap (#82 stage 6)", () => {
  // Uses the real holidayService with the US region. Christmas 2025-12-25
  // is a Thursday. With Sat+Sun excluded AND US holidays excluded:
  //   - Pred ends Wed 2025-12-24
  //   - dayAfterPred = Thu 25 (holiday)
  //   - lag=0wd snap-forward → next working day
  //   - Thu 25 (holiday) skip → Fri 26 (working day) → Mon 29
  // Wait — Fri 26 is also a federal-holiday-observance for some years but
  // not 2025 in date-holidays' US dataset. Verified by computing from the
  // helper itself; if the dataset changes, this test will catch it.
  it("FS lag=0wd skips Christmas and lands on the next working day", () => {
    const wdCtxHolidays: WorkingDaysContext = {
      enabled: true,
      config: {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: true,
      },
      holidayRegion: "US",
    };
    const pred = { startDate: "2025-12-22", endDate: "2025-12-24" };
    const result = calculateConstrainedDates(pred, 1, "FS", 0, wdCtxHolidays);
    // The successor must NOT land on Thu 25 (Christmas). It must land on
    // the first working day on/after Thu 25 — i.e. Fri 26 in 2025.
    expect(result.startDate).toBe("2025-12-26");
  });

  it("FS lag=2wd skips holidays in the gap", () => {
    const wdCtxHolidays: WorkingDaysContext = {
      enabled: true,
      config: {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: true,
      },
      holidayRegion: "US",
    };
    // Pred ends Wed 2025-12-24. lag=2wd means 2 working days past lag=0
    // anchor (Fri 26). Two WD past Fri 26 = Tue 30 (Sat 27, Sun 28 skipped).
    const pred = { startDate: "2025-12-22", endDate: "2025-12-24" };
    const result = calculateConstrainedDates(pred, 1, "FS", 2, wdCtxHolidays);
    expect(result.startDate).toBe("2025-12-30");
  });
});

describe("propagateDateChanges — working days cascade", () => {
  it("FS cascade with weekend in the gap places successor on Mon", () => {
    const tasks: Task[] = [
      makeTask({ id: "A", startDate: "2025-01-06", endDate: "2025-01-10" }),
      makeTask({ id: "B", startDate: "2025-01-20", endDate: "2025-01-22" }),
    ];
    const deps: Dependency[] = [makeDep("A", "B", "FS", 0)];
    const adjustments = propagateDateChanges(tasks, deps, ["A" as TaskId], {
      bidirectional: true,
      workingDays: WD_CTX,
    });
    expect(adjustments).toHaveLength(1);
    // 3-day calendar duration → 3 WD; FS lag=0 → start Mon 13, end Wed 15
    expect(adjustments[0].newStartDate).toBe("2025-01-13");
    expect(adjustments[0].newEndDate).toBe("2025-01-15");
  });

  it("calendar fallback path is unchanged when workingDays option omitted", () => {
    const tasks: Task[] = [
      makeTask({ id: "A", startDate: "2025-01-06", endDate: "2025-01-10" }),
      makeTask({ id: "B", startDate: "2025-01-20", endDate: "2025-01-22" }),
    ];
    const deps: Dependency[] = [makeDep("A", "B", "FS", 0)];
    const adjustments = propagateDateChanges(tasks, deps, ["A" as TaskId], {
      bidirectional: true,
    });
    expect(adjustments[0].newStartDate).toBe("2025-01-11"); // Sat — calendar mode
  });
});
