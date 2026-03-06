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

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Fetch holidays for a date range after configuring the holiday service.
 * Returns an empty array when holiday exclusion is disabled or no region is provided.
 */
function fetchHolidaysForRange(
  config: WorkingDaysConfig,
  holidayRegion: string | undefined,
  startDate: string,
  endDate: string
): HolidayInfo[] {
  if (!config.excludeHolidays || !holidayRegion) return [];
  holidayService.setRegion(holidayRegion);
  return holidayService.getHolidaysInRange(
    parseISO(startDate),
    parseISO(endDate)
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check if a date string represents a working day.
 *
 * Saturday and Sunday are checked independently (rather than via `isWeekend()`)
 * because `config.excludeSaturday` and `config.excludeSunday` are separate flags —
 * a user may work Saturdays while keeping Sundays excluded, or vice versa.
 *
 * When `config.excludeHolidays` is true and `holidayRegion` is provided, the
 * holiday service is configured internally — callers do not need to pre-call
 * `holidayService.setRegion()`. If `holidayRegion` is omitted while
 * `config.excludeHolidays` is true, holiday exclusion is silently skipped.
 *
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param config - Working days configuration
 * @param holidayRegion - Holiday region code. Required when `config.excludeHolidays`
 *   is true; if omitted, holiday exclusion is silently skipped.
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

  if (config.excludeHolidays && holidayRegion) {
    // setRegion is idempotent (no-op when the region is unchanged), so calling it
    // here makes isWorkingDay safe to use as a standalone function without requiring
    // the caller to pre-configure the service.
    holidayService.setRegion(holidayRegion);
    // isHolidayString returns HolidayInfo | null (not a boolean despite the name)
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
  if (startDate > endDate) return 0;

  // Fast path: if nothing is excluded, simple inclusive-day count suffices
  if (
    !config.excludeSaturday &&
    !config.excludeSunday &&
    !config.excludeHolidays
  ) {
    return calculateDuration(startDate, endDate);
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
 * Returns `startDate` unchanged for `days <= 0`.
 *
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param days - Number of working days to add. Must be ≥ 1; returns `startDate`
 *   for `days ≤ 0`.
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
  // Guard: non-positive day counts are a no-op regardless of config or fast path
  if (days <= 0) return startDate;

  // Fast path: no exclusions → simple date arithmetic (start date = day 1)
  if (
    !config.excludeSaturday &&
    !config.excludeSunday &&
    !config.excludeHolidays
  ) {
    return addDays(startDate, days - 1);
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
  const holidays = fetchHolidaysForRange(
    config,
    holidayRegion,
    startDate,
    endDate
  );

  // Build a Set of YYYY-MM-DD strings for O(1) holiday lookup during the loop.
  // format() uses local timezone, consistent with parseISO() used on currentDate.
  const holidayDateSet = new Set(
    holidays.map((h) => format(h.date, "yyyy-MM-dd"))
  );

  // Single pass: count weekends and working days simultaneously.
  // Holiday logic is inlined (rather than delegating to isWorkingDay) to use the
  // pre-built holidayDateSet for O(1) lookup instead of calling isHolidayString
  // per day.
  let weekendDays = 0;
  let workingDays = 0;
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const day = getDay(parseISO(currentDate));
    const isSat = day === 6;
    const isSun = day === 0;

    if (isSat || isSun) weekendDays++;

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
