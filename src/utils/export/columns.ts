/**
 * Export column definitions — single source of truth.
 * Consumed by ExportRenderer (React), taskTableRenderer (SVG/PDF),
 * and calculations (optimal column widths).
 */

import type { ExportColumnKey } from "./types";

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
  ) as Record<ExportColumnKey, string>;
