/**
 * Cycle Detection Algorithm for Dependencies
 * Uses Depth-First Search (DFS) with recursion-stack tracking to detect cycles.
 *
 * Time Complexity: O(V + E) where V = tasks, E = dependencies
 * Space Complexity: O(V) for the recursion stack and path tracking
 */

import type { TaskId } from "../../types/branded.types";
import type {
  Dependency,
  CycleDetectionResult,
} from "../../types/dependency.types";

/** Build a forward adjacency list (fromTaskId → [toTaskId, ...]) from a dependency array. */
function buildAdjacencyList(deps: Dependency[]): Map<TaskId, TaskId[]> {
  const graph = new Map<TaskId, TaskId[]>();
  for (const dep of deps) {
    if (!graph.has(dep.fromTaskId)) {
      graph.set(dep.fromTaskId, []);
    }
    graph.get(dep.fromTaskId)!.push(dep.toTaskId);
  }
  return graph;
}

/**
 * DFS traversal with recursion-stack (three-color) tracking to detect cycles.
 *
 * Mutates `visited`, `inStack`, and `path` in place and backtracks on exit,
 * keeping space complexity O(V) instead of O(V²) — no path array is copied
 * on each recursive call.
 *
 * @param node    - Current node being visited
 * @param graph   - Adjacency list of the full graph
 * @param visited - Nodes that have been fully processed (black)
 * @param inStack - Nodes on the current recursion path (gray)
 * @param path    - Ordered list of nodes on the current path (for cycle extraction)
 * @returns The cycle path (repeated start node at both ends) if a back edge is
 *   found, null if no cycle is reachable from this node.
 */
function dfsDetectCycle(
  node: TaskId,
  graph: Map<TaskId, TaskId[]>,
  visited: Set<TaskId>,
  inStack: Set<TaskId>,
  path: TaskId[]
): TaskId[] | null {
  visited.add(node);
  inStack.add(node);
  path.push(node);

  for (const neighbor of graph.get(node) ?? []) {
    if (!visited.has(neighbor)) {
      const result = dfsDetectCycle(neighbor, graph, visited, inStack, path);
      if (result) return result;
    } else if (inStack.has(neighbor)) {
      // Back edge found — extract the cycle segment from path
      const cycleStart = path.indexOf(neighbor);
      return [...path.slice(cycleStart), neighbor];
    }
  }

  // Backtrack: node is fully explored; remove from current path
  inStack.delete(node);
  path.pop();
  return null;
}

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
  const graph = buildAdjacencyList(dependencies);

  if (newDependency) {
    if (!graph.has(newDependency.fromTaskId)) {
      graph.set(newDependency.fromTaskId, []);
    }
    graph.get(newDependency.fromTaskId)!.push(newDependency.toTaskId);

    // Ensure toTaskId is in the graph so all nodes are covered by traversal
    if (!graph.has(newDependency.toTaskId)) {
      graph.set(newDependency.toTaskId, []);
    }
  }

  const visited = new Set<TaskId>();
  const inStack = new Set<TaskId>();

  // Check from every unvisited node to handle disconnected components
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const cycle = dfsDetectCycle(node, graph, visited, inStack, []);
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
  // Self-dependency is always a cycle — short-circuit before graph traversal
  if (fromTaskId === toTaskId) {
    return { hasCycle: true, cyclePath: [fromTaskId, fromTaskId] };
  }

  // Dummy id/createdAt are intentional — this dep is never stored, only used
  // to test whether the proposed edge would introduce a cycle.
  const proposedDep: Dependency = {
    id: "temp",
    fromTaskId,
    toTaskId,
    type: "FS",
    createdAt: "",
  };

  return detectCycle(dependencies, proposedDep);
}
