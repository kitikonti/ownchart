/**
 * Working Days Calculator Utility
 * Sprint 1.5.9: User Preferences & Settings
 *
 * Calculates working days between dates, considering weekends and holidays.
 */

import { parseISO, getDay, format } from "date-fns";
import { holidayService, type HolidayInfo } from "@/services/holidayService";
import { addDays, calculateDuration } from "./dateUtils";
import type { WorkingDaysConfig } from "@/types/preferences.types";

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

// ─── Shared types ─────────────────────────────────────────────────────────────

/**
 * Working-days context passed through scheduling and drag/resize code paths.
 *
 * Single source of truth for "is working-days mode on, and if so, with what
 * configuration". Re-exported from `taskBarDragHelpers.ts` for back-compat
 * with the drag helpers introduced before this module owned the type.
 */
export interface WorkingDaysContext {
  enabled: boolean;
  config: WorkingDaysConfig;
  holidayRegion: string | undefined;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Buffer added to the `maxIterations` ceiling in {@link addWorkingDays}.
 * Even the densest real-world holiday calendar leaves this margin of safety —
 * if this guard ever triggers, it indicates an unhandled exclusion axis in
 * {@link WorkingDaysConfig} and the returned date will be incorrect.
 */
const WORKING_DAYS_LOOP_BUFFER = 60;

/**
 * Hard cap for {@link snapForwardToWorkingDay}. A degenerate config (e.g.
 * Sat+Sun excluded *and* a holiday region that marks every weekday as a
 * holiday) could otherwise loop indefinitely. Two years of calendar days is
 * far beyond any realistic gap between working days.
 */
const SNAP_FORWARD_MAX_ITERATIONS = 366 * 2;

/**
 * Typed error thrown by {@link addWorkingDays} and {@link snapForwardToWorkingDay}
 * when the iteration guard fires. Callers at the store/UI boundary catch this
 * and surface a toast rather than letting a partial cascade leak through.
 */
export class WorkingDaysLoopError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkingDaysLoopError";
  }
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
 * `getHolidayForDateString` on each iteration.
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

/**
 * Advance `startDate` forward until `count` working days have been found.
 *
 * Extracted from {@link addWorkingDays} so the outer function stays under the
 * 50-line limit and the iteration-guard logic (including its dev-mode warning)
 * is isolated in one place.
 *
 * `count × 7 + WORKING_DAYS_LOOP_BUFFER` calendar days is provably sufficient
 * to find `count` working days under any realistic holiday calendar. If the
 * guard fires, a new exclusion axis was added to {@link WorkingDaysConfig}
 * without updating {@link addWorkingDays}, and the returned date is incorrect.
 */
function advanceByWorkingDays(
  startDate: string,
  count: number,
  config: WorkingDaysConfig,
  holidayRegion: string | undefined
): string {
  let currentDate = startDate;
  let remaining = count;
  const maxIterations = count * 7 + WORKING_DAYS_LOOP_BUFFER;
  let iterations = 0;

  while (remaining > 0) {
    if (iterations++ >= maxIterations) {
      throw new WorkingDaysLoopError(
        "addWorkingDays iteration guard fired — the working-days configuration " +
          "may exclude every day. Check excludeSaturday/Sunday/Holidays and the " +
          "active holiday region."
      );
    }
    currentDate = addDays(currentDate, 1);
    if (isWorkingDay(currentDate, config, holidayRegion)) {
      remaining--;
    }
  }

  return currentDate;
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
    if (holidayService.getHolidayForDateString(dateString) !== null)
      return false;
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

  const holidays = fetchHolidaysForRange(
    config,
    holidayRegion,
    startDate,
    endDate
  );
  const holidayDateSet = buildHolidayDateSet(holidays);

  return scanWorkingDaysInRange(startDate, endDate, config, holidayDateSet)
    .workingDays;
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
 * @throws {WorkingDaysLoopError} when the iteration cap is exceeded — i.e. the
 *   active config excludes every calendar day (degenerate combination of
 *   weekday flags + holiday region). Callers at the store/UI boundary
 *   (drag commit, dependency cascade, cell edit) must catch this and surface
 *   a toast rather than letting a partial cascade leak through.
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

  // Start date counts as day 1 if it is a working day.
  // Holiday exclusions are checked via isWorkingDay (per-iteration getHolidayForDateString
  // call) rather than a pre-fetched Set, because the end date is unknown upfront.
  // This is safe: the holiday service caches per-year internally, so repeated
  // getHolidayForDateString calls are O(1) after the initial year load.
  let remainingDays = days;
  if (isWorkingDay(startDate, config, holidayRegion)) {
    remainingDays--;
  }

  if (remainingDays === 0) return startDate;

  return advanceByWorkingDays(startDate, remainingDays, config, holidayRegion);
}

/**
 * Subtract a number of working days from an end date — the symmetric inverse
 * of {@link addWorkingDays}.
 *
 * The end date counts as day 1 if it is itself a working day. For example,
 * `subtractWorkingDays("2025-01-10" /* Friday *\/, 1, EXCLUDE_WEEKENDS)`
 * returns `"2025-01-10"`, and `subtractWorkingDays("2025-01-10", 5, ...)`
 * returns `"2025-01-06"` (Mon).
 *
 * Returns `endDate` unchanged for `days <= 0`. Used by FF/SF dependency
 * arithmetic in `dateAdjustment.ts` to derive a successor's start date from
 * its constrained end date without resorting to a calendar-day buffer scan.
 *
 * @throws {WorkingDaysLoopError} when the iteration cap is exceeded — same
 *   degenerate-config contract as {@link addWorkingDays}.
 */
export function subtractWorkingDays(
  endDate: string,
  days: number,
  config: WorkingDaysConfig,
  holidayRegion?: string
): string {
  if (days <= 0) return endDate;

  // Fast path: no exclusions → simple date arithmetic.
  if (
    !config.excludeSaturday &&
    !config.excludeSunday &&
    !config.excludeHolidays
  ) {
    return addDays(endDate, -(days - 1));
  }

  if (config.excludeHolidays && holidayRegion) {
    holidayService.setRegion(holidayRegion);
  }

  let remaining = days;
  let current = endDate;
  if (isWorkingDay(current, config, holidayRegion)) {
    remaining--;
  }
  if (remaining === 0) return current;

  // Symmetric to advanceByWorkingDays — same iteration cap formula.
  const maxIterations = remaining * 7 + WORKING_DAYS_LOOP_BUFFER;
  let iterations = 0;
  while (remaining > 0) {
    if (iterations++ >= maxIterations) {
      throw new WorkingDaysLoopError(
        "subtractWorkingDays iteration guard fired — the working-days " +
          "configuration may exclude every day. Check excludeSaturday/Sunday/" +
          "Holidays and the active holiday region."
      );
    }
    current = addDays(current, -1);
    if (isWorkingDay(current, config, holidayRegion)) {
      remaining--;
    }
  }
  return current;
}

/**
 * Snap a date forward to the next working day (idempotent — returns the input
 * unchanged if it is already a working day).
 *
 * This is the **single shared anchor-normalisation helper** referenced by D4
 * in epic #79: any operation that may land a task start/end on a non-working
 * day (drag, resize, paste, CSV import, dependency cascade landing on a
 * holiday/weekend) routes through this function so that all four code paths
 * agree on the rule.
 *
 * @throws {WorkingDaysLoopError} when the iteration cap is exceeded (degenerate
 *   config that excludes every calendar day).
 */
export function snapForwardToWorkingDay(
  dateString: string,
  config: WorkingDaysConfig,
  holidayRegion?: string
): string {
  // Fast path: nothing excluded → every day is a working day.
  if (
    !config.excludeSaturday &&
    !config.excludeSunday &&
    !config.excludeHolidays
  ) {
    return dateString;
  }

  if (config.excludeHolidays && holidayRegion) {
    holidayService.setRegion(holidayRegion);
  }

  let current = dateString;
  let iterations = 0;
  while (!isWorkingDay(current, config, holidayRegion)) {
    if (iterations++ >= SNAP_FORWARD_MAX_ITERATIONS) {
      throw new WorkingDaysLoopError(
        "snapForwardToWorkingDay iteration guard fired — the working-days " +
          "configuration may exclude every day."
      );
    }
    current = addDays(current, 1);
  }
  return current;
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
