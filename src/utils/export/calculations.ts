/**
 * Shared calculation utilities for PNG export.
 * Centralizes zoom, dimension, and date range calculations.
 */

import type { ExportOptions, ExportColumnKey } from "./types";
import { DENSITY_CONFIG, type UiDensity } from "../../types/preferences.types";
import { addDays } from "../dateUtils";
import { calculateLabelPaddingDays } from "../textMeasurement";
import type { Task } from "../../types/chart.types";

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
