/**
 * Cycle Detection Algorithm for Dependencies
 * Uses Depth-First Search (DFS) to detect cycles in the dependency graph.
 *
 * Time Complexity: O(V + E) where V = tasks, E = dependencies
 * Space Complexity: O(V) for recursion stack
 */

import type { TaskId } from "../../types/branded.types";
import type {
  Dependency,
  CycleDetectionResult,
} from "../../types/dependency.types";

/**
 * Detect if adding a dependency would create a cycle in the graph.
 *
 * @param dependencies - Current list of dependencies
 * @param newDependency - Optional new dependency to test
 * @returns CycleDetectionResult with hasCycle and optional cyclePath
 */
export function detectCycle(
  dependencies: Dependency[],
  newDependency?: Dependency
): CycleDetectionResult {
  // Build adjacency list
  const graph = new Map<TaskId, TaskId[]>();

  // Add existing dependencies
  for (const dep of dependencies) {
    if (!graph.has(dep.fromTaskId)) {
      graph.set(dep.fromTaskId, []);
    }
    graph.get(dep.fromTaskId)!.push(dep.toTaskId);
  }

  // Add proposed new dependency
  if (newDependency) {
    if (!graph.has(newDependency.fromTaskId)) {
      graph.set(newDependency.fromTaskId, []);
    }
    graph.get(newDependency.fromTaskId)!.push(newDependency.toTaskId);

    // Also ensure toTaskId is in the graph (for complete traversal)
    if (!graph.has(newDependency.toTaskId)) {
      graph.set(newDependency.toTaskId, []);
    }
  }

  // DFS with recursion stack tracking
  const visited = new Set<TaskId>();
  const inStack = new Set<TaskId>();

  function dfs(node: TaskId, path: TaskId[]): TaskId[] | null {
    visited.add(node);
    inStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const result = dfs(neighbor, [...path]);
        if (result) return result;
      } else if (inStack.has(neighbor)) {
        // Cycle found - return cycle path
        const cycleStart = path.indexOf(neighbor);
        return [...path.slice(cycleStart), neighbor];
      }
    }

    inStack.delete(node);
    return null;
  }

  // Check from all nodes (handles disconnected components)
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const cycle = dfs(node, []);
      if (cycle) {
        return { hasCycle: true, cyclePath: cycle };
      }
    }
  }

  return { hasCycle: false };
}

/**
 * Check if a specific dependency would create a cycle.
 * Convenience wrapper around detectCycle.
 *
 * @param dependencies - Current list of dependencies
 * @param fromTaskId - Source task ID
 * @param toTaskId - Target task ID
 * @returns CycleDetectionResult
 */
export function wouldCreateCycle(
  dependencies: Dependency[],
  fromTaskId: TaskId,
  toTaskId: TaskId
): CycleDetectionResult {
  // Self-dependency is always a cycle
  if (fromTaskId === toTaskId) {
    return { hasCycle: true, cyclePath: [fromTaskId, fromTaskId] };
  }

  const proposedDep: Dependency = {
    id: "temp",
    fromTaskId,
    toTaskId,
    type: "FS",
    createdAt: "",
  };

  return detectCycle(dependencies, proposedDep);
}
