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
  propagateDateChanges,
  applyDateAdjustments,
  reverseDateAdjustments,
} from "@/utils/graph/dateAdjustment";
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
      const result = calculateConstrainedDates(pred, 3, "FS", 0);
      // successor starts Jan 11 (day after Jan 10), duration 3 → Jan 11-13
      expect(result.startDate).toBe("2025-01-11");
      expect(result.endDate).toBe("2025-01-13");
    });

    it("applies positive lag (gap)", () => {
      const result = calculateConstrainedDates(pred, 3, "FS", 2);
      // Jan 10 + 1 + 2 = Jan 13 start, +2 days = Jan 15 end
      expect(result.startDate).toBe("2025-01-13");
      expect(result.endDate).toBe("2025-01-15");
    });

    it("applies negative lag (overlap/lead)", () => {
      const result = calculateConstrainedDates(pred, 3, "FS", -2);
      // Jan 10 + 1 - 2 = Jan 9 start, +2 days = Jan 11 end
      expect(result.startDate).toBe("2025-01-09");
      expect(result.endDate).toBe("2025-01-11");
    });

    it("defaults lag to 0 when omitted", () => {
      const result = calculateConstrainedDates(pred, 3, "FS");
      expect(result.startDate).toBe("2025-01-11");
    });
  });

  describe("SS (Start-to-Start)", () => {
    it("returns predecessor start date with lag=0", () => {
      const result = calculateConstrainedDates(pred, 3, "SS", 0);
      expect(result.startDate).toBe("2025-01-06");
      expect(result.endDate).toBe("2025-01-08");
    });

    it("applies positive lag", () => {
      const result = calculateConstrainedDates(pred, 3, "SS", 2);
      expect(result.startDate).toBe("2025-01-08");
      expect(result.endDate).toBe("2025-01-10");
    });

    it("applies negative lag", () => {
      const result = calculateConstrainedDates(pred, 3, "SS", -1);
      expect(result.startDate).toBe("2025-01-05");
      expect(result.endDate).toBe("2025-01-07");
    });
  });

  describe("FF (Finish-to-Finish)", () => {
    it("derives start from end and duration with lag=0", () => {
      const result = calculateConstrainedDates(pred, 3, "FF", 0);
      // successor end = Jan 10, duration 3 → start = Jan 8
      expect(result.endDate).toBe("2025-01-10");
      expect(result.startDate).toBe("2025-01-08");
    });

    it("applies positive lag", () => {
      const result = calculateConstrainedDates(pred, 3, "FF", 2);
      expect(result.endDate).toBe("2025-01-12");
      expect(result.startDate).toBe("2025-01-10");
    });

    it("applies negative lag", () => {
      const result = calculateConstrainedDates(pred, 3, "FF", -1);
      expect(result.endDate).toBe("2025-01-09");
      expect(result.startDate).toBe("2025-01-07");
    });
  });

  describe("SF (Start-to-Finish)", () => {
    it("derives start from predecessor start with lag=0", () => {
      const result = calculateConstrainedDates(pred, 3, "SF", 0);
      // successor end = Jan 6, duration 3 → start = Jan 4
      expect(result.endDate).toBe("2025-01-06");
      expect(result.startDate).toBe("2025-01-04");
    });

    it("applies positive lag", () => {
      const result = calculateConstrainedDates(pred, 3, "SF", 2);
      expect(result.endDate).toBe("2025-01-08");
      expect(result.startDate).toBe("2025-01-06");
    });
  });

  describe("duration edge cases", () => {
    it("handles duration=1 (milestone-like)", () => {
      const result = calculateConstrainedDates(pred, 1, "FS", 0);
      expect(result.startDate).toBe("2025-01-11");
      expect(result.endDate).toBe("2025-01-11");
    });

    it("handles same-day predecessor (milestone predecessor)", () => {
      const milestone = { startDate: "2025-01-10", endDate: "2025-01-10" };
      const result = calculateConstrainedDates(milestone, 3, "FS", 0);
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
