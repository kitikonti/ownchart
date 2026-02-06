/**
 * Table column configuration for the task spreadsheet.
 * Defines column properties, widths, and editing behavior.
 */

import type { EditableField } from "../store/slices/taskSlice";
import type { ValidationResult } from "../utils/validation";
import type { DensityConfig } from "../types/preferences.types";
import {
  validateTaskName,
  validateDateString,
  validateProgress,
  validateColor,
} from "../utils/validation";

/**
 * Column renderer types.
 */
export type CellRenderer = "text" | "date" | "number" | "color" | "custom";

/**
 * Column definition interface.
 */
export interface ColumnDefinition {
  /** Unique column identifier */
  id: string;

  /** Task field name (null for non-data columns like drag handle) */
  field?: EditableField;

  /** Column header label */
  label: string;

  /** Default column width (CSS grid value) */
  defaultWidth: string;

  /** Whether the column is editable */
  editable: boolean;

  /** Whether the column can be hidden by the user */
  hideable?: boolean;

  /** Cell renderer type */
  renderer?: CellRenderer;

  /** Validation function for the field */
  validator?: (value: unknown) => ValidationResult;

  /** Formatter function to display value */
  formatter?: (value: unknown) => string;
}

/**
 * Task table column definitions.
 */
export const TASK_COLUMNS: ColumnDefinition[] = [
  {
    id: "rowNumber",
    label: "",
    defaultWidth: "40px",
    editable: false,
    renderer: "custom",
  },
  {
    id: "color",
    field: "color",
    label: "",
    defaultWidth: "32px",
    editable: true,
    renderer: "color",
    validator: (value) => validateColor(String(value)),
  },
  {
    id: "name",
    field: "name",
    label: "Name",
    defaultWidth: "minmax(200px, 1fr)",
    editable: true,
    renderer: "text",
    validator: (value) => validateTaskName(String(value)),
  },
  {
    id: "startDate",
    field: "startDate",
    label: "Start Date",
    defaultWidth: "130px",
    editable: true,
    hideable: true,
    renderer: "date",
    validator: (value) => validateDateString(String(value)),
  },
  {
    id: "endDate",
    field: "endDate",
    label: "End Date",
    defaultWidth: "130px",
    editable: true,
    hideable: true,
    renderer: "date",
    validator: (value) => validateDateString(String(value)),
  },
  {
    id: "duration",
    field: "duration",
    label: "Duration",
    defaultWidth: "100px",
    editable: true, // Editable per user request
    hideable: true,
    renderer: "number",
    validator: (value): ValidationResult => {
      const num = Number(value);
      if (isNaN(num) || num < 1) {
        return { valid: false, error: "Duration must be at least 1 day" };
      }
      return { valid: true };
    },
    formatter: (value) => `${value} ${Number(value) === 1 ? "day" : "days"}`,
  },
  {
    id: "progress",
    field: "progress",
    label: "%",
    defaultWidth: "70px",
    editable: true,
    renderer: "number",
    validator: (value) => validateProgress(Number(value)),
    formatter: (value) => `${value}%`,
  },
];

/**
 * Get visible columns based on view settings.
 * Filters out user-hidden columns (hideable only) and progress column.
 */
export function getVisibleColumns(
  hiddenColumns: string[],
  showProgress: boolean
): ColumnDefinition[] {
  return TASK_COLUMNS.filter((col) => {
    // Progress column controlled by showProgress toggle
    if (col.id === "progress") return showProgress;
    // Only hideable columns can be hidden by the user
    if (col.hideable && hiddenColumns.includes(col.id)) return false;
    return true;
  });
}

/**
 * Get columns that can be toggled by the user.
 */
export function getHideableColumns(): ColumnDefinition[] {
  return TASK_COLUMNS.filter((col) => col.hideable);
}

/**
 * Get density-aware default width for a column.
 * Returns the width string adjusted for the current density setting.
 */
export function getDensityAwareWidth(
  columnId: string,
  densityConfig: DensityConfig
): string {
  const { columnWidths } = densityConfig;

  switch (columnId) {
    case "rowNumber":
      return `${columnWidths.rowNumber}px`;
    case "color":
      return `${columnWidths.color}px`;
    case "name":
      return `minmax(${columnWidths.nameMin}px, 1fr)`;
    case "startDate":
      return `${columnWidths.startDate}px`;
    case "endDate":
      return `${columnWidths.endDate}px`;
    case "duration":
      return `${columnWidths.duration}px`;
    case "progress":
      return `${columnWidths.progress}px`;
    default: {
      // Fallback to the original column definition
      const col = TASK_COLUMNS.find((c) => c.id === columnId);
      return col?.defaultWidth ?? "100px";
    }
  }
}
