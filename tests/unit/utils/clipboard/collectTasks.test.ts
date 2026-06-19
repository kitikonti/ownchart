import { describe, it, expect } from "vitest";
import {
  collectTasksWithChildren,
  deepCloneTasks,
} from "@/utils/clipboard/collectTasks";
import type { Task } from "@/types/chart.types";
import { tid, hex } from "../../../helpers/branded";

// Helper to create test tasks.
// `order` defaults to the value derived from the array order at call sites that
// don't care about it, but can be set explicitly to model the canonical visual
// order (which is NOT necessarily the array index — see normalizeTaskOrder).
const createTask = (
  id: string,
  name: string,
  parent?: string,
  open?: boolean,
  order = 0
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
  open,
  metadata: {},
});

describe("collectTasksWithChildren", () => {
  it("should collect a single selected task", () => {
    const tasks = [createTask("1", "Task 1"), createTask("2", "Task 2")];

    const result = collectTasksWithChildren(["1"], tasks);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("should collect multiple selected tasks", () => {
    const tasks = [
      createTask("1", "Task 1"),
      createTask("2", "Task 2"),
      createTask("3", "Task 3"),
    ];

    const result = collectTasksWithChildren(["1", "3"], tasks);

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(["1", "3"]);
  });

  it("should NOT collect children of expanded parent", () => {
    const tasks = [
      createTask("parent", "Parent", undefined, true), // expanded
      createTask("child1", "Child 1", "parent"),
      createTask("child2", "Child 2", "parent"),
    ];

    const result = collectTasksWithChildren(["parent"], tasks);

    // Only parent, not children (because parent is expanded)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("parent");
  });

  it("should collect children of collapsed parent", () => {
    const tasks = [
      createTask("parent", "Parent", undefined, false), // collapsed
      createTask("child1", "Child 1", "parent"),
      createTask("child2", "Child 2", "parent"),
    ];

    const result = collectTasksWithChildren(["parent"], tasks);

    // Parent + both children (because parent is collapsed)
    expect(result).toHaveLength(3);
    expect(result.map((t) => t.id)).toEqual(["parent", "child1", "child2"]);
  });

  it("should recursively collect grandchildren of collapsed parent", () => {
    const tasks = [
      createTask("parent", "Parent", undefined, false), // collapsed
      createTask("child", "Child", "parent", true), // expanded but hidden
      createTask("grandchild", "Grandchild", "child"),
    ];

    const result = collectTasksWithChildren(["parent"], tasks);

    // All three levels
    expect(result).toHaveLength(3);
    expect(result.map((t) => t.id)).toEqual(["parent", "child", "grandchild"]);
  });

  it("should not duplicate tasks if explicitly selected and also child of collapsed", () => {
    const tasks = [
      createTask("parent", "Parent", undefined, false), // collapsed
      createTask("child", "Child", "parent"),
    ];

    // Both parent and child are selected
    const result = collectTasksWithChildren(["parent", "child"], tasks);

    // Should not have duplicates
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(["parent", "child"]);
  });

  it("should skip non-existent task IDs", () => {
    const tasks = [createTask("1", "Task 1")];

    const result = collectTasksWithChildren(["1", "nonexistent"], tasks);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("should return empty array for empty selection", () => {
    const tasks = [createTask("1", "Task 1")];

    const result = collectTasksWithChildren([], tasks);

    expect(result).toHaveLength(0);
  });

  it("should return tasks in visual order regardless of selection order", () => {
    const tasks = [
      createTask("1", "Task 1", undefined, undefined, 0),
      createTask("2", "Task 2", undefined, undefined, 1),
      createTask("3", "Task 3", undefined, undefined, 2),
    ];

    // Select in reverse visual order (e.g. Ctrl+click bottom-to-top)
    const result = collectTasksWithChildren(["3", "1"], tasks);

    expect(result).toHaveLength(2);
    // Result must be in `order` order (1 before 3), not selection order
    expect(result.map((t) => t.id)).toEqual(["1", "3"]);
  });

  it("should sort by the `order` field, not the array position (bug repro)", () => {
    // Mirrors the real-world fixture where the stored tasks array is NOT in
    // visual order: the parent has order 0 but sits in the middle of the array,
    // and its children are shuffled relative to their `order` values.
    const tasks = [
      createTask("child-c", "Child C", "parent", undefined, 3), // array idx 0
      createTask("child-a", "Child A", "parent", undefined, 1), // array idx 1
      createTask("parent", "Parent", undefined, false, 0), // array idx 2, collapsed
      createTask("child-b", "Child B", "parent", undefined, 2), // array idx 3
    ];

    const result = collectTasksWithChildren(["parent"], tasks);

    // Parent + 3 children, ordered by `order` (0,1,2,3) — NOT array index.
    expect(result.map((t) => t.id)).toEqual([
      "parent",
      "child-a",
      "child-b",
      "child-c",
    ]);
  });

  it("should handle open=undefined as expanded (default)", () => {
    const tasks = [
      createTask("parent", "Parent"), // open is undefined
      createTask("child", "Child", "parent"),
    ];

    const result = collectTasksWithChildren(["parent"], tasks);

    // Only parent (undefined treated as expanded)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("parent");
  });
});

describe("deepCloneTasks", () => {
  it("should create independent copies of tasks", () => {
    const original = [createTask("1", "Task 1")];

    const cloned = deepCloneTasks(original);

    // Modify clone
    cloned[0].name = "Modified";

    // Original should be unchanged
    expect(original[0].name).toBe("Task 1");
    expect(cloned[0].name).toBe("Modified");
  });

  it("should clone nested metadata", () => {
    const original: Task[] = [
      {
        ...createTask("1", "Task 1"),
        metadata: { nested: { value: "test" } },
      },
    ];

    const cloned = deepCloneTasks(original);

    // Modify cloned metadata
    (cloned[0].metadata as Record<string, unknown>).nested = { value: "changed" };

    // Original should be unchanged
    expect((original[0].metadata as Record<string, unknown>).nested).toEqual({
      value: "test",
    });
  });

  it("should handle empty array", () => {
    const result = deepCloneTasks([]);
    expect(result).toEqual([]);
  });
});
