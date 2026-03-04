import { describe, it, expect } from "vitest";
import {
  collectTasksWithChildren,
  deepCloneTasks,
} from "../../../src/utils/clipboard/collectTasks";
import type { Task } from "../../../src/types/chart.types";
import { tid, hex } from "../../helpers/branded";

function makeTask(id: string, parentId?: string, open?: boolean): Task {
  return {
    id: tid(id),
    name: id,
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    duration: 7,
    progress: 0,
    color: hex("#3b82f6"),
    order: 0,
    metadata: {},
    parent: parentId ? tid(parentId) : undefined,
    open,
  };
}

describe("collectTasksWithChildren", () => {
  it("should collect a single selected task", () => {
    const tasks = [makeTask("a")];
    const result = collectTasksWithChildren([tid("a")], tasks);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(tid("a"));
  });

  it("should collect multiple selected tasks", () => {
    const tasks = [makeTask("a"), makeTask("b"), makeTask("c")];
    const result = collectTasksWithChildren([tid("a"), tid("c")], tasks);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual([tid("a"), tid("c")]);
  });

  it("should include hidden children when parent is collapsed", () => {
    const tasks = [
      makeTask("parent", undefined, false), // collapsed
      makeTask("child1", "parent"),
      makeTask("child2", "parent"),
    ];
    const result = collectTasksWithChildren([tid("parent")], tasks);
    expect(result).toHaveLength(3);
    expect(result.map((t) => t.id)).toContain(tid("parent"));
    expect(result.map((t) => t.id)).toContain(tid("child1"));
    expect(result.map((t) => t.id)).toContain(tid("child2"));
  });

  it("should NOT include children when parent is open (open === true)", () => {
    const tasks = [
      makeTask("parent", undefined, true), // open
      makeTask("child1", "parent"),
    ];
    const result = collectTasksWithChildren([tid("parent")], tasks);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(tid("parent"));
  });

  it("should NOT include children when parent open is undefined", () => {
    const tasks = [
      makeTask("parent"), // open undefined (defaults to open)
      makeTask("child1", "parent"),
    ];
    const result = collectTasksWithChildren([tid("parent")], tasks);
    expect(result).toHaveLength(1);
  });

  it("should recursively include all descendants of a collapsed parent", () => {
    const tasks = [
      makeTask("grandparent", undefined, false), // collapsed
      makeTask("parent", "grandparent", false),  // also collapsed, but hidden by grandparent
      makeTask("child", "parent"),
    ];
    const result = collectTasksWithChildren([tid("grandparent")], tasks);
    expect(result).toHaveLength(3);
  });

  it("should not duplicate tasks already collected as children of a collapsed parent", () => {
    const tasks = [
      makeTask("parent", undefined, false), // collapsed
      makeTask("child", "parent"),
    ];
    // Explicitly select both parent and child — child should only appear once
    const result = collectTasksWithChildren([tid("parent"), tid("child")], tasks);
    expect(result).toHaveLength(2);
    const ids = result.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
  });

  it("should skip task IDs not found in allTasks", () => {
    const tasks = [makeTask("a")];
    const result = collectTasksWithChildren([tid("a"), tid("nonexistent")], tasks);
    expect(result).toHaveLength(1);
  });

  it("should return empty array for empty selection", () => {
    const tasks = [makeTask("a")];
    expect(collectTasksWithChildren([], tasks)).toHaveLength(0);
  });

  it("should return empty array when allTasks is empty", () => {
    expect(collectTasksWithChildren([tid("a")], [])).toHaveLength(0);
  });
});

describe("deepCloneTasks", () => {
  it("should return a new array (not same reference)", () => {
    const tasks = [makeTask("a")];
    const result = deepCloneTasks(tasks);
    expect(result).not.toBe(tasks);
  });

  it("should return new task objects (not same references)", () => {
    const tasks = [makeTask("a")];
    const result = deepCloneTasks(tasks);
    expect(result[0]).not.toBe(tasks[0]);
  });

  it("should produce deep-equal tasks", () => {
    const tasks = [makeTask("a"), makeTask("b", "a")];
    const result = deepCloneTasks(tasks);
    expect(result).toEqual(tasks);
  });

  it("should clone nested metadata objects", () => {
    const task = makeTask("a");
    task.metadata = { nested: { value: 42 } };
    const result = deepCloneTasks([task]);
    expect(result[0].metadata).toEqual(task.metadata);
    expect(result[0].metadata).not.toBe(task.metadata);
  });

  it("should handle empty array", () => {
    expect(deepCloneTasks([])).toEqual([]);
  });
});
