import { describe, it, expect } from "vitest";
import { collectInternalDependencies } from "../../../../src/utils/clipboard/collectDependencies";
import type { Task } from "../../../../src/types/chart.types";
import type { Dependency } from "../../../../src/types/dependency.types";

// Helper to create test tasks
const createTask = (id: string, name: string): Task => ({
  id,
  name,
  startDate: "2025-01-01",
  endDate: "2025-01-07",
  duration: 7,
  progress: 0,
  color: "#3b82f6",
  order: 0,
  type: "task",
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

describe("collectInternalDependencies", () => {
  it("should return empty array when no dependencies exist", () => {
    const tasks = [createTask("1", "Task 1"), createTask("2", "Task 2")];
    const dependencies: Dependency[] = [];

    const result = collectInternalDependencies(tasks, dependencies);

    expect(result).toHaveLength(0);
  });

  it("should include dependency when both tasks are in the set", () => {
    const tasks = [createTask("1", "Task 1"), createTask("2", "Task 2")];
    const dependencies = [createDep("dep1", "1", "2")];

    const result = collectInternalDependencies(tasks, dependencies);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("dep1");
  });

  it("should exclude dependency when only fromTask is in the set", () => {
    const tasks = [createTask("1", "Task 1")];
    const dependencies = [createDep("dep1", "1", "2")]; // Task 2 not in set

    const result = collectInternalDependencies(tasks, dependencies);

    expect(result).toHaveLength(0);
  });

  it("should exclude dependency when only toTask is in the set", () => {
    const tasks = [createTask("2", "Task 2")];
    const dependencies = [createDep("dep1", "1", "2")]; // Task 1 not in set

    const result = collectInternalDependencies(tasks, dependencies);

    expect(result).toHaveLength(0);
  });

  it("should filter correctly with mixed internal and external dependencies", () => {
    const tasks = [
      createTask("1", "Task 1"),
      createTask("2", "Task 2"),
      createTask("3", "Task 3"),
    ];
    const dependencies = [
      createDep("internal1", "1", "2"), // internal
      createDep("internal2", "2", "3"), // internal
      createDep("external1", "1", "4"), // external (4 not in set)
      createDep("external2", "5", "3"), // external (5 not in set)
    ];

    const result = collectInternalDependencies(tasks, dependencies);

    expect(result).toHaveLength(2);
    expect(result.map((d) => d.id)).toEqual(["internal1", "internal2"]);
  });

  it("should handle empty task set", () => {
    const tasks: Task[] = [];
    const dependencies = [createDep("dep1", "1", "2")];

    const result = collectInternalDependencies(tasks, dependencies);

    expect(result).toHaveLength(0);
  });

  it("should handle self-referencing dependency (if it somehow exists)", () => {
    const tasks = [createTask("1", "Task 1")];
    const dependencies = [createDep("self", "1", "1")]; // Self-reference

    const result = collectInternalDependencies(tasks, dependencies);

    // Self-reference should be included (both from and to are in set)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("self");
  });

  it("should preserve all dependency properties", () => {
    const tasks = [createTask("1", "Task 1"), createTask("2", "Task 2")];
    const dependencies: Dependency[] = [
      {
        id: "dep1",
        fromTaskId: "1",
        toTaskId: "2",
        type: "FS",
        lag: 5,
        createdAt: "2025-01-01T00:00:00Z",
      },
    ];

    const result = collectInternalDependencies(tasks, dependencies);

    expect(result[0]).toEqual(dependencies[0]);
  });
});
