/**
 * Core data types for the Gantt Chart application.
 * Aligned with DATA_MODEL.md Section 3.1
 */

import type { HexColor } from "./branded.types";

/**
 * Task type classification.
 * Based on competitive analysis of SVAR React Gantt.
 * See: docs/design/COMPETITIVE_ANALYSIS.md
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
 * @property duration - Task duration in days (calculated from dates, also user-editable — recalculates end date)
 * @property progress - Task completion percentage (0-100)
 * @property color - Task color as hex code (e.g., "#FAA916")
 * @property order - Display order for task reordering (0-indexed)
 * @property metadata - Extensibility field for future features
 *
 * Extended properties (based on competitive analysis):
 * @property type - Task type classification (default: 'task')
 * @property parent - Parent task ID for hierarchical tasks (optional)
 * @property open - Expanded/collapsed state for summary tasks (default: true)
 */
export interface Task {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  color: HexColor;
  order: number;
  metadata: Record<string, unknown>;

  // Extended properties for advanced features
  type?: TaskType;
  parent?: string;
  open?: boolean;

  // Color override for manual overrides in automatic color modes
  colorOverride?: HexColor;
}
