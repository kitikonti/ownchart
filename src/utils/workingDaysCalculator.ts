/**
 * Working Days Calculator Utility
 * Sprint 1.5.9: User Preferences & Settings
 *
 * Calculates working days between dates, considering weekends and holidays.
 */

import { holidayService, type HolidayInfo } from "../services/holidayService";
import { isWeekend, addDays, calculateDuration } from "./dateUtils";
import type { WorkingDaysConfig } from "../types/preferences.types";

/**
 * Check if a date string is a working day
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param config - Working days configuration (what to exclude)
 * @param holidayRegion - Holiday region code (required if excludeHolidays is true)
 */
export function isWorkingDay(
  dateString: string,
  config: WorkingDaysConfig,
  holidayRegion?: string
): boolean {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();

  // Check Saturday
  if (config.excludeSaturday && dayOfWeek === 6) {
    return false;
  }

  // Check Sunday
  if (config.excludeSunday && dayOfWeek === 0) {
    return false;
  }

  // Check holidays
  if (config.excludeHolidays && holidayRegion) {
    holidayService.setRegion(holidayRegion);
    if (holidayService.isHolidayString(dateString) !== null) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate working days between two dates (inclusive)
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
  // If nothing is excluded, use simple duration calculation
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
 * Add working days to a date
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param days - Number of working days to add
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
  // If nothing is excluded, use simple date addition
  if (
    !config.excludeSaturday &&
    !config.excludeSunday &&
    !config.excludeHolidays
  ) {
    return addDays(startDate, days - 1); // -1 because start date counts as day 1
  }

  let currentDate = startDate;
  let remainingDays = days;

  // Start date counts as day 1 if it's a working day
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
 * Get holidays in a date range
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
  return holidayService.getHolidaysInRange(
    new Date(startDate),
    new Date(endDate)
  );
}

/**
 * Get a summary of working days calculation
 * Useful for displaying details to the user
 */
export function getWorkingDaysSummary(
  startDate: string,
  endDate: string,
  config: WorkingDaysConfig,
  holidayRegion?: string
): {
  totalDays: number;
  workingDays: number;
  weekendDays: number;
  holidayCount: number;
  holidays: HolidayInfo[];
} {
  const totalDays = calculateDuration(startDate, endDate);

  let weekendDays = 0;
  const holidays: HolidayInfo[] = [];

  // Get holidays in range
  if (config.excludeHolidays && holidayRegion) {
    holidayService.setRegion(holidayRegion);
    const allHolidays = holidayService.getHolidaysInRange(
      new Date(startDate),
      new Date(endDate)
    );
    holidays.push(...allHolidays);
  }

  // Count weekend days
  let currentDate = startDate;
  while (currentDate <= endDate) {
    if (isWeekend(currentDate)) {
      weekendDays++;
    }
    currentDate = addDays(currentDate, 1);
  }

  const workingDays = calculateWorkingDays(
    startDate,
    endDate,
    config,
    holidayRegion
  );

  return {
    totalDays,
    workingDays,
    weekendDays,
    holidayCount: holidays.length,
    holidays,
  };
}

/**
 * Calculate the end date given a start date and number of working days
 * This is the inverse of calculateWorkingDays
 */
export function calculateEndDateFromWorkingDays(
  startDate: string,
  workingDays: number,
  config: WorkingDaysConfig,
  holidayRegion?: string
): string {
  return addWorkingDays(startDate, workingDays, config, holidayRegion);
}
