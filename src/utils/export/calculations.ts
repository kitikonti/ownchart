/**
 * Shared calculation utilities for PNG export.
 * Centralizes zoom, dimension, and date range calculations.
 */

import type { Task } from "../../types/chart.types";
import type { UiDensity } from "../../types/preferences.types";
import type { ExportOptions, ExportColumnKey } from "./types";
import { DENSITY_CONFIG } from "../../config/densityConfig";
import { addDays, toISODateString } from "../dateUtils";
import {
  calculateLabelPaddingDays,
  calculateColumnWidth,
} from "../textMeasurement";
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
 * because `ExportColumnKey` is a closed union. The `never` cast in the switch
 * default acts as a compile-time exhaustiveness guard: TypeScript will flag
 * that line if a new key is added without a matching case. The fallback value
 * here is kept as a runtime safety net in case the cast is removed.
 */
const UNKNOWN_COLUMN_DEFAULT_WIDTH_PX = 100;

/** Milliseconds in one day — used by calculateDurationDays */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Minimum timeline pixel width used in the `fitToWidth` zoom calculation.
 * Prevents a near-zero or negative timeline width when the task table is
 * wider than the requested fit-to-width value.
 */
const MIN_TIMELINE_WIDTH_PX = 100;

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
 * Recursively compute the nesting level for a single task ID.
 *
 * Extracted from `buildTaskLevelMap` so it can be independently tested and so
 * that the outer function stays under the 50-line limit.
 *
 * @param taskId - The task ID to compute the level for
 * @param taskById - Full task lookup map
 * @param levelCache - Memoisation cache (mutated in place)
 * @param computing - In-progress task IDs for cycle detection (mutated in place)
 * @returns Nesting depth (0 = root); 0 is also returned for tasks in a cycle
 */
function computeTaskLevel(
  taskId: string,
  taskById: Map<string, Task>,
  levelCache: Map<string, number>,
  computing: Set<string>
): number {
  const cached = levelCache.get(taskId);
  if (cached !== undefined) return cached;
  if (computing.has(taskId)) {
    // Circular reference — treat as root to prevent infinite recursion
    levelCache.set(taskId, 0);
    return 0;
  }
  computing.add(taskId);
  const task = taskById.get(taskId);
  const level =
    task?.parent && taskById.has(task.parent)
      ? computeTaskLevel(task.parent, taskById, levelCache, computing) + 1
      : 0;
  computing.delete(taskId);
  levelCache.set(taskId, level);
  return level;
}

/**
 * Build a map from task ID → nesting level (0 = root) in a single O(n) pass.
 * Uses memoised parent-chain walking so every task's level is computed at most
 * once. This avoids the O(n²) cost of calling `getTaskLevel` (which rebuilds
 * the full level map each time) inside a per-task loop.
 *
 * Includes a cycle guard: any task involved in a circular parent reference is
 * assigned level 0 to prevent infinite recursion.
 *
 * Implementation note: `levelCache` and `computing` are single-call scratchpads
 * allocated here and passed into `computeTaskLevel` for memoisation and cycle
 * detection respectively. They are not thread-safe, but JavaScript's
 * single-threaded execution model means concurrent mutation is not possible for
 * a single invocation of this function.
 */
function buildTaskLevelMap(tasks: Task[]): Map<string, number> {
  const taskById = new Map<string, Task>(tasks.map((t) => [t.id, t]));
  const levelCache = new Map<string, number>();
  const computing = new Set<string>();

  for (const task of tasks) {
    computeTaskLevel(task.id, taskById, levelCache, computing);
  }
  return levelCache;
}

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
    default: {
      // ExportColumnKey is a closed union — this branch should never be
      // reached. The cast to `never` provides compile-time exhaustiveness:
      // TypeScript will flag this line if a new key is added without a
      // matching case, mirroring the pattern used in calculateEffectiveZoom.
      const _exhaustive: never = key;
      void _exhaustive;
      return UNKNOWN_COLUMN_DEFAULT_WIDTH_PX;
    }
  }
}

/**
 * Calculate task table width from selected columns using density-specific defaults.
 *
 * @param selectedColumns - Ordered list of column keys to include in the table
 * @param columnWidths - User-customised widths keyed by column key; columns absent
 *   from this map fall back to the density-specific default. A stored value of `0`
 *   is respected as-is (uses `!== undefined` guard, not a falsy check).
 * @param density - UI density used to derive per-column default widths
 * @returns Total pixel width of the task table
 */
export function calculateTaskTableWidth(
  selectedColumns: ExportColumnKey[],
  columnWidths: Record<string, number>,
  density: UiDensity
): number {
  return selectedColumns.reduce((total, key) => {
    const defaultWidth = getDefaultColumnWidth(key, density);
    return (
      total +
      (columnWidths[key] !== undefined ? columnWidths[key] : defaultWidth)
    );
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
      const timelineWidth = Math.max(
        MIN_TIMELINE_WIDTH_PX,
        options.fitToWidth - taskTableWidth
      );
      return timelineWidth / (projectDurationDays * BASE_PIXELS_PER_DAY);
    }
    default: {
      // ExportZoomMode is a closed union — this branch should never be reached.
      // The cast to `never` provides compile-time exhaustiveness: TypeScript will
      // flag this line if a new zoomMode variant is added without a matching case.
      const _exhaustive: never = options.zoomMode;
      void _exhaustive;
      return options.timelineZoom;
    }
  }
}

/**
 * Calculate extra padding days needed on each side so that task bar labels
 * are not clipped at the edges of the exported date range.
 *
 * Returns `{ leftDays: 0, rightDays: 0 }` when no tasks or zoom are provided.
 *
 * @param options - Export options (density and label position used)
 * @param tasks - Tasks whose bar labels may overflow the date range boundary
 * @param effectiveZoom - Current effective zoom level (pixels per day scale factor)
 * @returns Extra padding days to add on the left and right of the date range
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
 *
 * @param options - Export options (density and label position used for label padding)
 * @param projectDateRange - Unpadded project start/end dates
 * @param tasks - Tasks list for label overflow calculation; pass `[]` to skip label padding
 * @param effectiveZoom - Zoom level for label overflow calculation; pass `0` to skip
 * @returns ISO date strings for the padded min/max of the date range
 */
function buildPaddedDateRange(
  options: ExportOptions,
  projectDateRange: { start: Date; end: Date },
  tasks: Task[],
  effectiveZoom: number
): { min: string; max: string } {
  let leftPadding = DEFAULT_LEFT_PADDING_DAYS;
  let rightPadding = DEFAULT_RIGHT_PADDING_DAYS;

  const extra = calculateLabelExtraPadding(options, tasks, effectiveZoom);
  leftPadding += extra.leftDays;
  rightPadding += extra.rightDays;

  return {
    min: addDays(toISODateString(projectDateRange.start), -leftPadding),
    max: addDays(toISODateString(projectDateRange.end), rightPadding),
  };
}

/**
 * Build the date range for "visible" mode.
 * Returns the visible window as ISO date strings, or undefined when no range is available.
 */
function buildVisibleDateRange(
  visibleDateRange: { start: Date; end: Date } | undefined
): { min: string; max: string } | undefined {
  if (!visibleDateRange) return undefined;
  return {
    min: toISODateString(visibleDateRange.start),
    max: toISODateString(visibleDateRange.end),
  };
}

/**
 * Build the date range for "custom" mode.
 * Returns the user-supplied date strings when both ends are present, otherwise undefined.
 */
function buildCustomDateRange(
  options: ExportOptions
): { min: string; max: string } | undefined {
  if (options.customDateStart && options.customDateEnd) {
    return { min: options.customDateStart, max: options.customDateEnd };
  }
  return undefined;
}

/**
 * Build the fallback date range used when no project, visible, or custom range
 * is available. Centers on today with a short look-back and a longer look-ahead
 * so the exported chart always shows some meaningful content.
 */
function buildDefaultDateRange(): { min: string; max: string } {
  const today = toISODateString(new Date());
  return {
    min: addDays(today, -DEFAULT_RANGE_LOOKBACK_DAYS),
    max: addDays(today, DEFAULT_RANGE_LOOKAHEAD_DAYS),
  };
}

/**
 * Build the date range for "all" mode.
 * Delegates to buildPaddedDateRange when a project range is available, otherwise undefined.
 */
function buildAllTasksDateRange(
  options: ExportOptions,
  projectDateRange: { start: Date; end: Date } | undefined,
  tasks: Task[],
  effectiveZoom: number
): { min: string; max: string } | undefined {
  if (!projectDateRange) return undefined;
  return buildPaddedDateRange(options, projectDateRange, tasks, effectiveZoom);
}

/**
 * Calculate the effective date range based on date range mode.
 * When tasks and effectiveZoom are provided, label padding is calculated
 * to ensure task labels are not clipped in the export.
 *
 * @param options - Export options (dateRangeMode, density, taskLabelPosition used)
 * @param projectDateRange - Full project start/end dates; used in "all" mode
 * @param visibleDateRange - Currently visible window; used in "visible" mode
 * @param tasks - Optional task list for label overflow calculation in "all" mode.
 *   Pass `undefined` or omit to skip label padding (uses default base padding only).
 * @param effectiveZoom - Optional zoom level for label overflow calculation.
 *   Pass `undefined` or omit to skip label padding (treated as zoom = 0).
 * @returns ISO date strings for the effective min/max of the date range
 */
export function getEffectiveDateRange(
  options: ExportOptions,
  projectDateRange: { start: Date; end: Date } | undefined,
  visibleDateRange: { start: Date; end: Date } | undefined,
  tasks?: Task[],
  effectiveZoom?: number
): { min: string; max: string } {
  switch (options.dateRangeMode) {
    case "visible":
      return buildVisibleDateRange(visibleDateRange) ?? buildDefaultDateRange();

    case "custom":
      return buildCustomDateRange(options) ?? buildDefaultDateRange();

    case "all":
      return (
        buildAllTasksDateRange(
          options,
          projectDateRange,
          tasks ?? [],
          effectiveZoom ?? 0
        ) ?? buildDefaultDateRange()
      );

    default: {
      // ExportDateRangeMode is a closed union — this branch should never be
      // reached. The cast to `never` provides compile-time exhaustiveness:
      // TypeScript will flag this line if a new dateRangeMode variant is
      // added without a matching case, mirroring the pattern in
      // calculateEffectiveZoom and getDefaultColumnWidth.
      const _exhaustive: never = options.dateRangeMode;
      void _exhaustive;
      return buildDefaultDateRange();
    }
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
 * Build per-task extra leading widths for the name column.
 * Each entry accounts for hierarchy indent, expand/collapse button, gaps,
 * and the task-type icon — i.e. the space consumed before the text starts.
 *
 * Pre-computes a level map in O(n) before iterating tasks so the overall cost
 * is O(n) rather than O(n²) (which would result from calling getTaskLevel —
 * which rebuilds the full level map — once per task inside the loop).
 *
 * @param tasks - The full task list (used for hierarchy level calculation)
 * @param indentSize - Per-level indent size in pixels from density config
 * @param iconSize - Task-type icon rendered size in pixels from density config
 * @returns Array where entry i is the fixed leading pixel width for task i
 */
function buildNameColumnExtraWidths(
  tasks: Task[],
  indentSize: number,
  iconSize: number
): number[] {
  const levelMap = buildTaskLevelMap(tasks);
  return tasks.map((task) => {
    const level = levelMap.get(task.id) ?? 0;
    return calculateNameColumnLeadingWidth(level, indentSize, iconSize);
  });
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
  const cellValues = tasks.map((task) => getCellValueForColumn(key, task));
  const extraWidths =
    key === "name"
      ? buildNameColumnExtraWidths(tasks, indentSize, iconSize)
      : new Array<number>(tasks.length).fill(0);

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
