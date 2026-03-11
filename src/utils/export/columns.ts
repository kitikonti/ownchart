/**
 * Export column definitions — single source of truth.
 * Consumed by ExportRenderer (React), taskTableRenderer (SVG/PDF),
 * and calculations (optimal column widths).
 */

import type { ExportColumnKey, ExportDataColumnKey } from "./types";
import type { Task } from "../../types/chart.types";

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
] as const;

/**
 * Returns the display string for a data column cell.
 * Returns null when no value is available (renders "—"),
 * empty string when the cell should be blank (e.g. milestone end date).
 */
export function getColumnDisplayValue(
  task: Task,
  key: ExportDataColumnKey
): string | null {
  const isSummary = task.type === "summary";
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
    if (isSummary) {
      return task.duration !== undefined && task.duration > 0
        ? `${task.duration} days`
        : null;
    }
    // Regular task ("task" type, or any future type that is not summary/milestone)
    return task.duration !== undefined ? `${task.duration}` : null;
  }
  // progress
  if (key === "progress") {
    return task.progress !== undefined ? `${task.progress}%` : null;
  }
  // Exhaustive guard: if a new ExportDataColumnKey is added without a handler
  // above, TypeScript will flag this line as unreachable (the `never` type).
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
 * The `as` cast is safe here: the map is directly over EXPORT_COLUMNS whose keys
 * are all ExportColumnKey values. Object.fromEntries cannot infer the key type
 * narrower than `string`, so we widen explicitly.
 */
export const HEADER_LABELS: Record<ExportColumnKey, string> =
  Object.fromEntries(
    EXPORT_COLUMNS.map((col) => [col.key, col.label])
  ) as Record<ExportColumnKey, string>;
