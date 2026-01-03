/**
 * Core data types for the Gantt Chart application.
 * Aligned with DATA_MODEL.md Section 3.1
 */

/**
 * Task type classification.
 * Based on competitive analysis of SVAR React Gantt.
 * See: concept/docs/COMPETITIVE_ANALYSIS.md
 *
 * @type task - Regular task with start/end dates
 * @type summary - Parent task with children (dates computed from children)
 * @type milestone - Zero-duration task marking important date (rendered as diamond)
 */
export type TaskType = "task" | "summary" | "milestone";

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
 *
 * Extended properties (based on competitive analysis):
 * @property type - Task type classification (default: 'task')
 * @property parent - Parent task ID for hierarchical tasks (optional)
 * @property open - Expanded/collapsed state for summary tasks (default: true)
 * @property lazy - Lazy-load children flag for performance (optional)
 * @property baseStart - Original planned start date for baseline comparison (Phase 2)
 * @property baseEnd - Original planned end date for baseline comparison (Phase 2)
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

  // Extended properties for advanced features
  type?: TaskType;
  parent?: string;
  open?: boolean;
  lazy?: boolean;
  baseStart?: string;
  baseEnd?: string;
}
