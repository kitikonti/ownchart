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
      return 100;
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
  const defaultRange = { min: addDays(today, -7), max: addDays(today, 30) };

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
        // Base padding of 7 days
        let leftPadding = 7;
        let rightPadding = 7;

        // Calculate additional padding for task labels if tasks and zoom provided
        if (tasks && tasks.length > 0 && effectiveZoom && effectiveZoom > 0) {
          const densityConfig = DENSITY_CONFIG[options.density];
          const fontSize = densityConfig.fontSizeBar;
          const pixelsPerDay = BASE_PIXELS_PER_DAY * effectiveZoom;

          const labelPadding = calculateLabelPaddingDays(
            tasks,
            options.taskLabelPosition,
            fontSize,
            pixelsPerDay
          );

          leftPadding += labelPadding.leftDays;
          rightPadding += labelPadding.rightDays;
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
    let cellValue = "";
    const isSummary = task.type === "summary";
    const isMilestone = task.type === "milestone";

    switch (key) {
      case "name":
        cellValue = task.name || "";
        break;
      case "startDate":
        cellValue = task.startDate || "";
        break;
      case "endDate":
        // Milestones don't show end date
        cellValue = isMilestone ? "" : task.endDate || "";
        break;
      case "duration":
        // Milestones don't show duration, summaries show "X days"
        if (isMilestone) {
          cellValue = "";
        } else if (
          isSummary &&
          task.duration !== undefined &&
          task.duration > 0
        ) {
          cellValue = `${task.duration} days`;
        } else if (!isSummary && task.duration !== undefined) {
          cellValue = `${task.duration}`;
        }
        break;
      case "progress":
        cellValue = task.progress !== undefined ? `${task.progress}%` : "";
        break;
    }

    cellValues.push(cellValue);

    // For name column, calculate extra width for UI elements (same as autoFitColumn)
    if (key === "name") {
      const level = getTaskLevel(tasks, task.id);
      const hierarchyIndent = level * indentSize;
      const expandButton = 16; // w-4 expand/collapse button
      const gaps = 8; // gap-1 (4px) × 2 between elements
      const typeIcon = iconSize;
      extraWidths.push(hierarchyIndent + expandButton + gaps + typeIcon);
    } else {
      extraWidths.push(0);
    }
  }

  // Use shared utility function (same as autoFitColumn)
  return calculateColumnWidth(
    headerLabel,
    cellValues,
    fontSize,
    cellPadding,
    extraWidths
  );
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
    // Use existing width if set (user customization), otherwise calculate
    if (existingWidths[key]) {
      result[key] = existingWidths[key];
    } else {
      result[key] = calculateOptimalColumnWidth(key, tasks, density);
    }
  }

  return result;
}
