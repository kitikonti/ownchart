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
  /**
   * Total calendar Saturday + Sunday count in the range,
   * **independent of `config.excludeSaturday` / `config.excludeSunday`**.
   * This is an informational metric for display; it does not equal the number
   * of excluded weekend days when one or both flags are disabled.
   */
  weekendDays: number;
  /**
   * Number of holidays returned by the holiday service for the range.
   * Populated only when `config.excludeHolidays` is true and a
   * `holidayRegion` is provided; otherwise `0`.
   *
   * Note: holidays that fall on a weekend are counted here *and* in
   * `weekendDays`. To get the total number of excluded days, use
   * `totalDays - workingDays`.
   */
  holidayCount: number;
  holidays: HolidayInfo[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Buffer added to the `maxIterations` ceiling in {@link addWorkingDays}.
 * Even the densest real-world holiday calendar leaves this margin of safety —
 * if this guard ever triggers, it indicates an unhandled exclusion axis in
 * {@link WorkingDaysConfig} and the returned date will be incorrect.
 */
const WORKING_DAYS_LOOP_BUFFER = 60;

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

/** Internal result of {@link scanWorkingDaysInRange}. */
interface WorkingDaysScan {
  workingDays: number;
  weekendDays: number;
}

/**
 * Single-pass scan of a date range to count working days and calendar weekend days.
 *
 * Holiday logic is inlined (rather than delegating to isWorkingDay) to use the
 * pre-built `holidayDateSet` for O(1) lookup per day instead of calling
 * `isHolidayString` on each iteration.
 *
 * Assumes `startDate <= endDate` — call only after validating the range.
 */
function scanWorkingDaysInRange(
  startDate: string,
  endDate: string,
  config: WorkingDaysConfig,
  holidayDateSet: Set<string>
): WorkingDaysScan {
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

  return { workingDays, weekendDays };
}

/**
 * Build a Set of YYYY-MM-DD strings for O(1) per-day holiday lookup.
 * Uses `format()` with local timezone, consistent with `parseISO()` used on
 * `currentDate` in the iteration loops.
 */
function buildHolidayDateSet(holidays: HolidayInfo[]): Set<string> {
  return new Set(holidays.map((h) => format(h.date, "yyyy-MM-dd")));
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

  const holidays = fetchHolidaysForRange(config, holidayRegion, startDate, endDate);
  const holidayDateSet = buildHolidayDateSet(holidays);

  return scanWorkingDaysInRange(startDate, endDate, config, holidayDateSet).workingDays;
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

  // Pre-configure the holiday service once so that per-iteration isWorkingDay
  // calls find it already in the correct state (setRegion is idempotent, but
  // calling it here makes the intent explicit and avoids redundant work).
  if (config.excludeHolidays && holidayRegion) {
    holidayService.setRegion(holidayRegion);
  }

  let currentDate = startDate;
  let remainingDays = days;

  // Start date counts as day 1 if it is a working day
  if (isWorkingDay(currentDate, config, holidayRegion)) {
    remainingDays--;
  }

  // Holiday exclusions are checked via isWorkingDay (per-iteration isHolidayString
  // call) rather than a pre-fetched Set, because the end date is unknown upfront.
  // This is safe: the holiday service caches per-year internally, so repeated
  // isHolidayString calls are O(1) after the initial year load.
  //
  // Guard against unbounded iteration: days × 7 + WORKING_DAYS_LOOP_BUFFER calendar
  // days is provably sufficient to find `days` working days under any realistic
  // holiday calendar. If this guard ever fires, a new exclusion axis was added to
  // WorkingDaysConfig without updating this function, and the returned date will
  // be incorrect.
  const maxIterations = days * 7 + WORKING_DAYS_LOOP_BUFFER;
  let iterations = 0;

  while (remainingDays > 0) {
    if (iterations++ >= maxIterations) break;
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
 * Returns all-zero metrics when `endDate` is before `startDate`.
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
  if (startDate > endDate) {
    return {
      totalDays: 0,
      workingDays: 0,
      weekendDays: 0,
      holidayCount: 0,
      holidays: [],
    };
  }

  const totalDays = calculateDuration(startDate, endDate);

  // Fetch the full holiday list once (the service caches per-year internally)
  const holidays = fetchHolidaysForRange(
    config,
    holidayRegion,
    startDate,
    endDate
  );

  const holidayDateSet = buildHolidayDateSet(holidays);

  const { workingDays, weekendDays } = scanWorkingDaysInRange(
    startDate,
    endDate,
    config,
    holidayDateSet
  );

  return {
    totalDays,
    workingDays,
    weekendDays,
    holidayCount: holidays.length,
    holidays,
  };
}
