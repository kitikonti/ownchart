/**
 * Timeline scale utilities for Gantt chart rendering
 * Inspired by SVAR React Gantt's multi-level scale system
 */

import {
  getWeek,
  format,
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
  startOfHour,
  endOfYear,
  endOfQuarter,
  endOfMonth,
  endOfWeek,
  endOfDay,
} from "date-fns";

import { DENSITY_CONFIG } from "../config/densityConfig";
import type { Task } from "../types/chart.types";
import { calculateDuration, addDays } from "./dateUtils";

// Fixed zoom configuration (industry standard approach)
export const FIXED_BASE_PIXELS_PER_DAY = 25; // Comfortable standard view
export const MIN_ZOOM = 0.05; // 5% - fit ~3 years on desktop
export const MAX_ZOOM = 3.0; // 300% - show at least 1 week

// Scroll/date-range padding constants (shared between GanttLayout and chartSlice)
/** Days of padding added before/after task range for infinite scroll room */
export const DATE_RANGE_PADDING_DAYS = 90;
/** Days of visible pre-task breathing room shown before the first task. */
const VISIBLE_PRE_TASK_DAYS = 7;
/** Days to scroll past from dateRange.min to reach visible content start.
 *  = DATE_RANGE_PADDING_DAYS - VISIBLE_PRE_TASK_DAYS */
export const SCROLL_OFFSET_DAYS =
  DATE_RANGE_PADDING_DAYS - VISIBLE_PRE_TASK_DAYS;
/** Visual breathing room (days) added on each side by zoomToDateRange */
export const ZOOM_VISUAL_PADDING_DAYS = 2;
/** Base padding (days) added on each side by fitToView before label padding */
export const FIT_TO_VIEW_PADDING_DAYS = 7;

// Week numbering configuration (ISO 8601 - European standard)
// Default week start day - actual value comes from user preferences
export const WEEK_START_DAY = 1; // 0 = Sunday, 1 = Monday (ISO 8601)
export const FIRST_WEEK_CONTAINS_DATE = 4; // Thursday (ISO 8601: week 1 has first Thursday)

// Named constants for pixels-per-day zoom thresholds used in getScaleConfig
const PPD_QUARTER_VIEW = 3; // Below this: show quarters + months
const PPD_WEEK_NUMBER_ONLY = 5; // Below this: show months + bare week number
const PPD_WEEK_WITH_PREFIX = 30; // Below this: show months + "W"-prefixed week number
const PPD_DAY_VIEW = 60; // Below this: show weeks + day number; above: week + abbreviated day

// Named constant for the two-row timeline header height (2 × 24px rows)
export const TIMELINE_HEADER_HEIGHT_PX = 48;

// Store references for lazy access (set by userPreferencesSlice on init).
// This service-locator pattern avoids circular imports between the util layer
// and the Zustand store layer. Threading preferences as params at every
// render-path callsite would require updating ~10 call sites across the codebase.
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
 * Reset registered preference getters to null (for test teardown).
 * Restores fallback behaviour (ISO defaults) between test cases.
 *
 * @important Call this in `afterEach` / `afterAll` in any test suite that
 * calls `registerFirstDayOfWeekGetter` or `registerWeekNumberingSystemGetter`.
 * Omitting teardown leaks module-level state into subsequent test cases.
 */
export function resetPreferenceGetters(): void {
  _getFirstDayOfWeek = null;
  _getWeekNumberingSystem = null;
}

/**
 * Get week start day from user preferences.
 * Returns 0 for Sunday, 1 for Monday.
 */
export function getWeekStartDay(): 0 | 1 {
  if (_getFirstDayOfWeek) {
    return _getFirstDayOfWeek() === "sunday" ? 0 : 1;
  }
  return WEEK_START_DAY; // Fallback to default
}

/**
 * Get first week contains date from user preferences.
 * Returns 4 for ISO 8601 (first Thursday), 1 for US (first day of year).
 */
export function getFirstWeekContainsDate(): 1 | 4 {
  if (_getWeekNumberingSystem) {
    return _getWeekNumberingSystem() === "us" ? 1 : 4;
  }
  return FIRST_WEEK_CONTAINS_DATE; // Fallback to default (ISO)
}

// Scale unit types (inspired by SVAR React Gantt)
// Note: "hour" is reserved for future hour-level zoom; not currently returned by getScaleConfig.
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

// Extracted helper — avoids repeating the week options object in every format function
function getWeekNumber(date: Date): number {
  return getWeek(date, {
    weekStartsOn: getWeekStartDay(),
    firstWeekContainsDate: getFirstWeekContainsDate(),
  });
}

// Named format helpers extracted from getScaleConfig for readability
const MONTHS_PER_QUARTER = 3;

function formatQuarterHeader(date: Date): string {
  return `Q${Math.floor(date.getMonth() / MONTHS_PER_QUARTER) + 1} ${date.getFullYear()}`;
}

function formatWeekNumberOnly(date: Date): string {
  return `${getWeekNumber(date)}`;
}

function formatWeekWithPrefix(date: Date): string {
  return `W${getWeekNumber(date)}`;
}

function formatWeekWithMonthYear(date: Date): string {
  return `Week ${getWeekNumber(date)}, ${format(date, "MMM yyyy")}`;
}

/**
 * Get appropriate scale configuration based on zoom level
 * Inspired by SVAR React Gantt's adaptive scale system
 * @param zoom - Current zoom level multiplier
 * @param basePixelsPerDay - Unzoomed pixels-per-day (typically FIXED_BASE_PIXELS_PER_DAY = 25);
 *   do NOT pass an already-zoomed scale.pixelsPerDay here.
 */
export function getScaleConfig(
  zoom: number,
  basePixelsPerDay: number
): ScaleConfig[] {
  const effectivePixelsPerDay = basePixelsPerDay * zoom;

  // Extremely zoomed out (< PPD_QUARTER_VIEW): Quarter → Month
  if (effectivePixelsPerDay < PPD_QUARTER_VIEW) {
    return [
      { unit: "quarter", step: 1, format: formatQuarterHeader },
      { unit: "month", step: 1, format: "MMM" },
    ];
  }

  // Very zoomed out (< PPD_WEEK_NUMBER_ONLY): Month+Year → Week (bare number)
  if (effectivePixelsPerDay < PPD_WEEK_NUMBER_ONLY) {
    return [
      { unit: "month", step: 1, format: "MMM yyyy" },
      { unit: "week", step: 1, format: formatWeekNumberOnly },
    ];
  }

  // Zoomed out (< PPD_WEEK_WITH_PREFIX): Month+Year → Week with "W" prefix
  if (effectivePixelsPerDay < PPD_WEEK_WITH_PREFIX) {
    return [
      { unit: "month", step: 1, format: "MMM yyyy" },
      { unit: "week", step: 1, format: formatWeekWithPrefix },
    ];
  }

  // Zoomed in (< PPD_DAY_VIEW): Week → Day (number only)
  if (effectivePixelsPerDay < PPD_DAY_VIEW) {
    return [
      { unit: "week", step: 1, format: formatWeekWithMonthYear },
      { unit: "day", step: 1, format: "d" },
    ];
  }

  // Very zoomed in (PPD_DAY_VIEW+): Week → Day with abbreviated weekday name
  return [
    { unit: "week", step: 1, format: formatWeekWithMonthYear },
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
  // calculateDuration is inclusive (same date → 1); subtract 1 for 0-based pixel offset
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
 * Values should come from DENSITY_CONFIG in config/densityConfig.ts
 */
export interface DensityGeometryConfig {
  rowHeight: number;
  taskBarHeight: number;
  taskBarOffset: number;
}

/**
 * Default density config (Normal mode) — references DENSITY_CONFIG.normal directly
 * so values stay in sync with config/densityConfig.ts without manual duplication.
 */
export const DEFAULT_DENSITY_GEOMETRY: DensityGeometryConfig =
  DENSITY_CONFIG.normal;

/** Options for getTaskBarGeometry — groups the five parameters into a single object. */
export interface TaskBarGeometryOptions {
  task: Task;
  scale: TimelineScale;
  rowIndex: number;
  /** Density configuration (rowHeight, taskBarHeight, taskBarOffset). Defaults to Normal mode. */
  densityConfig?: DensityGeometryConfig;
  /** Height of the timeline header in px. Pass 0 when the header lives in a separate SVG. Defaults to TIMELINE_HEADER_HEIGHT_PX (48px). */
  headerHeight?: number;
}

/**
 * Get task bar geometry for rendering.
 */
export function getTaskBarGeometry({
  task,
  scale,
  rowIndex,
  densityConfig = DEFAULT_DENSITY_GEOMETRY,
  headerHeight = TIMELINE_HEADER_HEIGHT_PX,
}: TaskBarGeometryOptions): TaskBarGeometry {
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

// Unit operation dispatch table — centralises per-unit logic so that adding a new
// ScaleUnit only requires one change point instead of three parallel switch statements.
type UnitOps = {
  start: (date: Date) => Date;
  end: (date: Date, step: number) => Date;
  add: (date: Date, step: number) => Date;
};

const UNIT_OPS: Record<ScaleUnit, UnitOps> = {
  year: {
    start: startOfYear,
    end: (date, step) => endOfYear(addYears(date, step - 1)),
    add: (date, step) => addYears(date, step),
  },
  quarter: {
    start: startOfQuarter,
    end: (date, step) => endOfQuarter(addQuarters(date, step - 1)),
    add: (date, step) => addQuarters(date, step),
  },
  month: {
    start: startOfMonth,
    end: (date, step) => endOfMonth(addMonths(date, step - 1)),
    add: (date, step) => addMonths(date, step),
  },
  week: {
    start: (date) => startOfWeek(date, { weekStartsOn: getWeekStartDay() }),
    end: (date, step) =>
      endOfWeek(addWeeks(date, step - 1), { weekStartsOn: getWeekStartDay() }),
    add: (date, step) => addWeeks(date, step),
  },
  day: {
    start: startOfDay,
    end: (date, step) => endOfDay(addDaysDateFns(date, step - 1)),
    add: (date, step) => addDaysDateFns(date, step),
  },
  hour: {
    // Hours use addHours(step) not step-1 — hour end boundaries are exclusive
    // (no endOfHour equivalent); caller expects the next hour boundary.
    // Reserved for future hour-level zoom; not currently returned by getScaleConfig.
    // NOTE: end intentionally equals add here — do NOT copy this pattern for new units.
    // All other units use endOf*(add*(date, step-1)) to include the full last unit.
    start: startOfHour,
    end: (date, step) => addHours(date, step), // exclusive end — see note above
    add: (date, step) => addHours(date, step),
  },
};

/**
 * Get the start date of a time unit (aligned to unit boundary)
 */
export function getUnitStart(date: Date, unit: ScaleUnit): Date {
  return UNIT_OPS[unit].start(date);
}

/**
 * Get the end date of a time unit
 */
export function getUnitEnd(date: Date, unit: ScaleUnit, step: number): Date {
  return UNIT_OPS[unit].end(date, step);
}

/**
 * Add time unit to date
 */
export function addUnit(date: Date, unit: ScaleUnit, step: number): Date {
  return UNIT_OPS[unit].add(date, step);
}

/** Named type for the visible date range returned by getVisibleDateRange. */
export type VisibleDateRange = { start: string; end: string };

/**
 * Get visible date range based on scroll position
 */
export function getVisibleDateRange(
  scale: TimelineScale,
  scrollX: number,
  viewportWidth: number
): VisibleDateRange {
  const start = pixelToDate(scrollX, scale);
  const end = pixelToDate(scrollX + viewportWidth, scale);
  return { start, end };
}
