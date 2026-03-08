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
  /** Only public and bank holidays are retained by getHolidaysForYear. */
  type: "public" | "bank";
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
  /**
   * Keyed by `"${country}-${state||""}-${year}"`.
   * The cache is cleared on every region change (setRegion), so in practice
   * entries accumulate only across distinct years for the active region.
   * For a Gantt tool the number of distinct years queried per session is
   * small (typically 1–3), making an unbounded Map acceptable here.
   */
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

    // Guard: no region set → return empty array without caching.
    // Intentionally not cached: callers that invoke this before setRegion()
    // are in a transient state; once a region is configured the key will
    // differ (non-empty country), so there is no repeated-work concern.
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
        // SAFETY: The .filter() above already ensures h.type is 'public' | 'bank'.
        // The assertion narrows the library's broader string type to HolidayInfo["type"].
        type: h.type as HolidayInfo["type"],
      }));

    this.cache.set(cacheKey, holidays);
    return holidays;
  }

  /**
   * Get holidays for a date range (spans multiple years if needed).
   * Returns an empty array when startDate > endDate (inverted range is a no-op).
   *
   * **Date comparison precision**: holiday dates retain the time component
   * produced by `new Date(h.date)` from the `date-holidays` library (typically
   * local midnight, but not guaranteed). Boundary holidays are included only
   * when `h.date >= startDate && h.date <= endDate` holds with full timestamp
   * precision. Callers should ensure `startDate` and `endDate` are set to
   * start-of-day (00:00:00.000) to avoid accidentally excluding boundary
   * holidays whose internal timestamp differs from the caller's value.
   */
  getHolidaysInRange(startDate: Date, endDate: Date): HolidayInfo[] {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    const allHolidays: HolidayInfo[] = [];

    // When startDate > endDate, startYear > endYear so the loop body never
    // executes and an empty array is returned — intentional silent no-op.
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
   * Look up holiday info for a date-only string in YYYY-MM-DD format.
   * Returns the matching HolidayInfo, or null if the date is not a holiday,
   * the string does not match YYYY-MM-DD exactly, or the date is calendar-invalid
   * (e.g. "2026-02-30").
   *
   * @param dateString - Date string in YYYY-MM-DD format. Datetime strings
   *   (e.g. "2026-12-25T00:00:00Z") and locale-specific formats
   *   (e.g. "12/25/2026") are rejected and return null.
   */
  getHolidayForDateString(dateString: string): HolidayInfo | null {
    // Enforce strict YYYY-MM-DD format before parsing.
    // Without this guard, datetime strings like "2026-12-25T00:00:00Z" would
    // be accepted — but new Date("…TZ") produces a UTC-midnight Date whose
    // local year/month/day differs from the calendar date in negative-offset
    // timezones (e.g. UTC-5: Dec 25 00:00 UTC → Dec 24 local), causing
    // isSameDay() to return false for the intended holiday.
    // Non-ISO formats like "12/25/2026" are also rejected here rather than
    // relying solely on the isNaN guard below.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return null;
    }
    // new Date("YYYY-MM-DD") is parsed as local midnight per the HTML spec
    // when the string has no time component, so isSameDay() comparisons are safe.
    const date = new Date(dateString);
    // Guard against calendar-invalid dates like "2026-02-30".
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
