import { describe, it, expect } from "vitest";
import {
  collectTasksWithChildren,
  deepCloneTasks,
} from "../../../../src/utils/clipboard/collectTasks";
import type { Task } from "../../../../src/types/chart.types";
import { tid, hex } from "../../../helpers/branded";

// Helper to create test tasks
const createTask = (
  id: string,
  name: string,
  parent?: string,
  open?: boolean
): Task => ({
  id: tid(id),
  name,
  startDate: "2025-01-01",
  endDate: "2025-01-07",
  duration: 7,
  progress: 0,
  color: hex("#3b82f6"),
  order: 0,
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
