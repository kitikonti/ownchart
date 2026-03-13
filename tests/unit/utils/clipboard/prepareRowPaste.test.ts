import { describe, it, expect } from "vitest";
import {
  prepareRowPaste,
  applySingleLevelSummaryRecalculation,
} from "@/utils/clipboard/prepareRowPaste";
import type { Task } from "@/types/chart.types";
import type { Dependency } from "@/types/dependency.types";
import { tid, hex } from "../../../helpers/branded";

const createTask = (
  id: string,
  name: string,
  order: number,
  parent?: string,
  overrides?: Partial<Task>
): Task => ({
  id: tid(id),
  name,
  startDate: "2025-01-01",
  endDate: "2025-01-07",
  duration: 7,
  progress: 0,
  color: hex("#3b82f6"),
  order,
  type: "task",
  parent: parent ? tid(parent) : undefined,
  metadata: {},
  ...overrides,
});

const createDep = (
  id: string,
  fromTaskId: string,
  toTaskId: string
): Dependency => ({
  id,
  fromTaskId: tid(fromTaskId),
  toTaskId: tid(toTaskId),
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
      activeCell: { taskId: tid("child") },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    // New task should get the same parent as the task at insert position
    expect(result.targetParent).toBe(tid("parent"));
    expect(result.newTasks[0].parent).toBe(tid("parent"));
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
      activeCell: { taskId: tid("l2") },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toContain("nesting depth");
    }
  });

  it("should not infinite-loop and should complete successfully when clipboard has circular parent references", () => {
    // Malformed clipboard data: task A claims its parent is B, task B claims
    // its parent is A — a direct cycle. The cycle-detection guard in
    // computeMaxPastedDepth must break the traversal rather than looping forever.
    const currentTasks = [createTask("existing", "Existing", 0)];
    const clipboardTasks = [
      createTask("a", "A", 0, "b"), // parent = b (not yet defined — forward ref)
      createTask("b", "B", 1, "a"), // parent = a → creates a cycle
    ];

    // Should return without hanging and without throwing
    const result = prepareRowPaste({
      clipboardTasks,
      clipboardDependencies: [],
      currentTasks,
      activeCell: { taskId: null },
      selectedTaskIds: [],
    });

    // The cycle guard traverses A→B→A before detecting the cycle, so
    // maxPastedDepth=2. targetDepth(0)+2=2 < MAX_HIERARCHY_DEPTH(3), so the
    // paste succeeds.
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.newTasks).toHaveLength(2);
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
      activeCell: { taskId: tid("b") },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    // Should insert at order 1 (before "b")
    expect(result.insertOrder).toBe(1);
    expect(result.newTasks[0].order).toBe(1);
  });

  it("should return empty newTasks and leave currentTasks unchanged when clipboardTasks is empty", () => {
    const currentTasks = [
      createTask("a", "A", 0),
      createTask("b", "B", 1),
    ];

    const result = prepareRowPaste({
      clipboardTasks: [],
      clipboardDependencies: [],
      currentTasks,
      activeCell: { taskId: null },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.newTasks).toHaveLength(0);
    expect(result.remappedDependencies).toHaveLength(0);
    // Existing tasks should not be shifted when nothing is inserted
    expect(result.mergedTasks).toHaveLength(2);
    expect(result.mergedTasks[0].order).toBe(0);
    expect(result.mergedTasks[1].order).toBe(1);
  });

  it("should place pasted tasks at order 0 when currentTasks is empty", () => {
    // Edge case: empty store — reduce returns initial value (-1), so insertOrder = 0
    const clipboardTasks = [
      createTask("x", "X", 0),
      createTask("y", "Y", 1),
    ];

    const result = prepareRowPaste({
      clipboardTasks,
      clipboardDependencies: [],
      currentTasks: [],
      activeCell: { taskId: null },
      selectedTaskIds: [],
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.insertOrder).toBe(0);
    expect(result.newTasks[0].order).toBe(0);
    expect(result.newTasks[1].order).toBe(1);
    expect(result.mergedTasks).toHaveLength(2);
  });
});

describe("applySingleLevelSummaryRecalculation", () => {
  it("should return tasks unchanged when no targetParent", () => {
    const tasks = [createTask("a", "A", 0)];
    const result = applySingleLevelSummaryRecalculation(tasks, undefined);
    expect(result).toBe(tasks); // Same reference
  });

  it("should return tasks unchanged when parent is not a summary", () => {
    const tasks = [
      createTask("p", "Parent", 0),
      createTask("c", "Child", 1, "p"),
    ];
    const result = applySingleLevelSummaryRecalculation(tasks, tid("p"));
    expect(result).toBe(tasks);
  });

  it("should return tasks unchanged when targetParent is not found in tasks", () => {
    const tasks = [createTask("a", "A", 0)];
    // "nonexistent" does not exist in the tasks array
    const result = applySingleLevelSummaryRecalculation(tasks, tid("nonexistent"));
    expect(result).toBe(tasks);
  });

  it("should return tasks unchanged when summary has no children (calculateSummaryDates returns null)", () => {
    // A summary task with no children causes calculateSummaryDates to return
    // null/undefined — the function must guard this branch and return the
    // original tasks reference unchanged.
    const tasks = [
      createTask("lonely-summary", "Lonely Summary", 0, undefined, {
        type: "summary",
      }),
    ];
    const result = applySingleLevelSummaryRecalculation(
      tasks,
      tid("lonely-summary")
    );
    expect(result).toBe(tasks); // Same reference — no mutation when no dates to derive
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

    const result = applySingleLevelSummaryRecalculation(tasks, tid("summary"));

    const summary = result.find((t) => t.id === tid("summary"));
    expect(summary?.startDate).toBe("2025-02-15");
    expect(summary?.endDate).toBe("2025-04-01");
  });

  it("should only update the direct parent, leaving ancestor summaries unchanged (single-level boundary)", () => {
    // Verifies the documented limitation: ancestor propagation is NOT performed.
    // Callers that need full ancestor propagation must chain multiple calls.
    const tasks = [
      createTask("grandparent", "Grandparent", 0, undefined, {
        type: "summary",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      }),
      createTask("parent", "Parent", 1, "grandparent", {
        type: "summary",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      }),
      createTask("child", "Child", 2, "parent", {
        startDate: "2025-03-01",
        endDate: "2025-03-15",
      }),
    ];

    // Only pass "parent" — the direct parent of the newly pasted child
    const result = applySingleLevelSummaryRecalculation(tasks, tid("parent"));

    // Direct parent should be updated to span the child
    const parent = result.find((t) => t.id === tid("parent"));
    expect(parent?.startDate).toBe("2025-03-01");
    expect(parent?.endDate).toBe("2025-03-15");

    // Grandparent is NOT updated by a single call — unchanged
    const grandparent = result.find((t) => t.id === tid("grandparent"));
    expect(grandparent?.startDate).toBe("2025-01-01");
    expect(grandparent?.endDate).toBe("2025-01-31");
  });
});
