/**
 * Holiday Service for managing holiday data using date-holidays library.
 * Sprint 1.5.9: User Preferences & Settings
 */

import Holidays, { type HolidaysTypes } from "date-holidays";

/**
 * Holiday information interface
 */
export interface HolidayInfo {
  date: Date;
  name: string;
  type: "public" | "bank" | "school" | "optional" | "observance";
}

/**
 * Country/region information
 */
export interface CountryInfo {
  code: string;
  name: string;
}

/**
 * State/region information within a country
 */
export interface StateInfo {
  code: string;
  name: string;
}

/**
 * Popular/common country codes for quick selection.
 * Exported so callers (e.g., tests and UI) can derive counts without
 * relying on magic literals.
 */
export const POPULAR_COUNTRY_CODES: readonly string[] = [
  "DE",
  "AT",
  "CH",
  "US",
  "GB",
  "FR",
  "IT",
  "ES",
  "NL",
  "BE",
];

/**
 * Holiday Service class - singleton pattern
 * Manages holiday data for a configured region
 */
class HolidayServiceClass {
  private hd: Holidays;
  private cache: Map<string, HolidayInfo[]> = new Map();
  private currentCountry: string = "";
  private currentState: string | undefined = undefined;

  constructor() {
    this.hd = new Holidays();
  }

  /**
   * Set the active holiday region
   * @param country ISO 3166-1 alpha-2 code (e.g., 'AT', 'DE', 'US')
   * @param state Optional state/region code (e.g., 'BY' for Bavaria)
   */
  setRegion(country: string, state?: string): void {
    // Skip if already set to the same region
    if (this.currentCountry === country && this.currentState === state) {
      return;
    }

    if (state) {
      this.hd.init(country, state);
    } else {
      this.hd.init(country);
    }

    this.currentCountry = country;
    this.currentState = state;

    // Clear cache when region changes
    this.cache.clear();
  }

  /**
   * Get current region
   */
  getCurrentRegion(): { country: string; state?: string } {
    return {
      country: this.currentCountry,
      state: this.currentState,
    };
  }

  /**
   * Get all public/bank holidays for a year
   */
  getHolidaysForYear(year: number): HolidayInfo[] {
    const cacheKey = `${this.currentCountry}-${this.currentState || ""}-${year}`;
    if (this.cache.has(cacheKey)) {
      // safe: presence was verified by .has() above
      return this.cache.get(cacheKey)!;
    }

    // Return empty array if no region is set
    if (!this.currentCountry) {
      return [];
    }

    const rawHolidays = this.hd.getHolidays(year);

    // Filter to only public and bank holidays
    const holidays: HolidayInfo[] = rawHolidays
      .filter(
        (h: HolidaysTypes.Holiday) => h.type === "public" || h.type === "bank"
      )
      .map((h: HolidaysTypes.Holiday) => ({
        date: new Date(h.date),
        name: h.name,
        // date-holidays narrows type to 'public'|'bank' after the filter above,
        // but its TS type still includes all holiday variants — cast is safe here.
        type: h.type as HolidayInfo["type"],
      }));

    this.cache.set(cacheKey, holidays);
    return holidays;
  }

  /**
   * Get holidays for a date range (spans multiple years if needed)
   */
  getHolidaysInRange(startDate: Date, endDate: Date): HolidayInfo[] {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    const allHolidays: HolidayInfo[] = [];

    for (let year = startYear; year <= endYear; year++) {
      const yearHolidays = this.getHolidaysForYear(year);
      allHolidays.push(
        ...yearHolidays.filter((h) => h.date >= startDate && h.date <= endDate)
      );
    }

    return allHolidays;
  }

  /**
   * Check if a specific date is a holiday
   * @returns Holiday info if it's a holiday, null otherwise
   */
  isHoliday(date: Date): HolidayInfo | null {
    const holidays = this.getHolidaysForYear(date.getFullYear());
    return holidays.find((h) => this.isSameDay(h.date, date)) || null;
  }

  /**
   * Look up holiday info for an ISO 8601 date string (e.g. "2026-12-25").
   * Returns the matching HolidayInfo, or null if the date is not a holiday
   * or if the string is not a valid date.
   *
   * @param dateString - ISO 8601 date string (YYYY-MM-DD). Non-ISO formats may
   *   behave differently across browsers and should be avoided.
   */
  getHolidayForDateString(dateString: string): HolidayInfo | null {
    // Requires ISO 8601 (YYYY-MM-DD); non-ISO strings may parse inconsistently
    // across browsers. The isNaN guard catches truly invalid strings but not
    // locale-ambiguous formats like "12/25/2026".
    const date = new Date(dateString);
    // Guard against invalid date strings (e.g. malformed task data)
    if (isNaN(date.getTime())) {
      return null;
    }
    return this.isHoliday(date);
  }

  /**
   * Get list of available countries
   */
  getAvailableCountries(): CountryInfo[] {
    const countries = this.hd.getCountries("en");
    if (!countries) return [];

    return Object.entries(countries)
      .map(([code, name]) => ({
        code,
        // date-holidays returns plain strings for the 'en' locale; cast is safe.
        name: name as string,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get list of available states/regions for a country
   */
  getAvailableStates(countryCode: string): StateInfo[] {
    const states = this.hd.getStates(countryCode, "en");
    if (!states) return [];

    return Object.entries(states)
      .map(([code, name]) => ({
        code,
        // date-holidays returns plain strings for the 'en' locale; cast is safe.
        name: name as string,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Helper: Compare two dates (day only, ignoring time)
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Clear all cached holiday data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset all service state (region + cache).
   * Intended for use in tests to cleanly restore a pristine state without
   * relying on internal field access.
   */
  reset(): void {
    this.currentCountry = "";
    this.currentState = undefined;
    this.cache.clear();
    this.hd = new Holidays();
  }
}

/**
 * Singleton instance of HolidayService
 */
export const holidayService = new HolidayServiceClass();

// Re-export from localeDetection (single source of truth)
export { detectLocaleHolidayRegion } from "../utils/localeDetection";
