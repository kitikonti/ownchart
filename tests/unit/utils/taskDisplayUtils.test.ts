/**
 * Tests for computeDisplayTask pure utility.
 */

import { describe, it, expect } from "vitest";
import { computeDisplayTask } from "../../../src/utils/taskDisplayUtils";
import type { Task } from "../../../src/types/chart.types";
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
});
