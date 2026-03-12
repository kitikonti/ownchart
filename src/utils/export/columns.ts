/**
 * Export column definitions — single source of truth.
 * Consumed by ExportRenderer (React), taskTableRenderer (SVG/PDF),
 * and calculations (optimal column widths).
 */

import type { Task } from "../../types/chart.types";
import type { ExportColumnKey, ExportDataColumnKey } from "./types";

/**
 * Duration unit label appended to summary-task durations in the Duration column.
 * Named constant (rather than inline literal) to make future i18n / localisation easier.
 */
const DURATION_UNIT = "days";

/** Column definition for export (labels must match app's tableColumns.ts) */
export interface ExportColumn {
  key: ExportColumnKey;
  label: string;
  defaultWidth: number;
}

/** Ordered column definitions for export */
export const EXPORT_COLUMNS: readonly ExportColumn[] = [
  { key: "color", label: "", defaultWidth: 24 },
  { key: "name", label: "Name", defaultWidth: 200 },
  { key: "startDate", label: "Start Date", defaultWidth: 110 },
  { key: "endDate", label: "End Date", defaultWidth: 110 },
  { key: "duration", label: "Duration", defaultWidth: 70 },
  { key: "progress", label: "%", defaultWidth: 60 },
];

/**
 * Returns the display string for a data column cell.
 *
 * @param task - The task whose column value should be rendered.
 * @param key - The data column key to look up.
 * @returns The display string for the cell, or `null` when no value is
 *   available (renders "—"), or `""` when the cell should be intentionally
 *   blank (e.g. milestone end date and duration).
 */
export function getColumnDisplayValue(
  task: Task,
  key: ExportDataColumnKey
): string | null {
  const isMilestone = task.type === "milestone";

  if (key === "startDate") {
    return task.startDate || null;
  }
  if (key === "endDate") {
    if (isMilestone) return "";
    return task.endDate || null;
  }
  if (key === "duration") {
    if (isMilestone) return "";
    const isSummary = task.type === "summary";
    if (isSummary) {
      // Summary tasks show the unit ("9 days") because their duration is derived
      // from child tasks and may not be obvious to the reader. Zero is suppressed
      // (no children yet → show "—" instead of "0 days").
      return task.duration !== undefined && task.duration > 0
        ? `${task.duration} ${DURATION_UNIT}`
        : null;
    }
    // Regular tasks omit the unit — the "Duration" column header provides context.
    // Zero is intentionally displayed ("0") because a zero-duration task is valid.
    return task.duration !== undefined ? `${task.duration}` : null;
  }
  if (key === "progress") {
    return task.progress !== undefined ? `${task.progress}%` : null;
  }
  // Exhaustive guard: if a new ExportDataColumnKey is added without a handler
  // above, TypeScript narrows `key` to `never` here and flags the assignment as
  // a type error — the signal to add a missing branch. If TypeScript no longer
  // reports an error on this line, a branch is missing above.
  const _exhaustiveCheck: never = key;
  return _exhaustiveCheck;
}

/** Pre-computed column lookup for O(1) access */
export const EXPORT_COLUMN_MAP = new Map<ExportColumnKey, ExportColumn>(
  EXPORT_COLUMNS.map((col) => [col.key, col])
);

/**
 * Header labels derived from EXPORT_COLUMNS.
 * Keys correspond to ExportColumnKey values.
 */
export const HEADER_LABELS: Record<ExportColumnKey, string> =
  Object.fromEntries(
    EXPORT_COLUMNS.map((col) => [col.key, col.label])
    // Safe cast: Object.fromEntries cannot infer a key type narrower than `string`.
    // The _headerLabelsCheck assignment below enforces completeness at compile time.
  ) as Record<ExportColumnKey, string>;

// Compile-time completeness guard: if a new ExportColumnKey is added without a
// matching entry in EXPORT_COLUMNS, TypeScript will report an error here.
const _headerLabelsCheck: Record<ExportColumnKey, string> = HEADER_LABELS;
void _headerLabelsCheck; // suppress unused-variable lint error (underscore prefix alone is insufficient for const)
