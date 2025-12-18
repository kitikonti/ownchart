/**
 * Core data types for the Gantt Chart application.
 * Aligned with DATA_MODEL.md Section 3.1
 */

/**
 * Dependency type enumeration.
 * MVP: Only Finish-to-Start (FS) is supported.
 * Future: SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)
 */
export enum DependencyType {
  /** Finish-to-Start: Successor task starts after predecessor finishes */
  FS = 'FS',
}

/**
 * Represents a dependency between two tasks.
 *
 * @property id - Unique identifier (UUID v4)
 * @property fromTaskId - ID of the predecessor task
 * @property toTaskId - ID of the successor task
 * @property type - Dependency type (FS only in MVP)
 */
export interface Dependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
}

/**
 * Represents a task in the Gantt chart.
 *
 * @property id - Unique identifier (UUID v4)
 * @property name - Task name (1-200 characters)
 * @property startDate - Task start date in ISO format (YYYY-MM-DD)
 * @property endDate - Task end date in ISO format (YYYY-MM-DD)
 * @property duration - Task duration in days (calculated from dates)
 * @property progress - Task completion percentage (0-100)
 * @property color - Task color as hex code (e.g., "#3b82f6")
 * @property order - Display order for task reordering (0-indexed)
 * @property metadata - Extensibility field for future features
 */
export interface Task {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  color: string;
  order: number;
  metadata: Record<string, unknown>;
}
