import { describe, it, expect } from "vitest";
import {
  remapTaskIds,
  remapDependencies,
} from "../../../../src/utils/clipboard/remapIds";
import type { Task } from "../../../../src/types/chart.types";
import type { Dependency } from "../../../../src/types/dependency.types";
import { tid, hex } from "../../../helpers/branded";

// Helper to create test tasks
const createTask = (id: string, name: string, parent?: string): Task => ({
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
  metadata: {},
});

// Helper to create test dependencies
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

describe("remapTaskIds", () => {
  it("should generate new UUIDs for all tasks", () => {
    const tasks = [createTask("old1", "Task 1"), createTask("old2", "Task 2")];

    const { remappedTasks, idMapping } = remapTaskIds(tasks);

    // New IDs should be different from old ones
    expect(remappedTasks[0].id).not.toBe("old1");
    expect(remappedTasks[1].id).not.toBe("old2");

    // New IDs should be valid UUIDs
    expect(remappedTasks[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Mapping should be correct
    expect(idMapping["old1"]).toBe(remappedTasks[0].id);
    expect(idMapping["old2"]).toBe(remappedTasks[1].id);
  });

  it("should remap internal parent references", () => {
    const tasks = [
      createTask("parent", "Parent"),
      createTask("child", "Child", "parent"),
    ];

    const { remappedTasks, idMapping } = remapTaskIds(tasks);

    // Child's parent should be remapped to new parent ID
    expect(remappedTasks[1].parent).toBe(idMapping["parent"]);
  });

  it("should set external parent references to undefined", () => {
    const tasks = [
      createTask("child", "Child", "external-parent"), // parent not in set
    ];

    const { remappedTasks } = remapTaskIds(tasks);

    // External parent reference should be removed
    expect(remappedTasks[0].parent).toBeUndefined();
  });

  it("should preserve all other task properties", () => {
    const tasks: Task[] = [
      {
        id: "old",
        name: "Task",
        startDate: "2025-01-01",
        endDate: "2025-01-07",
        duration: 7,
        progress: 50,
        color: "#ff0000",
        order: 5,
        type: "summary",
        open: false,
        metadata: { key: "value" },
      },
    ];

    const { remappedTasks } = remapTaskIds(tasks);

    expect(remappedTasks[0].name).toBe("Task");
    expect(remappedTasks[0].startDate).toBe("2025-01-01");
    expect(remappedTasks[0].endDate).toBe("2025-01-07");
    expect(remappedTasks[0].duration).toBe(7);
    expect(remappedTasks[0].progress).toBe(50);
    expect(remappedTasks[0].color).toBe("#ff0000");
    expect(remappedTasks[0].order).toBe(5);
    expect(remappedTasks[0].type).toBe("summary");
    expect(remappedTasks[0].open).toBe(false);
    expect(remappedTasks[0].metadata).toEqual({ key: "value" });
  });

  it("should handle empty task array", () => {
    const { remappedTasks, idMapping } = remapTaskIds([]);

    expect(remappedTasks).toHaveLength(0);
    expect(Object.keys(idMapping)).toHaveLength(0);
  });

  it("should handle deep hierarchy", () => {
    const tasks = [
      createTask("level1", "Level 1"),
      createTask("level2", "Level 2", "level1"),
      createTask("level3", "Level 3", "level2"),
    ];

    const { remappedTasks, idMapping } = remapTaskIds(tasks);

    expect(remappedTasks[0].parent).toBeUndefined();
    expect(remappedTasks[1].parent).toBe(idMapping["level1"]);
    expect(remappedTasks[2].parent).toBe(idMapping["level2"]);
  });

  it("should handle task with undefined parent", () => {
    const tasks = [createTask("task", "Task", undefined)];

    const { remappedTasks } = remapTaskIds(tasks);

    expect(remappedTasks[0].parent).toBeUndefined();
  });
});

describe("remapDependencies", () => {
  it("should generate new UUIDs for dependencies", () => {
    const idMapping = { old1: "new1", old2: "new2" };
    const deps = [createDep("oldDep", "old1", "old2")];

    const result = remapDependencies(deps, idMapping);

    expect(result[0].id).not.toBe("oldDep");
    expect(result[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("should remap fromTaskId and toTaskId", () => {
    const idMapping = { old1: "new1", old2: "new2" };
    const deps = [createDep("dep", "old1", "old2")];

    const result = remapDependencies(deps, idMapping);

    expect(result[0].fromTaskId).toBe("new1");
    expect(result[0].toTaskId).toBe("new2");
  });

  it("should filter out dependencies with unmapped fromTaskId", () => {
    const idMapping = { old2: "new2" }; // old1 not mapped
    const deps = [createDep("dep", "old1", "old2")];

    const result = remapDependencies(deps, idMapping);

    expect(result).toHaveLength(0);
  });

  it("should filter out dependencies with unmapped toTaskId", () => {
    const idMapping = { old1: "new1" }; // old2 not mapped
    const deps = [createDep("dep", "old1", "old2")];

    const result = remapDependencies(deps, idMapping);

    expect(result).toHaveLength(0);
  });

  it("should preserve dependency type and lag", () => {
    const idMapping = { old1: "new1", old2: "new2" };
    const deps: Dependency[] = [
      {
        id: "dep",
        fromTaskId: "old1",
        toTaskId: "old2",
        type: "SS",
        lag: 3,
        createdAt: "2025-01-01T00:00:00Z",
      },
    ];

    const result = remapDependencies(deps, idMapping);

    expect(result[0].type).toBe("SS");
    expect(result[0].lag).toBe(3);
    expect(result[0].createdAt).toBe("2025-01-01T00:00:00Z");
  });

  it("should handle empty dependency array", () => {
    const idMapping = { old1: "new1" };

    const result = remapDependencies([], idMapping);

    expect(result).toHaveLength(0);
  });

  it("should handle multiple dependencies", () => {
    const idMapping = { a: "A", b: "B", c: "C" };
    const deps = [
      createDep("dep1", "a", "b"),
      createDep("dep2", "b", "c"),
      createDep("dep3", "a", "d"), // d not mapped - should be filtered
    ];

    const result = remapDependencies(deps, idMapping);

    expect(result).toHaveLength(2);
    expect(result[0].fromTaskId).toBe("A");
    expect(result[0].toTaskId).toBe("B");
    expect(result[1].fromTaskId).toBe("B");
    expect(result[1].toTaskId).toBe("C");
  });
});
