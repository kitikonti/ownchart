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

/**
 * Convert a Date to ISO date string (YYYY-MM-DD).
 * Replaces the common `date.toISOString().split("T")[0]` pattern.
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Calculate duration between two dates in days (inclusive)
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
 * Format a Date object according to user's DateFormat preference.
 * @param date - The date to format
 * @param dateFormat - The user's date format preference
 * @returns Formatted date string
 */
export function formatDateByPreference(
  date: Date,
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"
): string {
  const formatMap = {
    "DD/MM/YYYY": "dd/MM/yyyy",
    "MM/DD/YYYY": "MM/dd/yyyy",
    "YYYY-MM-DD": "yyyy-MM-dd",
  };
  return format(date, formatMap[dateFormat]);
}

/**
 * Get min and max dates from task list
 * @returns { min: string, max: string } in ISO format
 */
export function getDateRange(tasks: Task[]): { min: string; max: string } {
  // Filter out tasks with invalid/empty dates (e.g., empty summaries)
  const validTasks = tasks.filter(
    (task) =>
      task.startDate &&
      task.endDate &&
      task.startDate !== "" &&
      task.endDate !== ""
  );

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
 * Get business days between dates (excluding weekends)
 */
export function getBusinessDays(start: string, end: string): number {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  let count = 0;

  let current = startDate;
  while (current <= endDate) {
    if (!isWeekend(format(current, "yyyy-MM-dd"))) {
      count++;
    }
    current = addDaysDateFns(current, 1);
  }

  return count;
}
