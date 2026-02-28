/**
 * Unit tests for cycle detection algorithm.
 * Sprint 1.4 - Dependencies
 */

import { describe, it, expect } from "vitest";
import {
  detectCycle,
  wouldCreateCycle,
} from "../../../../src/utils/graph/cycleDetection";
import type { Dependency } from "../../../../src/types/dependency.types";
import { tid } from "../../../helpers/branded";

// Helper to create dependency
function dep(from: string, to: string, id?: string): Dependency {
  return {
    id: id || `${from}-${to}`,
    fromTaskId: tid(from),
    toTaskId: tid(to),
    type: "FS",
    createdAt: "",
  };
}

describe("detectCycle", () => {
  describe("with no dependencies", () => {
    it("should return no cycle for empty dependency list", () => {
      const result = detectCycle([]);
      expect(result.hasCycle).toBe(false);
    });
  });

  describe("with linear dependencies", () => {
    it("should return no cycle for A -> B -> C", () => {
      const deps = [dep("A", "B"), dep("B", "C")];
      const result = detectCycle(deps);
      expect(result.hasCycle).toBe(false);
    });

    it("should return no cycle for multiple independent chains", () => {
      const deps = [dep("A", "B"), dep("C", "D"), dep("E", "F")];
      const result = detectCycle(deps);
      expect(result.hasCycle).toBe(false);
    });
  });

  describe("with cycles", () => {
    it("should detect simple cycle A -> B -> A", () => {
      const deps = [dep("A", "B"), dep("B", "A")];
      const result = detectCycle(deps);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toBeDefined();
      expect(result.cyclePath!.length).toBeGreaterThan(0);
    });

    it("should detect longer cycle A -> B -> C -> A", () => {
      const deps = [dep("A", "B"), dep("B", "C"), dep("C", "A")];
      const result = detectCycle(deps);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toBeDefined();
    });

    it("should detect cycle in complex graph", () => {
      // A -> B -> C
      // D -> E -> F -> D (cycle)
      const deps = [
        dep("A", "B"),
        dep("B", "C"),
        dep("D", "E"),
        dep("E", "F"),
        dep("F", "D"),
      ];
      const result = detectCycle(deps);
      expect(result.hasCycle).toBe(true);
    });
  });

  describe("with proposed new dependency", () => {
    it("should detect cycle when new dependency creates one", () => {
      const existing = [dep("A", "B"), dep("B", "C")];
      const proposed = dep("C", "A");
      const result = detectCycle(existing, proposed);
      expect(result.hasCycle).toBe(true);
    });

    it("should not detect cycle when new dependency is safe", () => {
      const existing = [dep("A", "B"), dep("B", "C")];
      const proposed = dep("C", "D");
      const result = detectCycle(existing, proposed);
      expect(result.hasCycle).toBe(false);
    });
  });
});

describe("wouldCreateCycle", () => {
  it("should detect self-dependency as cycle", () => {
    const result = wouldCreateCycle([], tid("A"), tid("A"));
    expect(result.hasCycle).toBe(true);
    expect(result.cyclePath).toEqual([tid("A"), tid("A")]);
  });

  it("should detect when adding edge would create cycle", () => {
    const deps = [dep("A", "B"), dep("B", "C")];
    const result = wouldCreateCycle(deps, tid("C"), tid("A"));
    expect(result.hasCycle).toBe(true);
  });

  it("should not detect cycle when edge is safe", () => {
    const deps = [dep("A", "B"), dep("B", "C")];
    const result = wouldCreateCycle(deps, tid("A"), tid("C"));
    expect(result.hasCycle).toBe(false);
  });

  it("should handle empty dependency list", () => {
    const result = wouldCreateCycle([], tid("A"), tid("B"));
    expect(result.hasCycle).toBe(false);
  });

  it("should detect cycle in diamond pattern", () => {
    // A -> B -> D
    // A -> C -> D
    // Adding D -> A creates cycle
    const deps = [dep("A", "B"), dep("A", "C"), dep("B", "D"), dep("C", "D")];
    const result = wouldCreateCycle(deps, tid("D"), tid("A"));
    expect(result.hasCycle).toBe(true);
  });
});
