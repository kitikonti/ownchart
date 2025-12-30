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
  endOfYear,
  endOfQuarter,
  endOfMonth,
  endOfWeek,
  endOfDay,
} from 'date-fns';
import type { Task } from '../types/chart.types';
import { calculateDuration, addDays } from './dateUtils';

// Scale unit types (inspired by SVAR React Gantt)
export type ScaleUnit = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour';

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

  // Very zoomed out (< 5 pixels per day): Year → Quarter
  if (effectivePixelsPerDay < 5) {
    return [
      { unit: 'year', step: 1, format: 'yyyy' },
      {
        unit: 'quarter',
        step: 1,
        format: (date) => `Q${Math.floor(date.getMonth() / 3) + 1}`,
      },
    ];
  }

  // Zoomed out (5-15 pixels per day): Year → Month
  if (effectivePixelsPerDay < 15) {
    return [
      { unit: 'year', step: 1, format: 'yyyy' },
      { unit: 'month', step: 1, format: 'MMM' },
    ];
  }

  // Medium zoom (15-30 pixels per day): Month → Week
  if (effectivePixelsPerDay < 30) {
    return [
      { unit: 'month', step: 1, format: 'MMM yyyy' },
      { unit: 'week', step: 1, format: (date) => `W${getWeek(date)}` },
    ];
  }

  // Zoomed in (30-60 pixels per day): Month → Day
  if (effectivePixelsPerDay < 60) {
    return [
      { unit: 'month', step: 1, format: 'MMMM yyyy' },
      { unit: 'day', step: 1, format: 'd' },
    ];
  }

  // Very zoomed in (60+ pixels per day): Week → Day with time
  return [
    { unit: 'week', step: 1, format: (date) => `Week ${getWeek(date)}` },
    { unit: 'day', step: 1, format: 'EEE d' },
  ];
}

/**
 * Calculate timeline scale from date range and available width
 * Note: At zoom=1, timeline fills the entire container width
 *       At zoom>1, timeline expands (enables horizontal scroll)
 */
export function getTimelineScale(
  minDate: string,
  maxDate: string,
  containerWidth: number,
  zoom: number = 1
): TimelineScale {
  const totalDays = calculateDuration(minDate, maxDate);

  // Calculate pixelsPerDay: at zoom=1, fill container; at zoom>1, expand timeline
  const pixelsPerDay = (containerWidth / totalDays) * zoom;

  return {
    minDate,
    maxDate,
    pixelsPerDay,
    totalWidth: containerWidth * zoom, // At zoom=1: full width; zoom>1: wider (scrollable)
    totalDays,
    zoom,
    scales: getScaleConfig(zoom, containerWidth / totalDays),
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
 * Get task bar geometry for rendering
 * @param rowHeight - Height of each task row (default 44px: h-[44px] fixed height)
 * @param headerHeight - Height of timeline header (default 48px: 2×24px rows)
 */
export function getTaskBarGeometry(
  task: Task,
  scale: TimelineScale,
  rowIndex: number,
  rowHeight: number = 44,
  headerHeight: number = 48
): TaskBarGeometry {
  const x = dateToPixel(task.startDate, scale);

  // Milestones only need startDate (they represent a point in time, not a duration)
  const endDate = task.endDate || task.startDate;
  const duration = calculateDuration(task.startDate, endDate);
  const width = duration * scale.pixelsPerDay;

  return {
    x,
    y: headerHeight + rowIndex * rowHeight + 6, // Header + row offset + centering (44-32)/2 = 6px
    width,
    height: 32, // Task bar height
  };
}

/**
 * Get the end date of a time unit
 */
export function getUnitEnd(date: Date, unit: ScaleUnit, step: number): Date {
  switch (unit) {
    case 'year':
      return endOfYear(addYears(date, step - 1));
    case 'quarter':
      return endOfQuarter(addQuarters(date, step - 1));
    case 'month':
      return endOfMonth(addMonths(date, step - 1));
    case 'week':
      return endOfWeek(addWeeks(date, step - 1));
    case 'day':
      return endOfDay(addDaysDateFns(date, step - 1));
    case 'hour':
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
    case 'year':
      return addYears(date, step);
    case 'quarter':
      return addQuarters(date, step);
    case 'month':
      return addMonths(date, step);
    case 'week':
      return addWeeks(date, step);
    case 'day':
      return addDaysDateFns(date, step);
    case 'hour':
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
