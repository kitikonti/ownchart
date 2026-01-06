/**
 * Timeline scale utilities for Gantt chart rendering
 * Inspired by SVAR React Gantt's multi-level scale system
 */

import {
  getWeek,
  addYears,
  addQuarters,
  addMonths,
  addWeeks,
  addDays as addDaysDateFns,
  addHours,
  startOfYear,
  startOfQuarter,
  startOfMonth,
  startOfWeek,
  startOfDay,
  endOfYear,
  endOfQuarter,
  endOfMonth,
  endOfWeek,
  endOfDay,
} from "date-fns";
import type { Task } from "../types/chart.types";
import { calculateDuration, addDays } from "./dateUtils";

// Fixed zoom configuration (industry standard approach)
export const FIXED_BASE_PIXELS_PER_DAY = 25; // Comfortable standard view
export const MIN_ZOOM = 0.05; // 5% - fit ~3 years on desktop
export const MAX_ZOOM = 3.0; // 300% - show at least 1 week

// Week numbering configuration (ISO 8601 - European standard)
// Default week start day - actual value comes from user preferences
export const WEEK_START_DAY = 1; // 0 = Sunday, 1 = Monday (ISO 8601)
export const FIRST_WEEK_CONTAINS_DATE = 4; // Thursday (ISO 8601: week 1 has first Thursday)

// Store references for lazy access (set by userPreferencesSlice on init)
let _getFirstDayOfWeek: (() => "sunday" | "monday") | null = null;
let _getWeekNumberingSystem: (() => "iso" | "us") | null = null;

/**
 * Register the first day of week getter (called by userPreferencesSlice).
 */
export function registerFirstDayOfWeekGetter(
  getter: () => "sunday" | "monday"
): void {
  _getFirstDayOfWeek = getter;
}

/**
 * Register the week numbering system getter (called by userPreferencesSlice).
 */
export function registerWeekNumberingSystemGetter(
  getter: () => "iso" | "us"
): void {
  _getWeekNumberingSystem = getter;
}

/**
 * Get week start day from user preferences.
 * Returns 0 for Sunday, 1 for Monday.
 */
export function getWeekStartDay(): 0 | 1 {
  if (_getFirstDayOfWeek) {
    return _getFirstDayOfWeek() === "sunday" ? 0 : 1;
  }
  return WEEK_START_DAY as 0 | 1; // Fallback to default
}

/**
 * Get first week contains date from user preferences.
 * Returns 4 for ISO 8601 (first Thursday), 1 for US (first day of year).
 */
export function getFirstWeekContainsDate(): 1 | 4 {
  if (_getWeekNumberingSystem) {
    return _getWeekNumberingSystem() === "us" ? 1 : 4;
  }
  return FIRST_WEEK_CONTAINS_DATE as 1 | 4; // Fallback to default (ISO)
}

// Scale unit types (inspired by SVAR React Gantt)
export type ScaleUnit = "year" | "quarter" | "month" | "week" | "day" | "hour";

// Scale configuration for a single row in the header
export interface ScaleConfig {
  unit: ScaleUnit;
  step: number;
  format: string | ((date: Date) => string);
}

// Complete timeline scale with multi-level headers
export interface TimelineScale {
  minDate: string; // ISO date
  maxDate: string; // ISO date
  pixelsPerDay: number; // Horizontal scale factor
  totalWidth: number; // Total SVG width in pixels
  totalDays: number; // Duration in days
  zoom: number; // Current zoom level (0.5 - 3.0)

  // Multi-level scale configuration (inspired by SVAR)
  scales: ScaleConfig[]; // Top-to-bottom header rows
}

export interface TaskBarGeometry {
  x: number; // Left edge position
  y: number; // Top edge position
  width: number; // Bar width
  height: number; // Bar height (typically 32px)
}

/**
 * Get appropriate scale configuration based on zoom level
 * Inspired by SVAR React Gantt's adaptive scale system
 */
export function getScaleConfig(
  zoom: number,
  pixelsPerDay: number
): ScaleConfig[] {
  const effectivePixelsPerDay = pixelsPerDay * zoom;

  // Extremely zoomed out (< 3 pixels per day): Quarter+Year → Month
  if (effectivePixelsPerDay < 3) {
    return [
      {
        unit: "quarter",
        step: 1,
        format: (date) =>
          `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`,
      },
      { unit: "month", step: 1, format: "MMM" },
    ];
  }

  // Very zoomed out (3-5 pixels per day): Month+Year → Week (number only)
  if (effectivePixelsPerDay < 5) {
    return [
      { unit: "month", step: 1, format: "MMM yyyy" },
      {
        unit: "week",
        step: 1,
        format: (date) =>
          `${getWeek(date, {
            weekStartsOn: getWeekStartDay(),
            firstWeekContainsDate: getFirstWeekContainsDate(),
          })}`,
      },
    ];
  }

  // Zoomed out (5-15 pixels per day): Month+Year → Week
  if (effectivePixelsPerDay < 15) {
    return [
      { unit: "month", step: 1, format: "MMM yyyy" },
      {
        unit: "week",
        step: 1,
        format: (date) =>
          `W${getWeek(date, {
            weekStartsOn: getWeekStartDay(),
            firstWeekContainsDate: getFirstWeekContainsDate(),
          })}`,
      },
    ];
  }

  // Medium zoom (15-30 pixels per day): Month → Week
  if (effectivePixelsPerDay < 30) {
    return [
      { unit: "month", step: 1, format: "MMM yyyy" },
      {
        unit: "week",
        step: 1,
        format: (date) =>
          `W${getWeek(date, {
            weekStartsOn: getWeekStartDay(),
            firstWeekContainsDate: getFirstWeekContainsDate(),
          })}`,
      },
    ];
  }

  // Zoomed in (30-60 pixels per day): Month → Day
  if (effectivePixelsPerDay < 60) {
    return [
      { unit: "month", step: 1, format: "MMMM yyyy" },
      { unit: "day", step: 1, format: "d" },
    ];
  }

  // Very zoomed in (60+ pixels per day): Week → Day with time
  return [
    {
      unit: "week",
      step: 1,
      format: (date) =>
        `Week ${getWeek(date, {
          weekStartsOn: getWeekStartDay(),
          firstWeekContainsDate: getFirstWeekContainsDate(),
        })}`,
    },
    { unit: "day", step: 1, format: "EEE d" },
  ];
}

/**
 * Calculate timeline scale from date range with FIXED base pixels per day
 * Industry standard approach:
 * - Fixed base (25 px/day) ensures consistent visual density
 * - zoom=1: Standard view (25 px/day)
 * - zoom>1: More pixels per day (detail view, horizontal scroll)
 * - zoom<1: Fewer pixels per day (overview, fit more days)
 * - NO auto-scaling when tasks change
 * - Users manually zoom to fit their needs
 */
export function getTimelineScale(
  minDate: string,
  maxDate: string,
  _containerWidth: number,
  zoom: number = 1
): TimelineScale {
  const totalDays = calculateDuration(minDate, maxDate);

  // FIXED base pixels per day (industry standard)
  const basePixelsPerDay = FIXED_BASE_PIXELS_PER_DAY;

  // Apply zoom to pixels per day
  const pixelsPerDay = basePixelsPerDay * zoom;

  // Total width is simply days × pixels per day
  // May be smaller OR larger than container (no auto-fill)
  const totalWidth = totalDays * pixelsPerDay;

  return {
    minDate,
    maxDate,
    pixelsPerDay,
    totalWidth,
    totalDays,
    zoom,
    scales: getScaleConfig(zoom, basePixelsPerDay),
  };
}

/**
 * Convert date to pixel position on timeline
 * @returns X coordinate in pixels
 */
export function dateToPixel(dateStr: string, scale: TimelineScale): number {
  const daysFromStart = calculateDuration(scale.minDate, dateStr) - 1;
  return daysFromStart * scale.pixelsPerDay;
}

/**
 * Convert pixel position to date (with smart rounding)
 * @returns ISO date string
 */
export function pixelToDate(x: number, scale: TimelineScale): string {
  const daysFromStart = Math.round(x / scale.pixelsPerDay); // Round instead of floor
  return addDays(scale.minDate, daysFromStart);
}

/**
 * Density configuration for task bar geometry calculations.
 * Values should come from DENSITY_CONFIG in preferences.types.ts
 */
export interface DensityGeometryConfig {
  rowHeight: number;
  taskBarHeight: number;
  taskBarOffset: number;
}

/**
 * Default density config (Normal mode) for backwards compatibility
 */
export const DEFAULT_DENSITY_GEOMETRY: DensityGeometryConfig = {
  rowHeight: 36,
  taskBarHeight: 26,
  taskBarOffset: 5,
};

/**
 * Get task bar geometry for rendering
 * @param task - The task to calculate geometry for
 * @param scale - The timeline scale
 * @param rowIndex - The row index of the task
 * @param densityConfig - Density configuration (rowHeight, taskBarHeight, taskBarOffset)
 * @param headerHeight - Height of timeline header (default 48px: 2×24px rows)
 */
export function getTaskBarGeometry(
  task: Task,
  scale: TimelineScale,
  rowIndex: number,
  densityConfig: DensityGeometryConfig = DEFAULT_DENSITY_GEOMETRY,
  headerHeight: number = 48
): TaskBarGeometry {
  const x = dateToPixel(task.startDate, scale);

  // Milestones only need startDate (they represent a point in time, not a duration)
  const endDate = task.endDate || task.startDate;
  const duration = calculateDuration(task.startDate, endDate);
  const width = duration * scale.pixelsPerDay;

  const { rowHeight, taskBarHeight, taskBarOffset } = densityConfig;

  return {
    x,
    y: headerHeight + rowIndex * rowHeight + taskBarOffset,
    width,
    height: taskBarHeight,
  };
}

/**
 * Get the start date of a time unit (aligned to unit boundary)
 */
export function getUnitStart(date: Date, unit: ScaleUnit): Date {
  switch (unit) {
    case "year":
      return startOfYear(date);
    case "quarter":
      return startOfQuarter(date);
    case "month":
      return startOfMonth(date);
    case "week":
      return startOfWeek(date, { weekStartsOn: getWeekStartDay() });
    case "day":
      return startOfDay(date);
    case "hour":
      // Round down to hour
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        0,
        0,
        0
      );
    default:
      return date;
  }
}

/**
 * Get the end date of a time unit
 */
export function getUnitEnd(date: Date, unit: ScaleUnit, step: number): Date {
  switch (unit) {
    case "year":
      return endOfYear(addYears(date, step - 1));
    case "quarter":
      return endOfQuarter(addQuarters(date, step - 1));
    case "month":
      return endOfMonth(addMonths(date, step - 1));
    case "week":
      return endOfWeek(addWeeks(date, step - 1), {
        weekStartsOn: getWeekStartDay(),
      });
    case "day":
      return endOfDay(addDaysDateFns(date, step - 1));
    case "hour":
      return addHours(date, step);
    default:
      return date;
  }
}

/**
 * Add time unit to date
 */
export function addUnit(date: Date, unit: ScaleUnit, step: number): Date {
  switch (unit) {
    case "year":
      return addYears(date, step);
    case "quarter":
      return addQuarters(date, step);
    case "month":
      return addMonths(date, step);
    case "week":
      return addWeeks(date, step);
    case "day":
      return addDaysDateFns(date, step);
    case "hour":
      return addHours(date, step);
    default:
      return date;
  }
}

/**
 * Get visible date range based on scroll position
 */
export function getVisibleDateRange(
  scale: TimelineScale,
  scrollX: number,
  viewportWidth: number
): { start: string; end: string } {
  const start = pixelToDate(scrollX, scale);
  const end = pixelToDate(scrollX + viewportWidth, scale);
  return { start, end };
}
