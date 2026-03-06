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
import { tid, hex } from "../../../helpers/branded";

// Helper to create minimal task
function task(id: string): Task {
  return {
    id: tid(id),
    name: `Task ${id}`,
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    duration: 7,
    progress: 0,
    color: hex("#3b82f6"),
    order: 0,
    type: "task",
    metadata: {},
  };
}

// Helper to create dependency
function dep(from: string, to: string): Dependency {
  return {
    id: `${from}-${to}`,
    fromTaskId: tid(from),
    toTaskId: tid(to),
    type: "FS",
    createdAt: "",
  };
}

describe("topologicalSort", () => {
  describe("with empty input", () => {
    it("should return empty array for empty tasks and no dependencies", () => {
      expect(topologicalSort([], [])).toEqual([]);
    });

    it("should return all tasks when no dependencies", () => {
      const tasks = [task("A"), task("B"), task("C")];
      const result = topologicalSort(tasks, []);
      expect(result.length).toBe(3);
      expect(result.map((t) => t.id)).toContain(tid("A"));
      expect(result.map((t) => t.id)).toContain(tid("B"));
      expect(result.map((t) => t.id)).toContain(tid("C"));
    });
  });

  describe("with linear dependencies", () => {
    it("should order A before B before C for A -> B -> C", () => {
      const tasks = [task("C"), task("A"), task("B")]; // Intentionally out of order
      const deps = [dep("A", "B"), dep("B", "C")];

      const result = topologicalSort(tasks, deps);
      const ids = result.map((t) => t.id);

      expect(ids.indexOf(tid("A"))).toBeLessThan(ids.indexOf(tid("B")));
      expect(ids.indexOf(tid("B"))).toBeLessThan(ids.indexOf(tid("C")));
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

      expect(ids.indexOf(tid("A"))).toBeLessThan(ids.indexOf(tid("B")));
      expect(ids.indexOf(tid("A"))).toBeLessThan(ids.indexOf(tid("C")));
      expect(ids.indexOf(tid("B"))).toBeLessThan(ids.indexOf(tid("D")));
      expect(ids.indexOf(tid("C"))).toBeLessThan(ids.indexOf(tid("D")));
    });
  });

  describe("with missing tasks", () => {
    it("should skip dependencies with missing tasks", () => {
      const tasks = [task("A"), task("B")];
      const deps = [dep("A", "B"), dep("B", "C")]; // C doesn't exist

      const result = topologicalSort(tasks, deps);
      expect(result.length).toBe(2);
      expect(result.map((t) => t.id)).toEqual([tid("A"), tid("B")]);
    });
  });

  describe("with duplicate dependency edges", () => {
    it("should handle the same edge listed twice and return all tasks in order", () => {
      const tasks = [task("A"), task("B"), task("C")];
      const deps = [dep("A", "B"), dep("A", "B"), dep("B", "C")]; // A→B appears twice
      const result = topologicalSort(tasks, deps);
      const ids = result.map((t) => t.id);
      expect(result.length).toBe(3);
      expect(ids.indexOf(tid("A"))).toBeLessThan(ids.indexOf(tid("B")));
      expect(ids.indexOf(tid("B"))).toBeLessThan(ids.indexOf(tid("C")));
    });
  });

  describe("with cyclic dependencies", () => {
    it("should return only acyclic tasks when graph contains a cycle", () => {
      // A is independent; B → C → B is a cycle
      const tasks = [task("A"), task("B"), task("C")];
      const deps = [dep("B", "C"), dep("C", "B")];

      const result = topologicalSort(tasks, deps);
      // A has no dependencies so it escapes; B and C are stuck in the cycle
      expect(result.map((t) => t.id)).toContain(tid("A"));
      expect(result.length).toBe(1);
    });

    it("should exclude a task with a self-loop (A→A) from the result", () => {
      // A→A increments inDegree["A"] to 1 so A is never enqueued (partial sort).
      // B has no dependencies and must appear in the result.
      const tasks = [task("A"), task("B")];
      const deps = [dep("A", "A")];

      const result = topologicalSort(tasks, deps);
      expect(result.map((t) => t.id)).not.toContain(tid("A"));
      expect(result.map((t) => t.id)).toContain(tid("B"));
      expect(result.length).toBe(1);
    });
  });

  describe("with disconnected chains", () => {
    it("should include all tasks and respect ordering within each independent chain", () => {
      // A → B (chain 1), C → D (chain 2) — no connection between chains
      const tasks = [task("A"), task("B"), task("C"), task("D")];
      const deps = [dep("A", "B"), dep("C", "D")];

      const result = topologicalSort(tasks, deps);
      const ids = result.map((t) => t.id);

      expect(result.length).toBe(4);
      expect(ids.indexOf(tid("A"))).toBeLessThan(ids.indexOf(tid("B")));
      expect(ids.indexOf(tid("C"))).toBeLessThan(ids.indexOf(tid("D")));
    });
  });
});

describe("getSuccessors", () => {
  it("should return empty set for a task not present in any dependency", () => {
    const result = getSuccessors(tid("X"), []);
    expect(result.size).toBe(0);
  });

  it("should return empty set for task with no successors", () => {
    const deps = [dep("A", "B")];
    const result = getSuccessors(tid("B"), deps);
    expect(result.size).toBe(0);
  });

  it("should return direct successors", () => {
    const deps = [dep("A", "B"), dep("A", "C")];
    const result = getSuccessors(tid("A"), deps);
    expect(result.has(tid("B"))).toBe(true);
    expect(result.has(tid("C"))).toBe(true);
    expect(result.size).toBe(2);
  });

  it("should return transitive successors", () => {
    const deps = [dep("A", "B"), dep("B", "C"), dep("C", "D")];
    const result = getSuccessors(tid("A"), deps);
    expect(result.has(tid("B"))).toBe(true);
    expect(result.has(tid("C"))).toBe(true);
    expect(result.has(tid("D"))).toBe(true);
    expect(result.size).toBe(3);
  });

  it("should not include the starting task", () => {
    const deps = [dep("A", "B")];
    const result = getSuccessors(tid("A"), deps);
    expect(result.has(tid("A"))).toBe(false);
  });

  it("should not include the starting task even when a cycle leads back to it", () => {
    // A → B → A forms a cycle; starting node is pre-visited so it never enters reachable
    const deps = [dep("A", "B"), dep("B", "A")];
    const result = getSuccessors(tid("A"), deps);
    expect(result.has(tid("B"))).toBe(true);
    expect(result.has(tid("A"))).toBe(false);
  });
});

describe("getPredecessors", () => {
  it("should return empty set for a task not present in any dependency", () => {
    const result = getPredecessors(tid("X"), []);
    expect(result.size).toBe(0);
  });

  it("should return empty set for task with no predecessors", () => {
    const deps = [dep("A", "B")];
    const result = getPredecessors(tid("A"), deps);
    expect(result.size).toBe(0);
  });

  it("should return direct predecessors", () => {
    const deps = [dep("A", "C"), dep("B", "C")];
    const result = getPredecessors(tid("C"), deps);
    expect(result.has(tid("A"))).toBe(true);
    expect(result.has(tid("B"))).toBe(true);
    expect(result.size).toBe(2);
  });

  it("should return transitive predecessors", () => {
    const deps = [dep("A", "B"), dep("B", "C"), dep("C", "D")];
    const result = getPredecessors(tid("D"), deps);
    expect(result.has(tid("A"))).toBe(true);
    expect(result.has(tid("B"))).toBe(true);
    expect(result.has(tid("C"))).toBe(true);
    expect(result.size).toBe(3);
  });

  it("should not include the starting task", () => {
    const deps = [dep("A", "B")];
    const result = getPredecessors(tid("B"), deps);
    expect(result.has(tid("B"))).toBe(false);
  });

  it("should not include the starting task even when a cycle leads back to it", () => {
    // A → B → A forms a cycle; starting node is pre-visited so it never enters reachable
    const deps = [dep("A", "B"), dep("B", "A")];
    const result = getPredecessors(tid("A"), deps);
    expect(result.has(tid("B"))).toBe(true);
    expect(result.has(tid("A"))).toBe(false);
  });
});
