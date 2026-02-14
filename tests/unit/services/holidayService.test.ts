/**
 * Unit tests for Holiday Service
 * Sprint 1.5.9: User Preferences & Settings
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  holidayService,
  detectLocaleHolidayRegion,
} from "../../../src/services/holidayService";

describe("HolidayService", () => {
  beforeEach(() => {
    // Reset service state before each test
    holidayService.clearCache();
  });

  describe("setRegion", () => {
    it("should set region for Austria", () => {
      holidayService.setRegion("AT");
      const region = holidayService.getCurrentRegion();
      expect(region.country).toBe("AT");
      expect(region.state).toBeUndefined();
    });

    it("should set region with state", () => {
      holidayService.setRegion("DE", "BY");
      const region = holidayService.getCurrentRegion();
      expect(region.country).toBe("DE");
      expect(region.state).toBe("BY");
    });

    it("should clear cache when region changes", () => {
      holidayService.setRegion("AT");
      // Load holidays to populate cache
      holidayService.getHolidaysForYear(2026);

      // Change region - should clear cache
      holidayService.setRegion("DE");
      const region = holidayService.getCurrentRegion();
      expect(region.country).toBe("DE");
    });

    it("should not clear cache when setting same region", () => {
      holidayService.setRegion("AT");
      const holidays1 = holidayService.getHolidaysForYear(2026);

      // Set same region again
      holidayService.setRegion("AT");
      const holidays2 = holidayService.getHolidaysForYear(2026);

      // Should be cached (same reference)
      expect(holidays1).toBe(holidays2);
    });
  });

  describe("getHolidaysForYear", () => {
    it("should return holidays for Austria 2026", () => {
      holidayService.setRegion("AT");
      const holidays = holidayService.getHolidaysForYear(2026);

      expect(holidays.length).toBeGreaterThan(10);

      // Check for known Austrian holidays
      const holidayNames = holidays.map((h) => h.name);
      expect(holidayNames.some((n) => n.includes("Neujahr"))).toBe(true);
      // In Austria it's "Christtag" for Christmas
      expect(
        holidayNames.some((n) => n.includes("Christtag") || n.includes("Christmas"))
      ).toBe(true);
    });

    it("should return holidays for Germany 2026", () => {
      holidayService.setRegion("DE");
      const holidays = holidayService.getHolidaysForYear(2026);

      expect(holidays.length).toBeGreaterThan(8);

      // Check for known German holidays
      const holidayNames = holidays.map((h) => h.name);
      expect(holidayNames.some((n) => n.includes("Neujahr"))).toBe(true);
    });

    it("should return holidays for US 2026", () => {
      holidayService.setRegion("US");
      const holidays = holidayService.getHolidaysForYear(2026);

      expect(holidays.length).toBeGreaterThan(5);

      // Check for known US holidays
      const holidayNames = holidays.map((h) => h.name);
      expect(
        holidayNames.some(
          (n) => n.includes("Independence") || n.includes("July")
        )
      ).toBe(true);
    });

    it("should only include public and bank holidays", () => {
      holidayService.setRegion("AT");
      const holidays = holidayService.getHolidaysForYear(2026);

      holidays.forEach((h) => {
        expect(["public", "bank"]).toContain(h.type);
      });
    });

    it("should return empty array when no region is set", () => {
      // Clear the current region by setting to empty
      (holidayService as unknown as { currentCountry: string }).currentCountry = "";
      holidayService.clearCache();

      const holidays = holidayService.getHolidaysForYear(2026);
      expect(holidays).toEqual([]);
    });

    it("should cache results for same year", () => {
      holidayService.setRegion("AT");
      const holidays1 = holidayService.getHolidaysForYear(2026);
      const holidays2 = holidayService.getHolidaysForYear(2026);

      // Should be same reference (cached)
      expect(holidays1).toBe(holidays2);
    });
  });

  describe("isHoliday", () => {
    beforeEach(() => {
      holidayService.setRegion("AT");
    });

    it("should detect Christmas as a holiday in Austria", () => {
      const christmas = new Date(2026, 11, 25); // Dec 25, 2026
      const result = holidayService.isHoliday(christmas);

      expect(result).not.toBeNull();
      // In Austria it's called "Christtag"
      expect(result?.name).toContain("Christtag");
    });

    it("should detect New Year as a holiday", () => {
      const newYear = new Date(2026, 0, 1); // Jan 1, 2026
      const result = holidayService.isHoliday(newYear);

      expect(result).not.toBeNull();
      expect(result?.name).toContain("Neujahr");
    });

    it("should return null for non-holidays", () => {
      const normalDay = new Date(2026, 6, 15); // July 15, 2026 (Wednesday)
      const result = holidayService.isHoliday(normalDay);

      expect(result).toBeNull();
    });

    it("should handle date comparison ignoring time", () => {
      const christmasMorning = new Date(2026, 11, 25, 9, 30, 0);
      const christmasEvening = new Date(2026, 11, 25, 20, 0, 0);

      const result1 = holidayService.isHoliday(christmasMorning);
      const result2 = holidayService.isHoliday(christmasEvening);

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1?.name).toBe(result2?.name);
    });
  });

  describe("isHolidayString", () => {
    beforeEach(() => {
      holidayService.setRegion("AT");
    });

    it("should detect holiday from date string", () => {
      const result = holidayService.isHolidayString("2026-12-25");
      expect(result).not.toBeNull();
    });

    it("should return null for non-holiday string", () => {
      const result = holidayService.isHolidayString("2026-06-15");
      expect(result).toBeNull();
    });
  });

  describe("getHolidaysInRange", () => {
    beforeEach(() => {
      holidayService.setRegion("AT");
    });

    it("should return holidays within a date range", () => {
      const start = new Date(2026, 11, 20); // Dec 20
      const end = new Date(2026, 11, 31); // Dec 31

      const holidays = holidayService.getHolidaysInRange(start, end);

      expect(holidays.length).toBeGreaterThan(0);
      // Should include Christmas (Dec 25) and St. Stephen's Day (Dec 26)
      expect(holidays.some((h) => h.date.getDate() === 25)).toBe(true);
      expect(holidays.some((h) => h.date.getDate() === 26)).toBe(true);
    });

    it("should handle range spanning multiple years", () => {
      const start = new Date(2025, 11, 25); // Dec 25, 2025
      const end = new Date(2026, 0, 2); // Jan 2, 2026

      const holidays = holidayService.getHolidaysInRange(start, end);

      // Should include holidays from both years
      expect(holidays.some((h) => h.date.getFullYear() === 2025)).toBe(true);
      expect(holidays.some((h) => h.date.getFullYear() === 2026)).toBe(true);
    });

    it("should return empty array for range with no holidays", () => {
      const start = new Date(2026, 6, 1); // July 1
      const end = new Date(2026, 6, 5); // July 5

      const holidays = holidayService.getHolidaysInRange(start, end);

      // Austria has no public holidays in early July
      expect(holidays.length).toBe(0);
    });
  });

  describe("getAvailableCountries", () => {
    it("should return a list of countries", () => {
      const countries = holidayService.getAvailableCountries();

      expect(countries.length).toBeGreaterThan(50);
      expect(countries.some((c) => c.code === "AT")).toBe(true);
      expect(countries.some((c) => c.code === "DE")).toBe(true);
      expect(countries.some((c) => c.code === "US")).toBe(true);
    });

    it("should have name and code for each country", () => {
      const countries = holidayService.getAvailableCountries();

      countries.forEach((c) => {
        expect(c.code).toBeDefined();
        expect(c.code.length).toBe(2);
        expect(c.name).toBeDefined();
        expect(c.name.length).toBeGreaterThan(0);
      });
    });

    it("should return sorted list", () => {
      const countries = holidayService.getAvailableCountries();

      for (let i = 1; i < countries.length; i++) {
        expect(
          countries[i - 1].name.localeCompare(countries[i].name)
        ).toBeLessThanOrEqual(0);
      }
    });
  });

  describe("getAvailableStates", () => {
    it("should return states for Germany", () => {
      const states = holidayService.getAvailableStates("DE");

      expect(states.length).toBeGreaterThan(10);
      expect(states.some((s) => s.code === "BY")).toBe(true); // Bavaria
      expect(states.some((s) => s.code === "NW")).toBe(true); // North Rhine-Westphalia
    });

    it("should return states for US", () => {
      const states = holidayService.getAvailableStates("US");

      expect(states.length).toBeGreaterThan(40);
      expect(states.some((s) => s.code === "CA")).toBe(true); // California
      expect(states.some((s) => s.code === "NY")).toBe(true); // New York
    });

    it("should return empty array for country without states", () => {
      const states = holidayService.getAvailableStates("XX");
      expect(states).toEqual([]);
    });
  });

  describe("getPopularCountries", () => {
    it("should return a list of popular countries", () => {
      const popular = holidayService.getPopularCountries();

      expect(popular.length).toBe(10);
      expect(popular).toContain("DE");
      expect(popular).toContain("AT");
      expect(popular).toContain("CH");
      expect(popular).toContain("US");
      expect(popular).toContain("GB");
    });
  });

  describe("clearCache", () => {
    it("should clear cached holiday data", () => {
      holidayService.setRegion("AT");
      const holidays1 = holidayService.getHolidaysForYear(2026);

      holidayService.clearCache();
      const holidays2 = holidayService.getHolidaysForYear(2026);

      // Should be different references after cache clear
      expect(holidays1).not.toBe(holidays2);
      // But same content
      expect(holidays1.length).toBe(holidays2.length);
    });
  });
});

describe("detectLocaleHolidayRegion", () => {
  const originalLanguage = navigator.language;

  afterEach(() => {
    // Restore original language
    Object.defineProperty(navigator, "language", {
      value: originalLanguage,
      writable: true,
      configurable: true,
    });
  });

  it("should extract region from locale with region", () => {
    Object.defineProperty(navigator, "language", {
      value: "de-AT",
      writable: true,
      configurable: true,
    });

    expect(detectLocaleHolidayRegion()).toBe("AT");
  });

  it("should extract region from en-US", () => {
    Object.defineProperty(navigator, "language", {
      value: "en-US",
      writable: true,
      configurable: true,
    });

    expect(detectLocaleHolidayRegion()).toBe("US");
  });

  it("should map language to country when no region", () => {
    Object.defineProperty(navigator, "language", {
      value: "de",
      writable: true,
      configurable: true,
    });

    expect(detectLocaleHolidayRegion()).toBe("DE");
  });

  it("should default to US for unknown language", () => {
    Object.defineProperty(navigator, "language", {
      value: "xx",
      writable: true,
      configurable: true,
    });

    expect(detectLocaleHolidayRegion()).toBe("US");
  });
});

