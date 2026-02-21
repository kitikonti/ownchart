/**
 * Dependency types for task relationships.
 * See DATA_MODEL.md Section 2.2
 */

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
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  lag?: number;
  createdAt: string;
}

/**
 * Result of cycle detection algorithm.
 */
export interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath?: string[]; // Task IDs forming the cycle (e.g., ['A', 'B', 'C', 'A'])
}

/**
 * Result of date adjustment calculation.
 */
export interface DateAdjustment {
  taskId: string;
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
  fromTaskId: string | null;
  fromSide: "start" | "end" | null;
  currentPosition: { x: number; y: number };
  validTargets: Set<string>;
  invalidTargets: Set<string>;
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
