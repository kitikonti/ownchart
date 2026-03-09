/**
 * Shared calculation utilities for PNG export.
 * Centralizes zoom, dimension, and date range calculations.
 */

import type { ExportOptions, ExportColumnKey } from "./types";
import type { UiDensity } from "../../types/preferences.types";
import { DENSITY_CONFIG } from "../../config/densityConfig";
import { addDays } from "../dateUtils";
import {
  calculateLabelPaddingDays,
  calculateColumnWidth,
} from "../textMeasurement";
import type { Task } from "../../types/chart.types";
import { getTaskLevel } from "../hierarchy";
import { HEADER_LABELS } from "./columns";

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

/** Fallback width in pixels for unknown column keys */
const UNKNOWN_COLUMN_DEFAULT_WIDTH_PX = 100;

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
        return {
          min: options.customDateStart,
          max: options.customDateEnd,
        };
      }
      return defaultRange;

    case "all":
    default:
      if (projectDateRange) {
        let leftPadding = DEFAULT_LEFT_PADDING_DAYS;
        let rightPadding = DEFAULT_RIGHT_PADDING_DAYS;

        if (tasks && effectiveZoom !== undefined) {
          const extra = calculateLabelExtraPadding(
            options,
            tasks,
            effectiveZoom
          );
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
      return defaultRange;
  }
}

/**
 * Calculate project duration in days from date range.
 */
export function calculateDurationDays(dateRange: {
  min: string;
  max: string;
}): number {
  const durationMs =
    new Date(dateRange.max).getTime() - new Date(dateRange.min).getTime();
  return Math.ceil(durationMs / (1000 * 60 * 60 * 24));
}

/**
 * Return the display cell value for a given column key and task.
 * Milestones and summaries have special display rules for some columns.
 */
function getCellValueForColumn(key: ExportColumnKey, task: Task): string {
  const isSummary = task.type === "summary";
  const isMilestone = task.type === "milestone";

  switch (key) {
    case "name":
      return task.name || "";
    case "startDate":
      return task.startDate || "";
    case "endDate":
      // Milestones don't show end date
      return isMilestone ? "" : task.endDate || "";
    case "duration":
      // Milestones don't show duration; summaries show "X days"
      if (isMilestone) return "";
      if (isSummary && task.duration !== undefined && task.duration > 0) {
        return `${task.duration} days`;
      }
      if (!isSummary && task.duration !== undefined) {
        return `${task.duration}`;
      }
      return "";
    case "progress":
      return task.progress !== undefined ? `${task.progress}%` : "";
    default:
      return "";
  }
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
  const fontSize = densityConfig.fontSizeCell;
  const indentSize = densityConfig.indentSize;
  const iconSize = densityConfig.iconSize;

  // Color column has fixed width
  if (key === "color") {
    return densityConfig.columnWidths.color;
  }

  // Get header label
  const headerLabel = HEADER_LABELS[key];

  // Name column has only right padding (indent handles left), others have both
  const cellPadding =
    key === "name"
      ? densityConfig.cellPaddingX
      : densityConfig.cellPaddingX * 2;

  // Prepare cell values and extra widths
  const cellValues: string[] = [];
  const extraWidths: number[] = [];

  for (const task of tasks) {
    cellValues.push(getCellValueForColumn(key, task));

    // For name column, calculate extra width for UI elements (same as autoFitColumn)
    if (key === "name") {
      const level = getTaskLevel(tasks, task.id);
      const hierarchyIndent = level * indentSize;
      extraWidths.push(
        hierarchyIndent +
          EXPAND_BUTTON_WIDTH_PX +
          NAME_COLUMN_GAPS_PX +
          iconSize
      );
    } else {
      extraWidths.push(0);
    }
  }

  // Use shared utility function (same as autoFitColumn)
  return calculateColumnWidth({
    headerLabel,
    cellValues,
    fontSize,
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
