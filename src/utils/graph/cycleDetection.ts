/**
 * Cycle Detection Algorithm for Dependencies
 * Uses Depth-First Search (DFS) with recursion-stack tracking to detect cycles.
 *
 * Time Complexity: O(V + E) where V = tasks, E = dependencies
 * Space Complexity: O(V) for the traversal stack and path tracking
 */

import type { TaskId } from "../../types/branded.types";
import type {
  Dependency,
  CycleDetectionResult,
} from "../../types/dependency.types";
import { buildAdjacencyList, getOrCreateList } from "./graphHelpers";

/**
 * Sentinel ID used for the temporary probe dependency in `wouldCreateCycle`.
 * The value is never persisted — it only needs to be distinct from real UUIDs.
 */
const PROBE_DEPENDENCY_ID = "__probe__";

/**
 * Arbitrary valid `DependencyType` for the probe object — ignored by graph construction.
 * Explicitly typed so any future change to the DependencyType union surfaces here at compile time.
 */
const PROBE_DEPENDENCY_TYPE: Dependency["type"] = "FS";

/**
 * Iterative DFS with three-colour marking to detect back edges (cycles).
 *
 * An explicit [node, neighborIndex] stack replaces the call stack so traversal
 * depth is O(1) in stack frames regardless of graph size — safe even for linear
 * chains with thousands of nodes.
 *
 * `visited` and `inStack` are mutated in place and shared across restarts in the
 * outer loop, letting `detectCycle` skip already-processed components efficiently.
 *
 * The `path` array mirrors the explicit stack: `path[i] === stack[i][0]` at all
 * times. `pathIndex` maintains the inverse mapping (node → index in `path`) for
 * O(1) cycle-segment extraction when a back edge is found.
 *
 * @param startNode - Entry point for this DFS traversal
 * @param graph     - Forward adjacency list
 * @param visited   - Fully-processed nodes (shared across restarts)
 * @param inStack   - Nodes on the current traversal path (shared across restarts)
 * @returns The cycle path (start node repeated at both ends), or null if no cycle found
 */
function dfsDetectCycle(
  startNode: TaskId,
  graph: Map<TaskId, TaskId[]>,
  visited: Set<TaskId>,
  inStack: Set<TaskId>
): TaskId[] | null {
  // `path` mirrors the stack: path[i] === stack[i][0] at all times.
  // `pathIndex` is the inverse: pathIndex.get(node) === its current index in path,
  // enabling O(1) cycle-start lookup when a back edge is found.
  const path: TaskId[] = [startNode];
  const pathIndex = new Map<TaskId, number>([[startNode, 0]]);
  const stack: Array<[TaskId, number]> = [[startNode, 0]];
  visited.add(startNode);
  inStack.add(startNode);

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const node = frame[0];
    const neighbors = graph.get(node) ?? [];

    if (frame[1] >= neighbors.length) {
      // All neighbors processed — backtrack
      inStack.delete(node);
      pathIndex.delete(node);
      path.pop();
      stack.pop();
      continue;
    }

    const neighbor = neighbors[frame[1]++];

    if (inStack.has(neighbor)) {
      // Back edge: neighbor is on the current path — extract and return the cycle.
      // pathIndex gives O(1) lookup of the cycle's start position in path.
      const cycleStart = pathIndex.get(neighbor)!;
      return [...path.slice(cycleStart), neighbor];
    }

    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      inStack.add(neighbor);
      pathIndex.set(neighbor, path.length);
      path.push(neighbor);
      stack.push([neighbor, 0]);
    }
  }

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
    getOrCreateList(graph, newDependency.fromTaskId).push(
      newDependency.toTaskId
    );
    // The sink node needs no pre-inserted entry: the DFS resolves missing nodes via
    // `graph.get(node) ?? []`, and a sink-only node has no outgoing edges so it cannot
    // originate an undiscovered cycle — any cycle through it is reached from its
    // predecessors, which are already registered as graph keys.
  }

  const visited = new Set<TaskId>();
  const inStack = new Set<TaskId>();

  // Check from every unvisited node to handle disconnected components
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const cycle = dfsDetectCycle(node, graph, visited, inStack);
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

  // id/type/createdAt are ignored by graph construction — only fromTaskId/toTaskId
  // matter. This dep is never stored; PROBE_DEPENDENCY_ID flags it as ephemeral.
  const proposedDep: Dependency = {
    id: PROBE_DEPENDENCY_ID,
    fromTaskId,
    toTaskId,
    type: PROBE_DEPENDENCY_TYPE,
    createdAt: "", // placeholder; ignored by graph construction
  };

  return detectCycle(dependencies, proposedDep);
}
