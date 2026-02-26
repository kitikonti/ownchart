/**
 * Table column configuration for the task spreadsheet.
 * Defines column properties, widths, and editing behavior.
 */

import type { EditableField } from "../types/task.types";
import type { ValidationResult } from "../utils/validation";
import type { DensityConfig } from "../types/preferences.types";
import {
  validateTaskName,
  validateDateString,
  validateDuration,
  validateProgress,
  validateColor,
} from "../utils/validation";

/**
 * Known column identifiers.
 * Store/file-format boundaries use `string` for forward compatibility.
 */
export type ColumnId =
  | "rowNumber"
  | "color"
  | "name"
  | "startDate"
  | "endDate"
  | "duration"
  | "progress";

/**
 * Column renderer types.
 */
export type CellRenderer = "text" | "date" | "number" | "color" | "custom";

/**
 * Column definition interface.
 */
export interface ColumnDefinition {
  /** Unique column identifier */
  id: ColumnId;

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

  /** Full label for menus/dropdowns (falls back to label if not set) */
  menuLabel?: string;

  /** Whether to show right border (default: true). Set false for borderless columns like color. */
  showRightBorder?: boolean;
}

/** Wrap a string validator with a typeof guard. */
function stringValidator(
  validate: (v: string) => ValidationResult
): (value: unknown) => ValidationResult {
  return (value) => {
    if (typeof value !== "string")
      return { valid: false, error: "Expected string" };
    return validate(value);
  };
}

/** Wrap a number validator with a typeof + NaN guard. */
function numberValidator(
  validate: (v: number) => ValidationResult
): (value: unknown) => ValidationResult {
  return (value) => {
    if (typeof value !== "number" || Number.isNaN(value))
      return { valid: false, error: "Expected number" };
    return validate(value);
  };
}

/** The row-number column has no data field; used for selection and visual numbering. */
export const ROW_NUMBER_COLUMN_ID: ColumnId = "rowNumber";

/** The name column requires special layout handling (minmax, indentation). */
export const NAME_COLUMN_ID: ColumnId = "name";

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
    validator: stringValidator(validateColor),
    showRightBorder: false,
  },
  {
    id: "name",
    field: "name",
    label: "Name",
    defaultWidth: "minmax(200px, 1fr)",
    editable: true,
    renderer: "text",
    validator: stringValidator(validateTaskName),
  },
  {
    id: "startDate",
    field: "startDate",
    label: "Start Date",
    defaultWidth: "130px",
    editable: true,
    hideable: true,
    renderer: "date",
    validator: stringValidator(validateDateString),
  },
  {
    id: "endDate",
    field: "endDate",
    label: "End Date",
    defaultWidth: "130px",
    editable: true,
    hideable: true,
    renderer: "date",
    validator: stringValidator(validateDateString),
  },
  {
    id: "duration",
    field: "duration",
    label: "Duration",
    defaultWidth: "100px",
    editable: true, // User-editable, recalculates end date
    hideable: true,
    renderer: "number",
    validator: numberValidator(validateDuration),
    formatter: (value) => `${value} ${Number(value) === 1 ? "day" : "days"}`,
  },
  {
    id: "progress",
    field: "progress",
    label: "%",
    menuLabel: "Progress",
    defaultWidth: "70px",
    editable: true,
    hideable: true,
    renderer: "number",
    validator: numberValidator(validateProgress),
    formatter: (value) => `${value}%`,
  },
];

/** Default pixel width for columns without a density-specific default */
const DEFAULT_COLUMN_WIDTH_PX = 100;

/**
 * Maps column IDs to their corresponding density config key.
 * 'name' is excluded — it uses minmax() and is handled separately in getDensityAwareWidth.
 */
const DENSITY_COLUMN_KEY: Record<
  string,
  keyof DensityConfig["columnWidths"] | undefined
> = {
  rowNumber: "rowNumber",
  color: "color",
  startDate: "startDate",
  endDate: "endDate",
  duration: "duration",
  progress: "progress",
};

/**
 * Get the density-aware default width (px) for a column.
 * Returns undefined if the column has no density mapping.
 */
function getDensityDefault(
  columnId: string,
  densityConfig: DensityConfig
): number | undefined {
  const key = DENSITY_COLUMN_KEY[columnId];
  return key ? densityConfig.columnWidths[key] : undefined;
}

/**
 * Get visible columns based on view settings.
 * Filters out user-hidden columns (hideable only).
 */
export function getVisibleColumns(hiddenColumns: string[]): ColumnDefinition[] {
  return TASK_COLUMNS.filter((col) => {
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
 * Get the current pixel width for a column.
 * Reads from store columnWidths if available, falls back to density-aware defaults.
 * Note: Primarily used for hideable columns (startDate, endDate, duration, progress).
 * The "name" column uses minmax() and falls through to the default.
 */
export function getColumnPixelWidth(
  columnId: string,
  columnWidths: Record<string, number>,
  densityConfig: DensityConfig
): number {
  if (columnWidths[columnId] !== undefined) {
    return columnWidths[columnId];
  }
  return getDensityDefault(columnId, densityConfig) ?? DEFAULT_COLUMN_WIDTH_PX;
}

/**
 * Get density-aware default width for a column.
 * Returns the width string adjusted for the current density setting.
 */
export function getDensityAwareWidth(
  columnId: string,
  densityConfig: DensityConfig
): string {
  if (columnId === NAME_COLUMN_ID) {
    return `minmax(${densityConfig.columnWidths.nameMin}px, 1fr)`;
  }

  const defaultPx = getDensityDefault(columnId, densityConfig);
  if (defaultPx !== undefined) {
    return `${defaultPx}px`;
  }

  // Fallback to the original column definition
  const col = TASK_COLUMNS.find((c) => c.id === columnId);
  return col?.defaultWidth ?? `${DEFAULT_COLUMN_WIDTH_PX}px`;
}
