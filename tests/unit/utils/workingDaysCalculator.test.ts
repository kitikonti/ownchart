/**
 * Unit tests for Working Days Calculator Utilities
 *
 * holidayService is mocked throughout so tests are deterministic and do not
 * depend on external holiday data or network access.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseISO } from "date-fns";

// vi.mock is hoisted by Vitest, so this mock is in effect for all imports below
vi.mock("../../../src/services/holidayService", () => ({
  holidayService: {
    setRegion: vi.fn(),
    isHolidayString: vi.fn().mockReturnValue(null), // no holidays by default
    getHolidaysInRange: vi.fn().mockReturnValue([]),
  },
}));

import {
  isWorkingDay,
  calculateWorkingDays,
  addWorkingDays,
  getHolidaysInRange,
  getWorkingDaysSummary,
} from "../../../src/utils/workingDaysCalculator";
import { holidayService } from "../../../src/services/holidayService";
import type { WorkingDaysConfig } from "../../../src/types/preferences.types";

// ─── Test fixtures ────────────────────────────────────────────────────────────

const NO_EXCLUSIONS: WorkingDaysConfig = {
  excludeSaturday: false,
  excludeSunday: false,
  excludeHolidays: false,
};

const EXCLUDE_WEEKENDS: WorkingDaysConfig = {
  excludeSaturday: true,
  excludeSunday: true,
  excludeHolidays: false,
};

const EXCLUDE_ALL: WorkingDaysConfig = {
  excludeSaturday: true,
  excludeSunday: true,
  excludeHolidays: true,
};

// Convenience typed references to the mocked functions
const mockIsHolidayString = holidayService.isHolidayString as ReturnType<
  typeof vi.fn
>;
const mockGetHolidaysInRange = holidayService.getHolidaysInRange as ReturnType<
  typeof vi.fn
>;
const mockSetRegion = holidayService.setRegion as ReturnType<typeof vi.fn>;

// Helper that creates a HolidayInfo-shaped object with a local-midnight Date,
// so format(h.date, "yyyy-MM-dd") always matches the YYYY-MM-DD string used
// as currentDate in the calculator's loops.
function makeHoliday(dateStr: string, name = "Test Holiday") {
  return {
    date: parseISO(dateStr), // local midnight — safe for format() comparison
    name,
    type: "public" as const,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("workingDaysCalculator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsHolidayString.mockReturnValue(null);
    mockGetHolidaysInRange.mockReturnValue([]);
  });

  // ── isWorkingDay ────────────────────────────────────────────────────────────

  describe("isWorkingDay", () => {
    // Reference week: Mon 2025-01-06 … Sun 2025-01-12

    it("should return true for a weekday with no exclusions", () => {
      expect(isWorkingDay("2025-01-06", NO_EXCLUSIONS)).toBe(true); // Monday
    });

    it("should return true for Saturday when excludeSaturday is false", () => {
      expect(isWorkingDay("2025-01-11", NO_EXCLUSIONS)).toBe(true);
    });

    it("should return true for Sunday when excludeSunday is false", () => {
      expect(isWorkingDay("2025-01-12", NO_EXCLUSIONS)).toBe(true);
    });

    it("should return false for Saturday when excludeSaturday is true", () => {
      expect(isWorkingDay("2025-01-11", EXCLUDE_WEEKENDS)).toBe(false);
    });

    it("should return false for Sunday when excludeSunday is true", () => {
      expect(isWorkingDay("2025-01-12", EXCLUDE_WEEKENDS)).toBe(false);
    });

    it("should exclude Saturday but not Sunday when only excludeSaturday is set", () => {
      const config: WorkingDaysConfig = {
        excludeSaturday: true,
        excludeSunday: false,
        excludeHolidays: false,
      };
      expect(isWorkingDay("2025-01-11", config)).toBe(false); // Saturday
      expect(isWorkingDay("2025-01-12", config)).toBe(true); // Sunday
    });

    it("should exclude Sunday but not Saturday when only excludeSunday is set", () => {
      const config: WorkingDaysConfig = {
        excludeSaturday: false,
        excludeSunday: true,
        excludeHolidays: false,
      };
      expect(isWorkingDay("2025-01-11", config)).toBe(true); // Saturday
      expect(isWorkingDay("2025-01-12", config)).toBe(false); // Sunday
    });

    it("should return false for a holiday when excludeHolidays is true", () => {
      mockIsHolidayString.mockReturnValue(
        makeHoliday("2025-01-01", "New Year's Day")
      );
      expect(isWorkingDay("2025-01-01", EXCLUDE_ALL, "AT")).toBe(false);
    });

    it("should return true for a non-holiday weekday with excludeHolidays enabled", () => {
      expect(isWorkingDay("2025-01-06", EXCLUDE_ALL, "AT")).toBe(true);
    });

    it("should not query holidayService when excludeHolidays is false", () => {
      isWorkingDay("2025-01-06", EXCLUDE_WEEKENDS, "AT");
      expect(holidayService.isHolidayString).not.toHaveBeenCalled();
    });

    it("should not query holidayService when no holidayRegion is provided", () => {
      isWorkingDay("2025-01-06", EXCLUDE_ALL);
      expect(holidayService.isHolidayString).not.toHaveBeenCalled();
    });

    it("should configure the holiday service when excludeHolidays is true and region is provided", () => {
      isWorkingDay("2025-01-06", EXCLUDE_ALL, "AT");
      expect(mockSetRegion).toHaveBeenCalledWith("AT");
    });
  });

  // ── calculateWorkingDays ────────────────────────────────────────────────────

  describe("calculateWorkingDays", () => {
    it("should return full duration when no exclusions are set (fast path)", () => {
      // Mon–Fri = 5 calendar days, all working
      expect(
        calculateWorkingDays("2025-01-06", "2025-01-10", NO_EXCLUSIONS)
      ).toBe(5);
    });

    it("should return 1 for the same start and end date (weekday, no exclusions)", () => {
      expect(
        calculateWorkingDays("2025-01-06", "2025-01-06", NO_EXCLUSIONS)
      ).toBe(1);
    });

    it("should return 0 when endDate is before startDate (slow path)", () => {
      expect(
        calculateWorkingDays("2025-01-10", "2025-01-06", EXCLUDE_WEEKENDS)
      ).toBe(0);
    });

    it("should return 0 when endDate is before startDate (fast path)", () => {
      // Ensures the guard fires before the fast-path calculateDuration call,
      // which would otherwise return a negative number.
      expect(
        calculateWorkingDays("2025-01-10", "2025-01-06", NO_EXCLUSIONS)
      ).toBe(0);
    });

    it("should exclude both weekend days from a full Mon–Sun week", () => {
      // 7 calendar days, 5 working
      expect(
        calculateWorkingDays("2025-01-06", "2025-01-12", EXCLUDE_WEEKENDS)
      ).toBe(5);
    });

    it("should exclude Saturday only", () => {
      const config: WorkingDaysConfig = {
        excludeSaturday: true,
        excludeSunday: false,
        excludeHolidays: false,
      };
      // Mon–Sun: 7 days minus 1 Saturday = 6
      expect(calculateWorkingDays("2025-01-06", "2025-01-12", config)).toBe(6);
    });

    it("should configure the holiday service with the correct region", () => {
      calculateWorkingDays("2025-01-06", "2025-01-10", EXCLUDE_ALL, "AT");
      expect(mockSetRegion).toHaveBeenCalledWith("AT");
    });

    it("should not call setRegion when excludeHolidays is false", () => {
      calculateWorkingDays("2025-01-06", "2025-01-10", EXCLUDE_WEEKENDS, "AT");
      expect(mockSetRegion).not.toHaveBeenCalled();
    });

    it("should subtract holiday days from the count", () => {
      // Wed Jan 8 is a holiday — Mon–Fri (5 days) minus 1 = 4
      mockIsHolidayString.mockImplementation((dateStr: string) =>
        dateStr === "2025-01-08" ? makeHoliday("2025-01-08") : null
      );
      expect(
        calculateWorkingDays("2025-01-06", "2025-01-10", EXCLUDE_ALL, "AT")
      ).toBe(4);
    });

    it("should span multiple weeks correctly", () => {
      // 2025-01-06 (Mon) to 2025-01-17 (Fri) = 2 full weeks = 10 working days
      expect(
        calculateWorkingDays("2025-01-06", "2025-01-17", EXCLUDE_WEEKENDS)
      ).toBe(10);
    });
  });

  // ── addWorkingDays ──────────────────────────────────────────────────────────

  describe("addWorkingDays", () => {
    it("should use simple date arithmetic when no exclusions are set (fast path)", () => {
      // 5 working days from Monday Jan 6, no exclusions → Jan 10 (Mon + 4 days)
      expect(addWorkingDays("2025-01-06", 5, NO_EXCLUSIONS)).toBe("2025-01-10");
    });

    it("should return startDate for days = 1 when startDate is a working day", () => {
      expect(addWorkingDays("2025-01-06", 1, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-06"
      );
    });

    it("should find the next working day for days = 1 when startDate is a weekend", () => {
      // Saturday Jan 11 → first working day = Monday Jan 13
      expect(addWorkingDays("2025-01-11", 1, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-13"
      );
    });

    it("should skip weekends when adding working days within a single week", () => {
      // Mon Jan 6, 5 working days → Fri Jan 10
      expect(addWorkingDays("2025-01-06", 5, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-10"
      );
    });

    it("should skip weekends across a week boundary", () => {
      // Thu Jan 9, 5 working days: Thu(1) Fri(2) | Mon(3) Tue(4) Wed(5) = Jan 15
      expect(addWorkingDays("2025-01-09", 5, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-15"
      );
    });

    it("should skip holidays when excludeHolidays is true", () => {
      // Mon Jan 6 to Fri Jan 10: Wed Jan 8 is a holiday.
      // days=5: Mon(1) Tue(2) [Wed skipped] Thu(3) Fri(4) Mon Jan 13(5)
      mockIsHolidayString.mockImplementation((dateStr: string) =>
        dateStr === "2025-01-08" ? makeHoliday("2025-01-08") : null
      );
      expect(addWorkingDays("2025-01-06", 5, EXCLUDE_ALL, "AT")).toBe(
        "2025-01-13"
      );
    });

    it("should configure the holiday service with the correct region", () => {
      addWorkingDays("2025-01-06", 3, EXCLUDE_ALL, "AT");
      expect(mockSetRegion).toHaveBeenCalledWith("AT");
    });

    it("should not call setRegion when excludeHolidays is false", () => {
      addWorkingDays("2025-01-06", 3, EXCLUDE_WEEKENDS, "AT");
      expect(mockSetRegion).not.toHaveBeenCalled();
    });

    it("should return startDate unchanged for days = 0 (no-op guard)", () => {
      // Both fast path and slow path must agree: non-positive days → startDate
      expect(addWorkingDays("2025-01-06", 0, NO_EXCLUSIONS)).toBe("2025-01-06");
      expect(addWorkingDays("2025-01-06", 0, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-06"
      );
    });

    it("should return startDate unchanged for negative days", () => {
      expect(addWorkingDays("2025-01-06", -1, NO_EXCLUSIONS)).toBe(
        "2025-01-06"
      );
      expect(addWorkingDays("2025-01-06", -5, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-06"
      );
    });
  });

  // ── getHolidaysInRange ──────────────────────────────────────────────────────

  describe("getHolidaysInRange", () => {
    it("should configure the region and delegate to holidayService", () => {
      const holidays = [makeHoliday("2025-01-01", "New Year's Day")];
      mockGetHolidaysInRange.mockReturnValue(holidays);

      const result = getHolidaysInRange("2025-01-01", "2025-01-31", "AT");

      expect(mockSetRegion).toHaveBeenCalledWith("AT");
      expect(result).toEqual(holidays);
    });

    it("should return an empty array when no holidays exist in the range", () => {
      const result = getHolidaysInRange("2025-06-01", "2025-06-30", "AT");
      expect(result).toEqual([]);
    });
  });

  // ── getWorkingDaysSummary ───────────────────────────────────────────────────

  describe("getWorkingDaysSummary", () => {
    // Reference: Mon 2025-01-06 … Sun 2025-01-12 (7 days, 5 weekdays, 2 weekend days)

    it("should report the correct total days", () => {
      const summary = getWorkingDaysSummary(
        "2025-01-06",
        "2025-01-12",
        NO_EXCLUSIONS
      );
      expect(summary.totalDays).toBe(7);
    });

    it("should count all days as working when no exclusions are set", () => {
      const summary = getWorkingDaysSummary(
        "2025-01-06",
        "2025-01-12",
        NO_EXCLUSIONS
      );
      expect(summary.workingDays).toBe(7);
      // weekendDays is always the calendar count regardless of config (informational)
      expect(summary.weekendDays).toBe(2);
    });

    it("should correctly split working days and weekend days", () => {
      const summary = getWorkingDaysSummary(
        "2025-01-06",
        "2025-01-12",
        EXCLUDE_WEEKENDS
      );
      expect(summary.totalDays).toBe(7);
      expect(summary.workingDays).toBe(5);
      expect(summary.weekendDays).toBe(2);
      expect(summary.holidayCount).toBe(0);
      expect(summary.holidays).toEqual([]);
    });

    it("should subtract holiday from working days and include it in holidays list", () => {
      // Wed Jan 8 is a holiday
      const holiday = makeHoliday("2025-01-08");
      mockGetHolidaysInRange.mockReturnValue([holiday]);

      const summary = getWorkingDaysSummary(
        "2025-01-06",
        "2025-01-12",
        EXCLUDE_ALL,
        "AT"
      );

      expect(summary.holidayCount).toBe(1);
      expect(summary.holidays).toEqual([holiday]);
      expect(summary.workingDays).toBe(4); // 5 weekdays minus 1 holiday
      expect(summary.weekendDays).toBe(2);
    });

    it("should not include holidays when excludeHolidays is false", () => {
      const summary = getWorkingDaysSummary(
        "2025-01-06",
        "2025-01-12",
        EXCLUDE_WEEKENDS,
        "AT"
      );
      expect(summary.holidays).toEqual([]);
      expect(summary.holidayCount).toBe(0);
      expect(mockSetRegion).not.toHaveBeenCalled();
    });

    it("should configure holidayService exactly once (not per day)", () => {
      getWorkingDaysSummary("2025-01-06", "2025-01-12", EXCLUDE_ALL, "AT");
      expect(mockSetRegion).toHaveBeenCalledTimes(1);
    });

    it("should return zeros for an empty range (endDate before startDate)", () => {
      const summary = getWorkingDaysSummary(
        "2025-01-10",
        "2025-01-06",
        EXCLUDE_WEEKENDS
      );
      // calculateDuration returns negative+1, while loop never executes
      expect(summary.workingDays).toBe(0);
      expect(summary.weekendDays).toBe(0);
    });

    it("should handle a single-day range that is a weekday", () => {
      const summary = getWorkingDaysSummary(
        "2025-01-06",
        "2025-01-06",
        EXCLUDE_WEEKENDS
      );
      expect(summary.totalDays).toBe(1);
      expect(summary.workingDays).toBe(1);
      expect(summary.weekendDays).toBe(0);
    });

    it("should handle a single-day range that is a weekend", () => {
      const summary = getWorkingDaysSummary(
        "2025-01-11",
        "2025-01-11",
        EXCLUDE_WEEKENDS
      );
      expect(summary.totalDays).toBe(1);
      expect(summary.workingDays).toBe(0);
      expect(summary.weekendDays).toBe(1);
    });
  });
});
