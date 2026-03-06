/**
 * Unit tests for internal graph construction helpers.
 * Sprint 1.4 - Dependencies
 */

import { describe, it, expect } from "vitest";
import {
  ensureList,
  buildAdjacencyList,
  buildReverseAdjacencyList,
} from "../../../../src/utils/graph/graphHelpers";
import type { Dependency } from "../../../../src/types/dependency.types";
import { tid } from "../../../helpers/branded";

// Helper to create a minimal dependency
function dep(from: string, to: string): Dependency {
  return {
    id: `${from}-${to}`,
    fromTaskId: tid(from),
    toTaskId: tid(to),
    type: "FS",
    createdAt: "",
  };
}

describe("ensureList", () => {
  it("should insert an empty list and return it when key is absent", () => {
    const map = new Map<string, number[]>();
    const list = ensureList(map, "a");
    expect(list).toEqual([]);
    expect(map.get("a")).toBe(list);
  });

  it("should return the existing list without replacing it when key is present", () => {
    const map = new Map<string, number[]>();
    const original = [1, 2];
    map.set("a", original);
    const list = ensureList(map, "a");
    expect(list).toBe(original);
  });

  it("should allow mutations of the returned list to be reflected in the map", () => {
    const map = new Map<string, number[]>();
    const list = ensureList(map, "a");
    list.push(42);
    expect(map.get("a")).toEqual([42]);
  });

  it("should handle multiple independent keys without cross-contamination", () => {
    const map = new Map<string, number[]>();
    ensureList(map, "a").push(1);
    ensureList(map, "b").push(2);
    expect(map.get("a")).toEqual([1]);
    expect(map.get("b")).toEqual([2]);
  });
});

describe("buildAdjacencyList", () => {
  it("should return an empty map for no dependencies", () => {
    expect(buildAdjacencyList([])).toEqual(new Map());
  });

  it("should build a forward edge fromTaskId → toTaskId", () => {
    const graph = buildAdjacencyList([dep("A", "B")]);
    expect(graph.get(tid("A"))).toEqual([tid("B")]);
  });

  it("should accumulate multiple outgoing edges for the same source", () => {
    const graph = buildAdjacencyList([dep("A", "B"), dep("A", "C")]);
    expect(graph.get(tid("A"))).toEqual([tid("B"), tid("C")]);
  });

  it("should not add an entry for a pure sink node", () => {
    const graph = buildAdjacencyList([dep("A", "B")]);
    expect(graph.has(tid("B"))).toBe(false);
  });

  it("should build independent edges for unrelated source nodes", () => {
    const graph = buildAdjacencyList([dep("A", "B"), dep("C", "D")]);
    expect(graph.get(tid("A"))).toEqual([tid("B")]);
    expect(graph.get(tid("C"))).toEqual([tid("D")]);
  });

  it("should preserve insertion order for multiple edges from the same source", () => {
    const graph = buildAdjacencyList([dep("A", "C"), dep("A", "B"), dep("A", "D")]);
    expect(graph.get(tid("A"))).toEqual([tid("C"), tid("B"), tid("D")]);
  });
});

describe("buildReverseAdjacencyList", () => {
  it("should return an empty map for no dependencies", () => {
    expect(buildReverseAdjacencyList([])).toEqual(new Map());
  });

  it("should build a reverse edge toTaskId → fromTaskId", () => {
    const graph = buildReverseAdjacencyList([dep("A", "B")]);
    expect(graph.get(tid("B"))).toEqual([tid("A")]);
  });

  it("should accumulate multiple incoming edges for the same target", () => {
    const graph = buildReverseAdjacencyList([dep("A", "C"), dep("B", "C")]);
    expect(graph.get(tid("C"))).toEqual([tid("A"), tid("B")]);
  });

  it("should not add an entry for a pure source node", () => {
    const graph = buildReverseAdjacencyList([dep("A", "B")]);
    expect(graph.has(tid("A"))).toBe(false);
  });

  it("should produce the structural inverse of buildAdjacencyList", () => {
    const deps = [dep("A", "B"), dep("B", "C")];
    const forward = buildAdjacencyList(deps);
    const reverse = buildReverseAdjacencyList(deps);
    // A → B in forward becomes B → A in reverse
    expect(forward.get(tid("A"))).toEqual([tid("B")]);
    expect(reverse.get(tid("B"))).toEqual([tid("A")]);
    // B → C in forward becomes C → B in reverse
    expect(forward.get(tid("B"))).toEqual([tid("C")]);
    expect(reverse.get(tid("C"))).toEqual([tid("B")]);
  });
});
