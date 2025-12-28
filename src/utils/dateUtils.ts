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
} from 'date-fns';
import type { Task } from '../types/chart.types';

/**
 * Calculate duration between two dates in days (inclusive)
 * @example calculateDuration('2025-01-01', '2025-01-05') // 5
 */
export function calculateDuration(
  startDate: string,
  endDate: string
): number {
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
  return format(result, 'yyyy-MM-dd');
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
 * Get min and max dates from task list
 * @returns { min: string, max: string } in ISO format
 */
export function getDateRange(tasks: Task[]): { min: string; max: string } {
  if (tasks.length === 0) {
    const today = format(new Date(), 'yyyy-MM-dd');
    return { min: today, max: addDays(today, 30) };
  }

  let minDate = tasks[0].startDate;
  let maxDate = tasks[0].endDate;

  tasks.forEach((task) => {
    if (task.startDate < minDate) minDate = task.startDate;
    if (task.endDate > maxDate) maxDate = task.endDate;
  });

  // Add padding (1 week before/after)
  return {
    min: addDays(minDate, -7),
    max: addDays(maxDate, 7),
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
    if (!isWeekend(format(current, 'yyyy-MM-dd'))) {
      count++;
    }
    current = addDaysDateFns(current, 1);
  }

  return count;
}
