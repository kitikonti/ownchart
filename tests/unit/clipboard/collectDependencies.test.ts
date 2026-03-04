import { describe, it, expect } from "vitest";
import { collectInternalDependencies } from "../../../src/utils/clipboard/collectDependencies";
import type { Task } from "../../../src/types/chart.types";
import type { Dependency } from "../../../src/types/dependency.types";
import { tid, hex } from "../../helpers/branded";

function makeTask(id: string): Task {
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

describe("collectInternalDependencies", () => {
  it("should include dependency when both tasks are in the set", () => {
    const tasks = [makeTask("a"), makeTask("b")];
    const deps = [makeDep("dep1", "a", "b")];
    const result = collectInternalDependencies(tasks, deps);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("dep1");
  });

  it("should exclude dependency when only fromTaskId is in the set", () => {
    const tasks = [makeTask("a")];
    const deps = [makeDep("dep1", "a", "b")];
    expect(collectInternalDependencies(tasks, deps)).toHaveLength(0);
  });

  it("should exclude dependency when only toTaskId is in the set", () => {
    const tasks = [makeTask("b")];
    const deps = [makeDep("dep1", "a", "b")];
    expect(collectInternalDependencies(tasks, deps)).toHaveLength(0);
  });

  it("should exclude dependency when neither task is in the set", () => {
    const tasks = [makeTask("c")];
    const deps = [makeDep("dep1", "a", "b")];
    expect(collectInternalDependencies(tasks, deps)).toHaveLength(0);
  });

  it("should handle multiple dependencies correctly", () => {
    const tasks = [makeTask("a"), makeTask("b"), makeTask("c")];
    const deps = [
      makeDep("dep1", "a", "b"), // internal
      makeDep("dep2", "b", "c"), // internal
      makeDep("dep3", "a", "x"), // external (x not in set)
      makeDep("dep4", "y", "c"), // external (y not in set)
    ];
    const result = collectInternalDependencies(tasks, deps);
    expect(result).toHaveLength(2);
    expect(result.map((d) => d.id)).toEqual(["dep1", "dep2"]);
  });

  it("should return empty array for empty task list", () => {
    const deps = [makeDep("dep1", "a", "b")];
    expect(collectInternalDependencies([], deps)).toHaveLength(0);
  });

  it("should return empty array for empty dependency list", () => {
    const tasks = [makeTask("a"), makeTask("b")];
    expect(collectInternalDependencies(tasks, [])).toHaveLength(0);
  });

  it("should return empty array when both inputs are empty", () => {
    expect(collectInternalDependencies([], [])).toHaveLength(0);
  });

  it("should not mutate the input array", () => {
    const tasks = [makeTask("a"), makeTask("b")];
    const deps = [makeDep("dep1", "a", "b")];
    const depsCopy = [...deps];
    collectInternalDependencies(tasks, deps);
    expect(deps).toEqual(depsCopy);
  });
});
