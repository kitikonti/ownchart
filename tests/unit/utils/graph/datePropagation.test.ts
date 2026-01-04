/**
 * Unit tests for date propagation algorithm.
 * Sprint 1.4 - Dependencies
 */

import { describe, it, expect } from "vitest";
import {
  calculateDateAdjustments,
  checkDependencyViolations,
  getEarliestStartDate,
} from "../../../../src/utils/graph/datePropagation";
import type { Task } from "../../../../src/types/chart.types";
import type { Dependency } from "../../../../src/types/dependency.types";

// Helper to create task with dates
function task(id: string, startDate: string, endDate: string): Task {
  return {
    id,
    name: `Task ${id}`,
    startDate,
    endDate,
    duration: 7,
    progress: 0,
    color: "#3b82f6",
    order: 0,
    type: "task",
    metadata: {},
  };
}

// Helper to create dependency
function dep(from: string, to: string, lag: number = 0): Dependency {
  return {
    id: `${from}-${to}`,
    fromTaskId: from,
    toTaskId: to,
    type: "FS",
    lag,
    createdAt: "",
  };
}

describe("calculateDateAdjustments", () => {
  describe("with no dependencies", () => {
    it("should return empty array when no dependencies", () => {
      const tasks = [
        task("A", "2025-01-01", "2025-01-07"),
        task("B", "2025-01-01", "2025-01-07"),
      ];
      const result = calculateDateAdjustments(tasks, []);
      expect(result).toEqual([]);
    });
  });

  describe("with valid dependencies", () => {
    it("should return empty array when successor starts after predecessor ends", () => {
      const tasks = [
        task("A", "2025-01-01", "2025-01-07"),
        task("B", "2025-01-10", "2025-01-17"), // Starts 2 days after A ends
      ];
      const deps = [dep("A", "B")];
      const result = calculateDateAdjustments(tasks, deps);
      expect(result).toEqual([]);
    });
  });

  describe("with violated dependencies", () => {
    it("should shift successor that starts before predecessor ends", () => {
      const tasks = [
        task("A", "2025-01-01", "2025-01-10"), // Ends Jan 10
        task("B", "2025-01-05", "2025-01-12"), // Starts Jan 5 - violates FS
      ];
      const deps = [dep("A", "B")];

      const result = calculateDateAdjustments(tasks, deps);

      expect(result.length).toBe(1);
      expect(result[0].taskId).toBe("B");
      expect(result[0].oldStartDate).toBe("2025-01-05");
      // B should start on Jan 11 (day after A ends)
      expect(result[0].newStartDate).toBe("2025-01-11");
    });

    it("should cascade adjustments to downstream tasks", () => {
      const tasks = [
        task("A", "2025-01-01", "2025-01-10"), // Ends Jan 10
        task("B", "2025-01-05", "2025-01-12"), // Violates A -> B
        task("C", "2025-01-06", "2025-01-13"), // Violates B -> C (after B shifts)
      ];
      const deps = [dep("A", "B"), dep("B", "C")];

      const result = calculateDateAdjustments(tasks, deps);

      expect(result.length).toBe(2);
      expect(result[0].taskId).toBe("B");
      expect(result[1].taskId).toBe("C");
    });
  });

  describe("with lag", () => {
    it("should respect positive lag (gap between tasks)", () => {
      const tasks = [
        task("A", "2025-01-01", "2025-01-07"), // Ends Jan 7
        task("B", "2025-01-08", "2025-01-14"), // Starts Jan 8 (1 day after A)
      ];
      const deps = [dep("A", "B", 2)]; // 2 day lag required

      const result = calculateDateAdjustments(tasks, deps);

      expect(result.length).toBe(1);
      expect(result[0].taskId).toBe("B");
      // B should start Jan 10 (Jan 7 + 1 day + 2 lag)
      expect(result[0].newStartDate).toBe("2025-01-10");
    });
  });
});

describe("checkDependencyViolations", () => {
  it("should return empty array when task has no violations", () => {
    const t = task("B", "2025-01-10", "2025-01-17");
    const tasks = [task("A", "2025-01-01", "2025-01-07"), t];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const deps = [dep("A", "B")];

    const result = checkDependencyViolations(t, deps, taskMap);
    expect(result).toEqual([]);
  });

  it("should detect violation when successor starts before predecessor ends", () => {
    const t = task("B", "2025-01-05", "2025-01-12");
    const tasks = [task("A", "2025-01-01", "2025-01-10"), t];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const deps = [dep("A", "B")];

    const result = checkDependencyViolations(t, deps, taskMap);
    expect(result.length).toBe(1);
    expect(result[0].dependency.fromTaskId).toBe("A");
  });
});

describe("getEarliestStartDate", () => {
  it("should return null when task has no predecessors", () => {
    const tasks = [
      task("A", "2025-01-01", "2025-01-07"),
      task("B", "2025-01-01", "2025-01-07"),
    ];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const deps = [dep("A", "B")];

    const result = getEarliestStartDate("A", deps, taskMap);
    expect(result).toBeNull();
  });

  it("should return earliest date based on predecessor", () => {
    const tasks = [
      task("A", "2025-01-01", "2025-01-10"),
      task("B", "2025-01-01", "2025-01-07"),
    ];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const deps = [dep("A", "B")];

    const result = getEarliestStartDate("B", deps, taskMap);
    // Should be day after A ends = Jan 11
    expect(result).toBe("2025-01-11");
  });

  it("should return latest date when multiple predecessors", () => {
    const tasks = [
      task("A", "2025-01-01", "2025-01-10"), // Ends Jan 10
      task("B", "2025-01-01", "2025-01-15"), // Ends Jan 15 (later)
      task("C", "2025-01-01", "2025-01-07"),
    ];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const deps = [dep("A", "C"), dep("B", "C")];

    const result = getEarliestStartDate("C", deps, taskMap);
    // Should be day after B ends = Jan 16
    expect(result).toBe("2025-01-16");
  });

  it("should include lag in calculation", () => {
    const tasks = [
      task("A", "2025-01-01", "2025-01-10"),
      task("B", "2025-01-01", "2025-01-07"),
    ];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const deps = [dep("A", "B", 3)]; // 3 day lag

    const result = getEarliestStartDate("B", deps, taskMap);
    // Should be Jan 10 + 1 + 3 = Jan 14
    expect(result).toBe("2025-01-14");
  });
});
