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
   * Check if a date string is a holiday
   */
  isHolidayString(dateString: string): HolidayInfo | null {
    return this.isHoliday(new Date(dateString));
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
        name: name as string,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get popular/common countries for quick selection
   */
  getPopularCountries(): string[] {
    return ["DE", "AT", "CH", "US", "GB", "FR", "IT", "ES", "NL", "BE"];
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
}

/**
 * Singleton instance of HolidayService
 */
export const holidayService = new HolidayServiceClass();

// Re-export from localeDetection (single source of truth)
export { detectLocaleHolidayRegion } from "../utils/localeDetection";
