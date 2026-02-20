import { describe, it, expect } from "vitest";
import {
  prepareRowPaste,
  applySummaryRecalculation,
} from "../../../../src/utils/clipboard/prepareRowPaste";
import type { Task } from "../../../../src/types/chart.types";
import type { Dependency } from "../../../../src/types/dependency.types";

const createTask = (
  id: string,
  name: string,
  order: number,
  parent?: string,
  overrides?: Partial<Task>
): Task => ({
  id,
  name,
  startDate: "2025-01-01",
  endDate: "2025-01-07",
  duration: 7,
  progress: 0,
  color: "#3b82f6",
  order,
  type: "task",
  parent,
  metadata: {},
  ...overrides,
});

const createDep = (
  id: string,
  fromTaskId: string,
  toTaskId: string
): Dependency => ({
  id,
  fromTaskId,
  toTaskId,
  type: "FS",
  createdAt: new Date().toISOString(),
});

describe("prepareRowPaste", () => {
  it("should return mergedTasks with shifted orders for existing tasks", () => {
    const currentTasks = [
      createTask("a", "A", 0),
      createTask("b", "B", 1),
    ];
    const clipboardTasks = [createTask("x", "X", 0)];

    const result = prepareRowPaste({
      clipboardTasks,
      clipboardDependencies: [],
      currentTasks,
      activeCell: { taskId: null },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    // 2 existing + 1 new = 3
    expect(result.mergedTasks).toHaveLength(3);

    // New task should have a new ID (not "x")
    const newIds = result.newTasks.map((t) => t.id);
    expect(newIds).not.toContain("x");
  });

  it("should return newTasks with sequential orders starting at insertOrder", () => {
    const currentTasks = [
      createTask("a", "A", 0),
      createTask("b", "B", 1),
    ];
    const clipboardTasks = [
      createTask("x", "X", 0),
      createTask("y", "Y", 1),
    ];

    // Insert at end (no active cell, no selection)
    const result = prepareRowPaste({
      clipboardTasks,
      clipboardDependencies: [],
      currentTasks,
      activeCell: { taskId: null },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    // insertOrder should be 2 (max order + 1)
    expect(result.insertOrder).toBe(2);
    expect(result.newTasks[0].order).toBe(2);
    expect(result.newTasks[1].order).toBe(3);
  });

  it("should assign targetParent to root clipboard tasks", () => {
    const currentTasks = [
      createTask("parent", "Parent", 0, undefined, { type: "summary", open: true }),
      createTask("child", "Child", 1, "parent"),
    ];
    const clipboardTasks = [createTask("x", "X", 0)];

    // Insert before "child" (which has parent)
    const result = prepareRowPaste({
      clipboardTasks,
      clipboardDependencies: [],
      currentTasks,
      activeCell: { taskId: "child" },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    // New task should get the same parent as the task at insert position
    expect(result.targetParent).toBe("parent");
    expect(result.newTasks[0].parent).toBe("parent");
  });

  it("should preserve internal hierarchy for non-root clipboard tasks", () => {
    const currentTasks = [createTask("a", "A", 0)];
    const clipboardTasks = [
      createTask("p", "Parent", 0),
      createTask("c", "Child", 1, "p"),
    ];

    const result = prepareRowPaste({
      clipboardTasks,
      clipboardDependencies: [],
      currentTasks,
      activeCell: { taskId: null },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    // Root task should get targetParent (undefined for root insert)
    const rootTask = result.newTasks.find(
      (t) => t.id === result.idMapping["p"]
    );
    expect(rootTask?.parent).toBeUndefined();

    // Child should keep its remapped parent
    const childTask = result.newTasks.find(
      (t) => t.id === result.idMapping["c"]
    );
    expect(childTask?.parent).toBe(result.idMapping["p"]);
  });

  it("should return error when depth limit would be exceeded", () => {
    // MAX_HIERARCHY_DEPTH is 3
    // Create a chain: root -> L1 -> L2 (existing)
    const currentTasks = [
      createTask("root", "Root", 0, undefined, { type: "summary", open: true }),
      createTask("l1", "L1", 1, "root", { type: "summary", open: true }),
      createTask("l2", "L2", 2, "l1"),
    ];

    // Clipboard has a parent + child (depth 1)
    const clipboardTasks = [
      createTask("cp", "CP", 0),
      createTask("cc", "CC", 1, "cp"),
    ];

    // Insert before l2 (which is at level 2, parent l1 at level 1)
    const result = prepareRowPaste({
      clipboardTasks,
      clipboardDependencies: [],
      currentTasks,
      activeCell: { taskId: "l2" },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("nesting depth");
    }
  });

  it("should remap dependencies correctly", () => {
    const currentTasks = [createTask("a", "A", 0)];
    const clipboardTasks = [
      createTask("x", "X", 0),
      createTask("y", "Y", 1),
    ];
    const clipboardDeps = [createDep("d1", "x", "y")];

    const result = prepareRowPaste({
      clipboardTasks,
      clipboardDependencies: clipboardDeps,
      currentTasks,
      activeCell: { taskId: null },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.remappedDependencies).toHaveLength(1);
    expect(result.remappedDependencies[0].fromTaskId).toBe(
      result.idMapping["x"]
    );
    expect(result.remappedDependencies[0].toTaskId).toBe(
      result.idMapping["y"]
    );
  });

  it("should insert before active cell position", () => {
    const currentTasks = [
      createTask("a", "A", 0),
      createTask("b", "B", 1),
      createTask("c", "C", 2),
    ];
    const clipboardTasks = [createTask("x", "X", 0)];

    const result = prepareRowPaste({
      clipboardTasks,
      clipboardDependencies: [],
      currentTasks,
      activeCell: { taskId: "b" },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    // Should insert at order 1 (before "b")
    expect(result.insertOrder).toBe(1);
    expect(result.newTasks[0].order).toBe(1);
  });
});

describe("applySummaryRecalculation", () => {
  it("should return tasks unchanged when no targetParent", () => {
    const tasks = [createTask("a", "A", 0)];
    const result = applySummaryRecalculation(tasks, undefined);
    expect(result).toBe(tasks); // Same reference
  });

  it("should return tasks unchanged when parent is not a summary", () => {
    const tasks = [
      createTask("p", "Parent", 0),
      createTask("c", "Child", 1, "p"),
    ];
    const result = applySummaryRecalculation(tasks, "p");
    expect(result).toBe(tasks);
  });

  it("should recalculate summary dates for summary parent", () => {
    const tasks = [
      createTask("summary", "Summary", 0, undefined, { type: "summary" }),
      createTask("child1", "Child 1", 1, "summary", {
        startDate: "2025-03-01",
        endDate: "2025-03-10",
      }),
      createTask("child2", "Child 2", 2, "summary", {
        startDate: "2025-02-15",
        endDate: "2025-04-01",
      }),
    ];

    const result = applySummaryRecalculation(tasks, "summary");

    const summary = result.find((t) => t.id === "summary");
    expect(summary?.startDate).toBe("2025-02-15");
    expect(summary?.endDate).toBe("2025-04-01");
  });
});
