import { describe, it, expect } from "vitest";
import { remapTaskIds, remapDependencies } from "../../../src/utils/clipboard/remapIds";
import type { Task } from "../../../src/types/chart.types";
import type { Dependency } from "../../../src/types/dependency.types";
import { tid, hex } from "../../helpers/branded";

function makeTask(id: string, parentId?: string): Task {
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
  };
}

function makeDep(id: string, from: string, to: string): Dependency {
  return {
    id,
    fromTaskId: tid(from),
    toTaskId: tid(to),
    type: "FS",
    createdAt: "2025-01-01T00:00:00.000Z",
  };
}

describe("remapTaskIds", () => {
  it("should generate a new unique ID for a single task", () => {
    const tasks = [makeTask("old-id")];
    const { remappedTasks } = remapTaskIds(tasks);
    expect(remappedTasks[0].id).not.toBe(tid("old-id"));
    // New ID should look like a UUID
    expect(typeof remappedTasks[0].id).toBe("string");
    expect(remappedTasks[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("should preserve all other task fields", () => {
    const task = makeTask("old-id");
    const { remappedTasks } = remapTaskIds([task]);
    const remapped = remappedTasks[0];
    expect(remapped.name).toBe(task.name);
    expect(remapped.startDate).toBe(task.startDate);
    expect(remapped.endDate).toBe(task.endDate);
    expect(remapped.duration).toBe(task.duration);
    expect(remapped.progress).toBe(task.progress);
  });

  it("should return a correct id mapping", () => {
    const tasks = [makeTask("a"), makeTask("b")];
    const { remappedTasks, idMapping } = remapTaskIds(tasks);
    expect(idMapping[tid("a")]).toBe(remappedTasks[0].id);
    expect(idMapping[tid("b")]).toBe(remappedTasks[1].id);
  });

  it("should generate unique IDs for multiple tasks", () => {
    const tasks = [makeTask("a"), makeTask("b"), makeTask("c")];
    const { remappedTasks } = remapTaskIds(tasks);
    const ids = remappedTasks.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length); // all unique
  });

  it("should remap parent ID for tasks with internal parent", () => {
    const tasks = [makeTask("parent"), makeTask("child", "parent")];
    const { remappedTasks, idMapping } = remapTaskIds(tasks);
    const childTask = remappedTasks.find((t) => t.name === "child")!;
    expect(childTask.parent).toBe(idMapping[tid("parent")]);
  });

  it("should set parent to undefined for tasks with external parent", () => {
    // "child" has parent "external" which is not in the pasted set
    const tasks = [makeTask("child", "external")];
    const { remappedTasks } = remapTaskIds(tasks);
    expect(remappedTasks[0].parent).toBeUndefined();
  });

  it("should preserve undefined parent for root tasks", () => {
    const tasks = [makeTask("root")];
    const { remappedTasks } = remapTaskIds(tasks);
    expect(remappedTasks[0].parent).toBeUndefined();
  });

  it("should handle empty array", () => {
    const { remappedTasks, idMapping } = remapTaskIds([]);
    expect(remappedTasks).toHaveLength(0);
    expect(Object.keys(idMapping)).toHaveLength(0);
  });

  it("should not mutate original tasks", () => {
    const task = makeTask("original");
    const originalId = task.id;
    remapTaskIds([task]);
    expect(task.id).toBe(originalId);
  });
});

describe("remapDependencies", () => {
  it("should remap dependency when both tasks are in the mapping", () => {
    const tasks = [makeTask("a"), makeTask("b")];
    const { idMapping } = remapTaskIds(tasks);
    const deps = [makeDep("dep1", "a", "b")];

    const result = remapDependencies(deps, idMapping);
    expect(result).toHaveLength(1);
    expect(result[0].fromTaskId).toBe(idMapping[tid("a")]);
    expect(result[0].toTaskId).toBe(idMapping[tid("b")]);
  });

  it("should assign a new ID to each remapped dependency", () => {
    const tasks = [makeTask("a"), makeTask("b")];
    const { idMapping } = remapTaskIds(tasks);
    const deps = [makeDep("original-dep-id", "a", "b")];

    const result = remapDependencies(deps, idMapping);
    expect(result[0].id).not.toBe("original-dep-id");
  });

  it("should exclude dependency when only fromTaskId is in the mapping", () => {
    const tasks = [makeTask("a")];
    const { idMapping } = remapTaskIds(tasks);
    const deps = [makeDep("dep1", "a", "external")];

    expect(remapDependencies(deps, idMapping)).toHaveLength(0);
  });

  it("should exclude dependency when only toTaskId is in the mapping", () => {
    const tasks = [makeTask("b")];
    const { idMapping } = remapTaskIds(tasks);
    const deps = [makeDep("dep1", "external", "b")];

    expect(remapDependencies(deps, idMapping)).toHaveLength(0);
  });

  it("should exclude dependency when neither task is in the mapping", () => {
    const tasks = [makeTask("x")];
    const { idMapping } = remapTaskIds(tasks);
    const deps = [makeDep("dep1", "a", "b")];

    expect(remapDependencies(deps, idMapping)).toHaveLength(0);
  });

  it("should preserve non-id fields (type, lag, createdAt)", () => {
    const tasks = [makeTask("a"), makeTask("b")];
    const { idMapping } = remapTaskIds(tasks);
    const dep: Dependency = {
      id: "dep1",
      fromTaskId: tid("a"),
      toTaskId: tid("b"),
      type: "SS",
      lag: 2,
      createdAt: "2025-06-01T10:00:00.000Z",
    };

    const result = remapDependencies([dep], idMapping);
    expect(result[0].type).toBe("SS");
    expect(result[0].lag).toBe(2);
    expect(result[0].createdAt).toBe("2025-06-01T10:00:00.000Z");
  });

  it("should handle empty dependency list", () => {
    const tasks = [makeTask("a")];
    const { idMapping } = remapTaskIds(tasks);
    expect(remapDependencies([], idMapping)).toHaveLength(0);
  });

  it("should handle empty id mapping", () => {
    const deps = [makeDep("dep1", "a", "b")];
    expect(remapDependencies(deps, {} as never)).toHaveLength(0);
  });

  it("should generate unique IDs across multiple dependencies", () => {
    const tasks = [makeTask("a"), makeTask("b"), makeTask("c")];
    const { idMapping } = remapTaskIds(tasks);
    const deps = [makeDep("d1", "a", "b"), makeDep("d2", "b", "c")];
    const result = remapDependencies(deps, idMapping);
    expect(result).toHaveLength(2);
    expect(result[0].id).not.toBe(result[1].id);
  });
});
