/**
 * Dependency types for task relationships.
 * See DATA_MODEL.md Section 2.2
 */

import type { TaskId } from "./branded.types";

/**
 * Dependency type classification.
 * Currently only FS (Finish-to-Start) is implemented.
 *
 * @type FS - Finish-to-Start: A finishes → B starts (most common)
 * @type SS - Start-to-Start: A starts → B can start
 * @type FF - Finish-to-Finish: A finishes → B can finish
 * @type SF - Start-to-Finish: A starts → B can finish (rare)
 */
export type DependencyType = "FS" | "SS" | "FF" | "SF";

/**
 * Represents a dependency relationship between two tasks.
 *
 * @property id - Unique identifier (UUID v4)
 * @property fromTaskId - Source task ID (predecessor)
 * @property toTaskId - Target task ID (successor)
 * @property type - Dependency type (currently only FS)
 * @property lag - Offset days (positive = gap, negative = overlap)
 * @property createdAt - Creation timestamp (ISO 8601)
 */
export interface Dependency {
  id: string;
  fromTaskId: TaskId;
  toTaskId: TaskId;
  type: DependencyType;
  lag?: number;
  createdAt: string;
}

/**
 * Result of cycle detection algorithm.
 */
export interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath?: TaskId[]; // Task IDs forming the cycle (e.g., ['A', 'B', 'C', 'A'])
}

/**
 * Result of date adjustment calculation.
 */
export interface DateAdjustment {
  taskId: TaskId;
  oldStartDate: string;
  oldEndDate: string;
  newStartDate: string;
  newEndDate: string;
}

/**
 * Arrow path calculation result for rendering.
 */
export interface ArrowPath {
  path: string; // SVG path d attribute
  arrowHead: {
    x: number;
    y: number;
    angle: number; // Rotation angle in degrees
  };
}

/**
 * Task position for arrow routing.
 */
export interface TaskPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Dependency drag state for creating new dependencies.
 */
export interface DependencyDragState {
  isDragging: boolean;
  fromTaskId: TaskId | null;
  fromSide: "start" | "end" | null;
  currentPosition: { x: number; y: number };
  validTargets: Set<TaskId>;
  invalidTargets: Set<TaskId>;
}

/**
 * Fields that are safe to update on an existing dependency.
 * Excludes id, fromTaskId, toTaskId, and createdAt to prevent
 * bypassing cycle detection or breaking referential integrity.
 */
export type DependencyUpdatableFields = Partial<
  Pick<Dependency, "type" | "lag">
>;

/**
 * Result of attempting to add a dependency.
 * Discriminated union on `success` for safe type narrowing.
 */
export type AddDependencyResult =
  | { success: true; dependency: Dependency }
  | { success: false; error: string };
