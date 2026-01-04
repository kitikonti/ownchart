/**
 * Unit tests for topological sort algorithm.
 * Sprint 1.4 - Dependencies
 */

import { describe, it, expect } from "vitest";
import {
  topologicalSort,
  getSuccessors,
  getPredecessors,
} from "../../../../src/utils/graph/topologicalSort";
import type { Task } from "../../../../src/types/chart.types";
import type { Dependency } from "../../../../src/types/dependency.types";

// Helper to create minimal task
function task(id: string): Task {
  return {
    id,
    name: `Task ${id}`,
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    duration: 7,
    progress: 0,
    color: "#3b82f6",
    order: 0,
    type: "task",
    metadata: {},
  };
}

// Helper to create dependency
function dep(from: string, to: string): Dependency {
  return {
    id: `${from}-${to}`,
    fromTaskId: from,
    toTaskId: to,
    type: "FS",
    createdAt: "",
  };
}

describe("topologicalSort", () => {
  describe("with no dependencies", () => {
    it("should return all tasks when no dependencies", () => {
      const tasks = [task("A"), task("B"), task("C")];
      const result = topologicalSort(tasks, []);
      expect(result.length).toBe(3);
      expect(result.map((t) => t.id)).toContain("A");
      expect(result.map((t) => t.id)).toContain("B");
      expect(result.map((t) => t.id)).toContain("C");
    });
  });

  describe("with linear dependencies", () => {
    it("should order A before B before C for A -> B -> C", () => {
      const tasks = [task("C"), task("A"), task("B")]; // Intentionally out of order
      const deps = [dep("A", "B"), dep("B", "C")];

      const result = topologicalSort(tasks, deps);
      const ids = result.map((t) => t.id);

      expect(ids.indexOf("A")).toBeLessThan(ids.indexOf("B"));
      expect(ids.indexOf("B")).toBeLessThan(ids.indexOf("C"));
    });
  });

  describe("with diamond dependencies", () => {
    it("should order correctly for diamond pattern", () => {
      // A -> B -> D
      // A -> C -> D
      const tasks = [task("A"), task("B"), task("C"), task("D")];
      const deps = [dep("A", "B"), dep("A", "C"), dep("B", "D"), dep("C", "D")];

      const result = topologicalSort(tasks, deps);
      const ids = result.map((t) => t.id);

      expect(ids.indexOf("A")).toBeLessThan(ids.indexOf("B"));
      expect(ids.indexOf("A")).toBeLessThan(ids.indexOf("C"));
      expect(ids.indexOf("B")).toBeLessThan(ids.indexOf("D"));
      expect(ids.indexOf("C")).toBeLessThan(ids.indexOf("D"));
    });
  });

  describe("with missing tasks", () => {
    it("should skip dependencies with missing tasks", () => {
      const tasks = [task("A"), task("B")];
      const deps = [dep("A", "B"), dep("B", "C")]; // C doesn't exist

      const result = topologicalSort(tasks, deps);
      expect(result.length).toBe(2);
      expect(result.map((t) => t.id)).toEqual(["A", "B"]);
    });
  });
});

describe("getSuccessors", () => {
  it("should return empty set for task with no successors", () => {
    const deps = [dep("A", "B")];
    const result = getSuccessors("B", deps);
    expect(result.size).toBe(0);
  });

  it("should return direct successors", () => {
    const deps = [dep("A", "B"), dep("A", "C")];
    const result = getSuccessors("A", deps);
    expect(result.has("B")).toBe(true);
    expect(result.has("C")).toBe(true);
    expect(result.size).toBe(2);
  });

  it("should return transitive successors", () => {
    const deps = [dep("A", "B"), dep("B", "C"), dep("C", "D")];
    const result = getSuccessors("A", deps);
    expect(result.has("B")).toBe(true);
    expect(result.has("C")).toBe(true);
    expect(result.has("D")).toBe(true);
    expect(result.size).toBe(3);
  });

  it("should not include the starting task", () => {
    const deps = [dep("A", "B")];
    const result = getSuccessors("A", deps);
    expect(result.has("A")).toBe(false);
  });
});

describe("getPredecessors", () => {
  it("should return empty set for task with no predecessors", () => {
    const deps = [dep("A", "B")];
    const result = getPredecessors("A", deps);
    expect(result.size).toBe(0);
  });

  it("should return direct predecessors", () => {
    const deps = [dep("A", "C"), dep("B", "C")];
    const result = getPredecessors("C", deps);
    expect(result.has("A")).toBe(true);
    expect(result.has("B")).toBe(true);
    expect(result.size).toBe(2);
  });

  it("should return transitive predecessors", () => {
    const deps = [dep("A", "B"), dep("B", "C"), dep("C", "D")];
    const result = getPredecessors("D", deps);
    expect(result.has("A")).toBe(true);
    expect(result.has("B")).toBe(true);
    expect(result.has("C")).toBe(true);
    expect(result.size).toBe(3);
  });

  it("should not include the starting task", () => {
    const deps = [dep("A", "B")];
    const result = getPredecessors("B", deps);
    expect(result.has("B")).toBe(false);
  });
});
