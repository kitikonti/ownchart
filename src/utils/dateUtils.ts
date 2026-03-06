/**
 * Date utility functions for Gantt chart timeline calculations
 * Using date-fns for reliable date manipulation
 */

import {
  parseISO,
  differenceInDays,
  addDays as addDaysDateFns,
  format,
  getDay,
} from "date-fns";
import type { Task } from "../types/chart.types";
import type { DateFormat } from "../types/preferences.types";

/** Maps DateFormat preference values to date-fns format strings. */
const DATE_FORMAT_PATTERNS: Record<DateFormat, string> = {
  "DD/MM/YYYY": "dd/MM/yyyy",
  "MM/DD/YYYY": "MM/dd/yyyy",
  "YYYY-MM-DD": "yyyy-MM-dd",
};

/**
 * Convert a Date to ISO date string (YYYY-MM-DD) using local timezone.
 * Replaces the common `date.toISOString().split("T")[0]` anti-pattern,
 * which is UTC-based and returns the wrong date for users east of UTC+0
 * when dates from date-fns (which uses local midnight) are involved.
 */
export function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Calculate duration between two dates in days (inclusive).
 * Returns a positive number when endDate >= startDate.
 * Returns 0 for the same day, negative when endDate < startDate.
 * @example calculateDuration('2025-01-01', '2025-01-05') // 5
 */
export function calculateDuration(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return differenceInDays(end, start) + 1; // +1 for inclusive
}

/**
 * Add days to a date string
 * @example addDays('2025-01-01', 5) // '2025-01-06'
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseISO(dateStr);
  const result = addDaysDateFns(date, days);
  return format(result, "yyyy-MM-dd");
}

/**
 * Format date for display
 * @example formatDate('2025-01-15', 'MMM dd') // 'Jan 15'
 */
export function formatDate(dateStr: string, formatStr: string): string {
  const date = parseISO(dateStr);
  return format(date, formatStr);
}

/**
 * Format a date according to user's DateFormat preference.
 * Accepts both Date objects and ISO date strings (YYYY-MM-DD).
 * @param date - The date to format (Date object or ISO string)
 * @param dateFormat - The user's date format preference
 * @returns Formatted date string
 */
export function formatDateByPreference(
  date: Date | string,
  dateFormat: DateFormat
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, DATE_FORMAT_PATTERNS[dateFormat]);
}

/**
 * Get min and max dates from task list
 * @returns { min: string, max: string } in ISO format
 */
export function getDateRange(tasks: Task[]): { min: string; max: string } {
  // Filter out tasks with invalid/empty dates (e.g., empty summaries)
  const validTasks = tasks.filter((task) => task.startDate && task.endDate);

  if (validTasks.length === 0) {
    const today = format(new Date(), "yyyy-MM-dd");
    return { min: today, max: addDays(today, 30) };
  }

  let minDate = validTasks[0].startDate;
  let maxDate = validTasks[0].endDate;

  validTasks.forEach((task) => {
    if (task.startDate < minDate) minDate = task.startDate;
    if (task.endDate > maxDate) maxDate = task.endDate;
  });

  // Return raw dates WITHOUT padding
  // Padding should be added by the caller when needed (e.g., fitToView, updateScale)
  return {
    min: minDate,
    max: maxDate,
  };
}

/**
 * Check if date is weekend
 */
export function isWeekend(dateStr: string): boolean {
  const date = parseISO(dateStr);
  const day = getDay(date);
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Get business days between dates (excluding weekends, inclusive of start and end).
 * Returns 0 if start > end.
 */
export function getBusinessDays(start: string, end: string): number {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  if (startDate > endDate) return 0;

  const totalDays = differenceInDays(endDate, startDate) + 1;
  const fullWeeks = Math.floor(totalDays / 7);
  let businessDays = fullWeeks * 5;

  // Tally weekdays in the remaining partial week (0–6 iterations — O(1) overall).
  const startDow = getDay(startDate); // 0 = Sun … 6 = Sat
  const remainingDays = totalDays % 7;
  for (let i = 0; i < remainingDays; i++) {
    const dow = (startDow + i) % 7;
    if (dow !== 0 && dow !== 6) businessDays++;
  }

  return businessDays;
}
