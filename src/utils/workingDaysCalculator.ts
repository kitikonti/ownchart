/**
 * Working Days Calculator Utility
 * Sprint 1.5.9: User Preferences & Settings
 *
 * Calculates working days between dates, considering weekends and holidays.
 */

import { parseISO, getDay, format } from "date-fns";
import { holidayService, type HolidayInfo } from "../services/holidayService";
import { addDays, calculateDuration } from "./dateUtils";
import type { WorkingDaysConfig } from "../types/preferences.types";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Summary of a working-day calculation, useful for displaying a breakdown to the user. */
export interface WorkingDaysSummary {
  totalDays: number;
  workingDays: number;
  weekendDays: number;
  holidayCount: number;
  holidays: HolidayInfo[];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check if a date string represents a working day.
 *
 * Saturday and Sunday are checked independently (rather than via `isWeekend()`)
 * because `config.excludeSaturday` and `config.excludeSunday` are separate flags —
 * a user may work Saturdays while keeping Sundays excluded, or vice versa.
 *
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param config - Working days configuration
 * @param holidayRegion - Holiday region code. When `config.excludeHolidays` is true,
 *   the caller is responsible for calling `holidayService.setRegion()` before invoking
 *   this function so the service is already configured for the correct region.
 */
export function isWorkingDay(
  dateString: string,
  config: WorkingDaysConfig,
  holidayRegion?: string
): boolean {
  // parseISO treats "YYYY-MM-DD" as local midnight, avoiding the UTC-parsing +
  // local-getDay mismatch that `new Date(dateString).getDay()` produces in
  // UTC-offset timezones.
  const dayOfWeek = getDay(parseISO(dateString));

  if (config.excludeSaturday && dayOfWeek === 6) return false;
  if (config.excludeSunday && dayOfWeek === 0) return false;

  // Caller is responsible for setting the region before entering a loop.
  if (config.excludeHolidays && holidayRegion) {
    if (holidayService.isHolidayString(dateString) !== null) return false;
  }

  return true;
}

/**
 * Calculate the number of working days between two dates (inclusive).
 *
 * Returns 0 when `endDate` is before `startDate`.
 *
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @param config - Working days configuration
 * @param holidayRegion - Holiday region code
 */
export function calculateWorkingDays(
  startDate: string,
  endDate: string,
  config: WorkingDaysConfig,
  holidayRegion?: string
): number {
  // Fast path: if nothing is excluded, simple inclusive-day count suffices
  if (
    !config.excludeSaturday &&
    !config.excludeSunday &&
    !config.excludeHolidays
  ) {
    return calculateDuration(startDate, endDate);
  }

  // Configure the holiday service once before the loop, not on every isWorkingDay call
  if (config.excludeHolidays && holidayRegion) {
    holidayService.setRegion(holidayRegion);
  }

  let count = 0;
  let currentDate = startDate;

  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate, config, holidayRegion)) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return count;
}

/**
 * Add a number of working days to a start date.
 *
 * The start date counts as day 1 if it is itself a working day. For example,
 * `addWorkingDays("2025-01-06" /* Monday *\/, 1, config)` returns `"2025-01-06"`.
 *
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param days - Number of working days to add. Must be ≥ 1; behaviour for
 *   `days ≤ 0` is unspecified — callers should guard against this.
 * @param config - Working days configuration
 * @param holidayRegion - Holiday region code
 * @returns End date string (YYYY-MM-DD)
 */
export function addWorkingDays(
  startDate: string,
  days: number,
  config: WorkingDaysConfig,
  holidayRegion?: string
): string {
  // Fast path: no exclusions → simple date arithmetic (start date = day 1)
  if (
    !config.excludeSaturday &&
    !config.excludeSunday &&
    !config.excludeHolidays
  ) {
    return addDays(startDate, days - 1);
  }

  // Configure the holiday service once before the loop
  if (config.excludeHolidays && holidayRegion) {
    holidayService.setRegion(holidayRegion);
  }

  let currentDate = startDate;
  let remainingDays = days;

  // Start date counts as day 1 if it is a working day
  if (isWorkingDay(currentDate, config, holidayRegion)) {
    remainingDays--;
  }

  while (remainingDays > 0) {
    currentDate = addDays(currentDate, 1);
    if (isWorkingDay(currentDate, config, holidayRegion)) {
      remainingDays--;
    }
  }

  return currentDate;
}

/**
 * Get all holidays within a date range for a given region.
 *
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @param holidayRegion - Holiday region code
 */
export function getHolidaysInRange(
  startDate: string,
  endDate: string,
  holidayRegion: string
): HolidayInfo[] {
  holidayService.setRegion(holidayRegion);
  // Use parseISO so dates are interpreted as local midnight, matching the
  // holiday service's internal Date comparisons.
  return holidayService.getHolidaysInRange(
    parseISO(startDate),
    parseISO(endDate)
  );
}

/**
 * Get a summary of working days for a date range.
 *
 * Performs a single pass through the date range to compute all metrics
 * simultaneously, avoiding the double-iteration that separate
 * `calculateWorkingDays` + weekend-counting loops would require.
 *
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @param config - Working days configuration
 * @param holidayRegion - Holiday region code
 */
export function getWorkingDaysSummary(
  startDate: string,
  endDate: string,
  config: WorkingDaysConfig,
  holidayRegion?: string
): WorkingDaysSummary {
  const totalDays = calculateDuration(startDate, endDate);

  // Fetch the full holiday list once (the service caches per-year internally)
  const holidays: HolidayInfo[] = [];
  if (config.excludeHolidays && holidayRegion) {
    holidayService.setRegion(holidayRegion);
    holidays.push(
      ...holidayService.getHolidaysInRange(
        parseISO(startDate),
        parseISO(endDate)
      )
    );
  }

  // Build a Set of YYYY-MM-DD strings for O(1) holiday lookup during the loop.
  // format() uses local timezone, consistent with parseISO() used on currentDate.
  const holidayDateSet = new Set(
    holidays.map((h) => format(h.date, "yyyy-MM-dd"))
  );

  // Single pass: count weekends and working days simultaneously
  let weekendDays = 0;
  let workingDays = 0;
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const day = getDay(parseISO(currentDate));
    const isSat = day === 6;
    const isSun = day === 0;

    if (isSat || isSun) weekendDays++;

    // Mirrors isWorkingDay() logic — inlined to avoid a redundant setRegion()
    // call on every iteration of the loop.
    let isWorking = true;
    if (config.excludeSaturday && isSat) isWorking = false;
    else if (config.excludeSunday && isSun) isWorking = false;
    else if (config.excludeHolidays && holidayDateSet.has(currentDate))
      isWorking = false;

    if (isWorking) workingDays++;
    currentDate = addDays(currentDate, 1);
  }

  return {
    totalDays,
    workingDays,
    weekendDays,
    holidayCount: holidays.length,
    holidays,
  };
}
