/**
 * Shared calculation utilities for PNG export.
 * Centralizes zoom, dimension, and date range calculations.
 */

import type { Task } from "../../types/chart.types";
import type { UiDensity } from "../../types/preferences.types";
import { DENSITY_CONFIG } from "../../config/densityConfig";
import { addDays } from "../dateUtils";
import { getTaskLevel } from "../hierarchy";
import {
  calculateLabelPaddingDays,
  calculateColumnWidth,
} from "../textMeasurement";
import type { ExportOptions, ExportColumnKey } from "./types";
import { getColumnDisplayValue, HEADER_LABELS } from "./columns";

/** Base pixels per day at 100% zoom */
export const BASE_PIXELS_PER_DAY = 25;

/** Default padding in days added to the left of the project date range */
const DEFAULT_LEFT_PADDING_DAYS = 7;

/** Default padding in days added to the right of the project date range */
const DEFAULT_RIGHT_PADDING_DAYS = 7;

/** Default date range look-back in days when no project date range is available */
const DEFAULT_RANGE_LOOKBACK_DAYS = 7;

/** Default date range look-ahead in days when no project date range is available */
const DEFAULT_RANGE_LOOKAHEAD_DAYS = 30;

/**
 * Fallback width in pixels for column keys not yet covered by the switch in
 * `getDefaultColumnWidth`. This branch should never be reached in practice
 * because `ExportColumnKey` is a closed union — if a new key is added to
 * that union without a matching case, TypeScript will not flag it here, so
 * keep this fallback and add the new case explicitly.
 */
const UNKNOWN_COLUMN_DEFAULT_WIDTH_PX = 100;

/** Milliseconds in one day — used by calculateDurationDays */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Width in pixels of the expand/collapse button rendered in the name column.
 * Corresponds to Tailwind class w-4 (4 × 4px = 16px).
 */
const EXPAND_BUTTON_WIDTH_PX = 16;

/**
 * Total gap pixels between the name-column UI elements (expand button, type
 * icon, text). Two gap-1 (4px) gaps = 8px.
 */
const NAME_COLUMN_GAPS_PX = 8;

/**
 * Get default column width based on density setting.
 */
export function getDefaultColumnWidth(
  key: ExportColumnKey,
  density: UiDensity
): number {
  const densityWidths = DENSITY_CONFIG[density].columnWidths;

  switch (key) {
    case "color":
      return densityWidths.color;
    case "name":
      return densityWidths.nameMin;
    case "startDate":
      return densityWidths.startDate;
    case "endDate":
      return densityWidths.endDate;
    case "duration":
      return densityWidths.duration;
    case "progress":
      return densityWidths.progress;
    default:
      return UNKNOWN_COLUMN_DEFAULT_WIDTH_PX;
  }
}

/**
 * Calculate task table width from selected columns using density-specific defaults.
 */
export function calculateTaskTableWidth(
  selectedColumns: ExportColumnKey[],
  columnWidths: Record<string, number>,
  density: UiDensity
): number {
  return selectedColumns.reduce((total, key) => {
    const defaultWidth = getDefaultColumnWidth(key, density);
    return total + (columnWidths[key] || defaultWidth);
  }, 0);
}

/**
 * Calculate effective zoom based on zoom mode and settings.
 */
export function calculateEffectiveZoom(
  options: ExportOptions,
  currentAppZoom: number,
  projectDurationDays: number,
  taskTableWidth: number = 0
): number {
  switch (options.zoomMode) {
    case "currentView":
      return currentAppZoom;
    case "custom":
      return options.timelineZoom;
    case "fitToWidth": {
      if (projectDurationDays <= 0) return 1;
      // fitToWidth is TOTAL width, so timeline = fitToWidth - taskTableWidth
      const timelineWidth = Math.max(100, options.fitToWidth - taskTableWidth);
      return timelineWidth / (projectDurationDays * BASE_PIXELS_PER_DAY);
    }
    default:
      return options.timelineZoom;
  }
}

/**
 * Calculate extra padding days needed on each side so that task bar labels
 * are not clipped at the edges of the exported date range.
 *
 * Returns `{ leftDays: 0, rightDays: 0 }` when no tasks or zoom are provided.
 */
function calculateLabelExtraPadding(
  options: ExportOptions,
  tasks: Task[],
  effectiveZoom: number
): { leftDays: number; rightDays: number } {
  if (tasks.length === 0 || effectiveZoom <= 0) {
    return { leftDays: 0, rightDays: 0 };
  }

  const densityConfig = DENSITY_CONFIG[options.density];
  const fontSize = densityConfig.fontSizeBar;
  const pixelsPerDay = BASE_PIXELS_PER_DAY * effectiveZoom;

  return calculateLabelPaddingDays(
    tasks,
    options.taskLabelPosition,
    fontSize,
    pixelsPerDay
  );
}

/**
 * Build the padded "all tasks" date range, extending the project boundaries
 * by default padding plus any extra space needed to avoid clipping task labels.
 */
function buildPaddedDateRange(
  options: ExportOptions,
  projectDateRange: { start: Date; end: Date },
  tasks: Task[] | undefined,
  effectiveZoom: number | undefined
): { min: string; max: string } {
  let leftPadding = DEFAULT_LEFT_PADDING_DAYS;
  let rightPadding = DEFAULT_RIGHT_PADDING_DAYS;

  if (tasks && effectiveZoom !== undefined) {
    const extra = calculateLabelExtraPadding(options, tasks, effectiveZoom);
    leftPadding += extra.leftDays;
    rightPadding += extra.rightDays;
  }

  return {
    min: addDays(
      projectDateRange.start.toISOString().split("T")[0],
      -leftPadding
    ),
    max: addDays(
      projectDateRange.end.toISOString().split("T")[0],
      rightPadding
    ),
  };
}

/**
 * Calculate the effective date range based on date range mode.
 * When tasks and effectiveZoom are provided, label padding is calculated
 * to ensure task labels are not clipped in the export.
 */
export function getEffectiveDateRange(
  options: ExportOptions,
  projectDateRange: { start: Date; end: Date } | undefined,
  visibleDateRange: { start: Date; end: Date } | undefined,
  tasks?: Task[],
  effectiveZoom?: number
): { min: string; max: string } {
  const today = new Date().toISOString().split("T")[0];
  const defaultRange = {
    min: addDays(today, -DEFAULT_RANGE_LOOKBACK_DAYS),
    max: addDays(today, DEFAULT_RANGE_LOOKAHEAD_DAYS),
  };

  switch (options.dateRangeMode) {
    case "visible":
      if (visibleDateRange) {
        return {
          min: visibleDateRange.start.toISOString().split("T")[0],
          max: visibleDateRange.end.toISOString().split("T")[0],
        };
      }
      return defaultRange;

    case "custom":
      if (options.customDateStart && options.customDateEnd) {
        return { min: options.customDateStart, max: options.customDateEnd };
      }
      return defaultRange;

    case "all":
    default:
      if (projectDateRange) {
        return buildPaddedDateRange(
          options,
          projectDateRange,
          tasks,
          effectiveZoom
        );
      }
      return defaultRange;
  }
}

/**
 * Calculate project duration in days from date range.
 *
 * Both `min` and `max` must be ISO 8601 date strings (YYYY-MM-DD).
 * `new Date("YYYY-MM-DD")` is parsed as **UTC midnight**, so the difference
 * is always a whole number of days regardless of local timezone or DST.
 * `Math.ceil` handles any sub-day remainder introduced by DST transitions
 * when non-ISO strings are passed — with ISO strings it is a no-op.
 */
export function calculateDurationDays(dateRange: {
  min: string;
  max: string;
}): number {
  const durationMs =
    new Date(dateRange.max).getTime() - new Date(dateRange.min).getTime();
  return Math.ceil(durationMs / MS_PER_DAY);
}

/**
 * Return the display cell value for a given column key and task.
 *
 * Special display rules:
 * - `color`: always empty string (column renders a swatch pill, not text)
 * - `name`: task name, or empty string when absent
 * - Data columns (startDate, endDate, duration, progress): delegated to
 *   `getColumnDisplayValue` (single source of truth in columns.ts).
 *   `null` (no value available) is mapped to `""` since measurement treats
 *   missing and empty cells identically for width calculations.
 */
function getCellValueForColumn(key: ExportColumnKey, task: Task): string {
  switch (key) {
    case "color":
      // Color column renders a swatch pill — no text content
      return "";
    case "name":
      return task.name || "";
    default:
      // Delegate all data columns to the shared implementation in columns.ts.
      // null means "no value" — treat as empty string for width measurement.
      return getColumnDisplayValue(task, key) ?? "";
  }
}

/**
 * Calculate the fixed leading pixel width for a name-column cell.
 * Accounts for: hierarchy indent, expand/collapse button, inter-element gaps,
 * and the task-type icon. This is the space consumed before the text starts.
 *
 * @param level - Hierarchy depth of the task (0 = root)
 * @param indentSize - Per-level indent in pixels from density config
 * @param iconSize - Task-type icon rendered size in pixels from density config
 * @returns Total leading width in pixels
 */
function calculateNameColumnLeadingWidth(
  level: number,
  indentSize: number,
  iconSize: number
): number {
  return (
    level * indentSize + EXPAND_BUTTON_WIDTH_PX + NAME_COLUMN_GAPS_PX + iconSize
  );
}

/**
 * Build the per-task cell values and extra leading widths for a given column.
 * For the name column, extra width accounts for hierarchy indent, expand button,
 * gaps, and icon. All other columns return zero extra width.
 *
 * @param key - The export column key
 * @param tasks - The full task list (used for hierarchy level calculation)
 * @param indentSize - Per-level indent size in pixels from density config
 * @param iconSize - Task-type icon rendered size in pixels from density config
 * @returns `cellValues[i]` is the display text for task i; `extraWidths[i]` is
 *   the fixed leading width (indent + button + gaps + icon) for name cells,
 *   or 0 for all other column types.
 */
function buildColumnMeasurementData(
  key: ExportColumnKey,
  tasks: Task[],
  indentSize: number,
  iconSize: number
): { cellValues: string[]; extraWidths: number[] } {
  const cellValues: string[] = [];
  const extraWidths: number[] = [];

  for (const task of tasks) {
    cellValues.push(getCellValueForColumn(key, task));

    if (key === "name") {
      const level = getTaskLevel(tasks, task.id);
      extraWidths.push(
        calculateNameColumnLeadingWidth(level, indentSize, iconSize)
      );
    } else {
      extraWidths.push(0);
    }
  }

  return { cellValues, extraWidths };
}

/**
 * Return the horizontal cell padding for a given column key.
 *
 * The name column uses single-sided right padding because the hierarchy indent
 * already provides the left visual gap. All other columns use symmetric
 * left + right padding (cellPaddingX × 2).
 *
 * @param key - The export column key
 * @param cellPaddingX - The per-side horizontal padding from density config
 * @returns Total horizontal padding to add when measuring column width
 */
function getColumnCellPadding(
  key: ExportColumnKey,
  cellPaddingX: number
): number {
  // Name column: indent handles left side — only right padding is added.
  // All other columns: symmetric left + right padding.
  return key === "name" ? cellPaddingX : cellPaddingX * 2;
}

/**
 * Calculate optimal column width based on content.
 * Uses the shared calculateColumnWidth function from textMeasurement.
 */
export function calculateOptimalColumnWidth(
  key: ExportColumnKey,
  tasks: Task[],
  density: UiDensity
): number {
  const densityConfig = DENSITY_CONFIG[density];

  // Color column has fixed width
  if (key === "color") {
    return densityConfig.columnWidths.color;
  }

  const cellPadding = getColumnCellPadding(key, densityConfig.cellPaddingX);

  const { cellValues, extraWidths } = buildColumnMeasurementData(
    key,
    tasks,
    densityConfig.indentSize,
    densityConfig.iconSize
  );

  // Use shared utility function (same as autoFitColumn)
  return calculateColumnWidth({
    headerLabel: HEADER_LABELS[key],
    cellValues,
    fontSize: densityConfig.fontSizeCell,
    cellPadding,
    extraWidths,
  });
}

/**
 * Calculate optimal widths for all export columns.
 * Uses content-based measurement for accurate sizing.
 */
export function calculateOptimalColumnWidths(
  selectedColumns: ExportColumnKey[],
  tasks: Task[],
  density: UiDensity,
  existingWidths: Record<string, number> = {}
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const key of selectedColumns) {
    // Use existing width if set (user customization), otherwise calculate.
    // Use !== undefined rather than a falsy check so that a stored value of 0
    // is respected instead of being silently replaced by the calculated width.
    if (existingWidths[key] !== undefined) {
      result[key] = existingWidths[key];
    } else {
      result[key] = calculateOptimalColumnWidth(key, tasks, density);
    }
  }

  return result;
}
