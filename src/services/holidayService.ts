/**
 * Holiday Service for managing holiday data using date-holidays library.
 * Sprint 1.5.9: User Preferences & Settings
 */

import Holidays, { type HolidaysTypes } from "date-holidays";

/**
 * Locale used when querying country/state names from date-holidays.
 * All UI lists are returned in English; change this constant to localise them.
 */
const HOLIDAY_DISPLAY_LOCALE = "en" as const;

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
 * Parse a strict YYYY-MM-DD date string to a local-midnight Date object.
 *
 * Extracted as a module-level function (no `this` dependency) to improve
 * testability and make it reusable outside the class if needed.
 *
 * Returns null when:
 *   - the string does not match YYYY-MM-DD exactly (rejects datetime strings
 *     like "2026-12-25T00:00:00Z" and locale formats like "12/25/2026"), or
 *   - the date is calendar-invalid (e.g. "2026-02-30" — V8 silently rolls
 *     these over instead of returning NaN, so we cross-check the components).
 *
 * new Date("YYYY-MM-DD") is parsed as local midnight per the HTML spec when
 * the string has no time component, so isSameDay() comparisons are safe on
 * the returned Date.
 *
 * @param dateString - Date string to parse.
 * @returns A local-midnight Date for the given calendar date, or null.
 */
function parseDateOnlyString(dateString: string): Date | null {
  // Enforce strict YYYY-MM-DD format before parsing.
  // Without this guard, datetime strings like "2026-12-25T00:00:00Z" would
  // be accepted — but new Date("…TZ") produces a UTC-midnight Date whose
  // local year/month/day differs from the calendar date in negative-offset
  // timezones (e.g. UTC-5: Dec 25 00:00 UTC → Dec 24 local), causing
  // isSameDay() to return false for the intended holiday.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }
  const date = new Date(dateString);
  // Guard against calendar-invalid dates like "2026-02-30".
  // isNaN alone is insufficient on V8: new Date("2026-02-30") does not return
  // NaN — V8 silently rolls over to 2026-03-02. We cross-check the parsed
  // year/month/day against the original string components to detect rollover.
  if (isNaN(date.getTime())) {
    return null;
  }
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  if (
    date.getFullYear() !== Number(yearStr) ||
    date.getMonth() + 1 !== Number(monthStr) ||
    date.getDate() !== Number(dayStr)
  ) {
    return null;
  }
  return date;
}

/**
 * Holiday Service class - singleton pattern.
 * Manages holiday data for a configured region.
 *
 * Named `_HolidayService` (underscore prefix) to signal that direct
 * instantiation is not intended — consumers should use the exported
 * `holidayService` singleton rather than constructing their own instance.
 */
class _HolidayService {
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
   * Set the active holiday region.
   * Silently ignores calls that would set the same region already active.
   * Logs a warning and leaves the previous region intact if the underlying
   * library rejects the country/state combination (e.g. unknown codes).
   *
   * @param country ISO 3166-1 alpha-2 code (e.g., 'AT', 'DE', 'US')
   * @param state Optional state/region code (e.g., 'BY' for Bavaria)
   */
  setRegion(country: string, state?: string): void {
    // Skip if already set to the same region
    if (this.currentCountry === country && this.currentState === state) {
      return;
    }

    try {
      this.hd.init(country, state);
    } catch (err) {
      // date-holidays can throw for unknown country/state codes.
      // Log the error and leave the previous region unchanged so the app
      // continues functioning rather than entering an inconsistent state.
      console.error(
        `[holidayService] Failed to initialise region "${country}"${state ? `/${state}` : ""}:`,
        err
      );
      return;
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
   * Get all public/bank holidays for a year.
   *
   * Results are cached per region+year key and returned from the cache on
   * subsequent calls for the same year. The cache is cleared automatically
   * whenever `setRegion()` changes the active region.
   *
   * @param year - The calendar year to fetch holidays for (e.g. 2026).
   * @returns Array of public/bank holidays for the year. Returns an empty
   *   array when no region has been set or when the underlying library throws.
   */
  getHolidaysForYear(year: number): HolidayInfo[] {
    const cacheKey = `${this.currentCountry}-${this.currentState || ""}-${year}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    // Guard: no region set → return empty array without caching.
    // Intentionally not cached: callers that invoke this before setRegion()
    // are in a transient state; once a region is configured the key will
    // differ (non-empty country), so there is no repeated-work concern.
    if (!this.currentCountry) {
      return [];
    }

    let rawHolidays: HolidaysTypes.Holiday[];
    try {
      rawHolidays = this.hd.getHolidays(year);
    } catch (err) {
      // date-holidays can throw for edge-case years or invalid internal state.
      // Return an empty array so the calendar degrades gracefully.
      console.error(
        `[holidayService] Failed to load holidays for year ${year}:`,
        err
      );
      return [];
    }

    // Filter to only public and bank holidays
    const holidays: HolidayInfo[] = rawHolidays
      .filter((h) => h.type === "public" || h.type === "bank")
      .map((h) => ({
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
    const date = parseDateOnlyString(dateString);
    return date ? this.isHoliday(date) : null;
  }

  /**
   * Get list of available countries
   */
  getAvailableCountries(): CountryInfo[] {
    const countries = this.hd.getCountries(HOLIDAY_DISPLAY_LOCALE);
    if (!countries) return [];

    return (
      Object.entries(countries)
        // date-holidays returns string values for the 'en' locale.
        // For other locales the value may be a nested object; filter those out
        // defensively in case HOLIDAY_DISPLAY_LOCALE is ever changed.
        .filter(([, name]) => typeof name === "string")
        .map(([code, name]) => ({
          code,
          name: name as string,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, HOLIDAY_DISPLAY_LOCALE))
    );
  }

  /**
   * Get list of available states/regions for a country
   */
  getAvailableStates(countryCode: string): StateInfo[] {
    const states = this.hd.getStates(countryCode, HOLIDAY_DISPLAY_LOCALE);
    if (!states) return [];

    return (
      Object.entries(states)
        // date-holidays returns string values for the 'en' locale.
        // For other locales the value may be a nested object; filter those out
        // defensively in case HOLIDAY_DISPLAY_LOCALE is ever changed.
        .filter(([, name]) => typeof name === "string")
        .map(([code, name]) => ({
          code,
          name: name as string,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, HOLIDAY_DISPLAY_LOCALE))
    );
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
   * Clear all cached holiday data without touching the active region.
   *
   * Use this when you want to force a fresh fetch for subsequent
   * `getHolidaysForYear` calls while keeping the region intact.
   *
   * For test teardown, prefer `reset()` — it clears the cache *and* resets
   * the region so each test starts from a fully pristine state.
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
 * Singleton instance of the holiday service.
 * All consumers should use this exported instance directly.
 */
export const holidayService = new _HolidayService();

// Re-exported here so callers of holidayService need only one import for all
// holiday-related functionality (region detection + service instance).
// The implementation lives in localeDetection.ts (single source of truth).
export { detectLocaleHolidayRegion } from "../utils/localeDetection";
