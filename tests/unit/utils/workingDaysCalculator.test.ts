/**
 * Unit tests for Working Days Calculator Utilities
 *
 * holidayService is mocked throughout so tests are deterministic and do not
 * depend on external holiday data or network access.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseISO } from "date-fns";

// vi.mock is hoisted by Vitest, so this mock is in effect for all imports below
vi.mock("@/services/holidayService", () => ({
  holidayService: {
    setRegion: vi.fn(),
    getHolidayForDateString: vi.fn().mockReturnValue(null), // no holidays by default
    getHolidaysInRange: vi.fn().mockReturnValue([]),
  },
}));

import {
  isWorkingDay,
  calculateWorkingDays,
  addWorkingDays,
  getHolidaysInRange,
  getWorkingDaysSummary,
  snapForwardToWorkingDay,
  subtractWorkingDays,
  WorkingDaysLoopError,
} from "@/utils/workingDaysCalculator";
import { holidayService, type HolidayInfo } from "@/services/holidayService";
import type { WorkingDaysConfig } from "@/types/preferences.types";

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
const mockGetHolidayForDateString =
  holidayService.getHolidayForDateString as ReturnType<typeof vi.fn>;
const mockGetHolidaysInRange = holidayService.getHolidaysInRange as ReturnType<
  typeof vi.fn
>;
const mockSetRegion = holidayService.setRegion as ReturnType<typeof vi.fn>;

// Helper that creates a HolidayInfo-shaped object with a local-midnight Date,
// so format(h.date, "yyyy-MM-dd") always matches the YYYY-MM-DD string used
// as currentDate in the calculator's loops.
function makeHoliday(dateStr: string, name = "Test Holiday"): HolidayInfo {
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
    mockGetHolidayForDateString.mockReturnValue(null);
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
      mockGetHolidayForDateString.mockReturnValue(
        makeHoliday("2025-01-01", "New Year's Day")
      );
      expect(isWorkingDay("2025-01-01", EXCLUDE_ALL, "AT")).toBe(false);
    });

    it("should return true for a non-holiday weekday with excludeHolidays enabled", () => {
      expect(isWorkingDay("2025-01-06", EXCLUDE_ALL, "AT")).toBe(true);
    });

    it("should not query holidayService when excludeHolidays is false", () => {
      isWorkingDay("2025-01-06", EXCLUDE_WEEKENDS, "AT");
      expect(holidayService.getHolidayForDateString).not.toHaveBeenCalled();
    });

    it("should not query holidayService when no holidayRegion is provided", () => {
      isWorkingDay("2025-01-06", EXCLUDE_ALL);
      expect(holidayService.getHolidayForDateString).not.toHaveBeenCalled();
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
      // Wed Jan 8 is a holiday — Mon–Fri (5 days) minus 1 = 4.
      // calculateWorkingDays uses fetchHolidaysForRange (getHolidaysInRange),
      // not getHolidayForDateString, so mock the service-level call.
      mockGetHolidaysInRange.mockReturnValue([makeHoliday("2025-01-08")]);
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

    it("should configure holidayService exactly once (not per day)", () => {
      calculateWorkingDays("2025-01-06", "2025-01-12", EXCLUDE_ALL, "AT");
      expect(mockSetRegion).toHaveBeenCalledTimes(1);
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
      mockGetHolidayForDateString.mockImplementation((dateStr: string) =>
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

    it("should return all-zero metrics when endDate is before startDate", () => {
      const summary = getWorkingDaysSummary(
        "2025-01-10",
        "2025-01-06",
        EXCLUDE_WEEKENDS
      );
      expect(summary.totalDays).toBe(0);
      expect(summary.workingDays).toBe(0);
      expect(summary.weekendDays).toBe(0);
      expect(summary.holidayCount).toBe(0);
      expect(summary.holidays).toEqual([]);
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

  // ── snapForwardToWorkingDay ────────────────────────────────────────────────

  describe("snapForwardToWorkingDay", () => {
    // Reference week: Mon 2025-01-06 … Sun 2025-01-12

    it("returns the input unchanged when already a working day", () => {
      expect(snapForwardToWorkingDay("2025-01-06", EXCLUDE_WEEKENDS)).toBe(
        "2025-01-06"
      );
    });

    it("snaps Saturday forward to Monday", () => {
      expect(snapForwardToWorkingDay("2025-01-11", EXCLUDE_WEEKENDS)).toBe(
        "2025-01-13"
      );
    });

    it("snaps Sunday forward to Monday", () => {
      expect(snapForwardToWorkingDay("2025-01-12", EXCLUDE_WEEKENDS)).toBe(
        "2025-01-13"
      );
    });

    it("skips a holiday that falls on a working day", () => {
      // Mon 2025-01-13 is a holiday → Tue 2025-01-14
      mockGetHolidayForDateString.mockImplementation((d: string) =>
        d === "2025-01-13" ? makeHoliday("2025-01-13") : null
      );
      expect(
        snapForwardToWorkingDay("2025-01-13", EXCLUDE_ALL, "US")
      ).toBe("2025-01-14");
    });

    it("chains across weekend + holiday: Sat → Mon-holiday → Tue", () => {
      mockGetHolidayForDateString.mockImplementation((d: string) =>
        d === "2025-01-13" ? makeHoliday("2025-01-13") : null
      );
      expect(
        snapForwardToWorkingDay("2025-01-11", EXCLUDE_ALL, "US")
      ).toBe("2025-01-14");
    });

    it("is a no-op fast path when no exclusions are configured", () => {
      expect(snapForwardToWorkingDay("2025-01-11", NO_EXCLUSIONS)).toBe(
        "2025-01-11"
      );
    });

    it("calls setRegion idempotently when holiday exclusion is on", () => {
      mockSetRegion.mockClear();
      snapForwardToWorkingDay("2025-01-06", EXCLUDE_ALL, "DE");
      expect(mockSetRegion).toHaveBeenCalledWith("DE");
    });

    it("throws WorkingDaysLoopError on a degenerate every-day-excluded config", () => {
      // Force every day to be a holiday → snap can never resolve.
      mockGetHolidayForDateString.mockReturnValue(makeHoliday("forever"));
      expect(() =>
        snapForwardToWorkingDay("2025-01-06", EXCLUDE_ALL, "XX")
      ).toThrow(WorkingDaysLoopError);
    });
  });

  // ── subtractWorkingDays ───────────────────────────────────────────────────

  describe("subtractWorkingDays", () => {
    // Reference week: Mon 2025-01-06 … Sun 2025-01-12

    it("returns end date unchanged when days <= 0", () => {
      expect(subtractWorkingDays("2025-01-10", 0, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-10"
      );
      expect(subtractWorkingDays("2025-01-10", -3, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-10"
      );
    });

    it("counts the end date as day 1 when it is a working day", () => {
      // Fri Jan 10, subtract 1 → Fri itself is day 1 → returns Fri.
      expect(subtractWorkingDays("2025-01-10", 1, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-10"
      );
    });

    it("subtracts across the weekend", () => {
      // Mon Jan 13, subtract 2 → Mon is day 1, Fri 10 is day 2.
      expect(subtractWorkingDays("2025-01-13", 2, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-10"
      );
    });

    it("subtracts a full working week", () => {
      // Fri Jan 10, subtract 5 → Mon Jan 06.
      expect(subtractWorkingDays("2025-01-10", 5, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-06"
      );
    });

    it("end date on a weekend skips backward to a working day", () => {
      // Sat Jan 11, subtract 1 → Sat not a working day, so step back to Fri.
      expect(subtractWorkingDays("2025-01-11", 1, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-10"
      );
    });

    it("fast path returns simple calendar arithmetic with no exclusions", () => {
      // No exclusions → result is endDate − (days − 1)
      expect(subtractWorkingDays("2025-01-10", 3, NO_EXCLUSIONS)).toBe(
        "2025-01-08"
      );
    });

    it("is the symmetric inverse of addWorkingDays for working anchors", () => {
      // Mon Jan 06 + 5 WD = Fri Jan 10. Fri Jan 10 − 5 WD = Mon Jan 06.
      const forward = addWorkingDays("2025-01-06", 5, EXCLUDE_WEEKENDS);
      expect(forward).toBe("2025-01-10");
      expect(subtractWorkingDays(forward, 5, EXCLUDE_WEEKENDS)).toBe(
        "2025-01-06"
      );
    });

    it("skips holidays going backward", () => {
      // Make Wed Jan 08 a holiday → Fri Jan 10 − 3 WD = Fri (1), Thu (2), Tue (3).
      mockGetHolidayForDateString.mockImplementation((d: string) =>
        d === "2025-01-08" ? makeHoliday("2025-01-08") : null
      );
      expect(subtractWorkingDays("2025-01-10", 3, EXCLUDE_ALL, "US")).toBe(
        "2025-01-07"
      );
    });

    it("throws WorkingDaysLoopError on degenerate every-day-excluded config", () => {
      mockGetHolidayForDateString.mockReturnValue(makeHoliday("forever"));
      expect(() =>
        subtractWorkingDays("2025-01-10", 5, EXCLUDE_ALL, "XX")
      ).toThrow(WorkingDaysLoopError);
    });
  });

  // ── addWorkingDays loop guard ──────────────────────────────────────────────

  // ── DST boundary behaviour (#82 stage 6 follow-up) ────────────────────────
  //
  // The YYYY-MM-DD string contract requires that addWorkingDays /
  // subtractWorkingDays / calculateWorkingDays operate on calendar dates,
  // never on Date *instants*. date-fns parseISO("YYYY-MM-DD") returns local
  // midnight, and date-fns addDays advances by 24h * n. The danger is that
  // when the local DST transition lands inside one of those 24h windows,
  // the resulting Date may skew by ±1 hour, and format(date, "yyyy-MM-dd")
  // could produce the wrong calendar day.
  //
  // These tests construct ranges that span DST transitions in a non-UTC
  // timezone (US: spring-forward Mar 9 2025, fall-back Nov 2 2025) and
  // verify the YYYY-MM-DD outputs are correct. The tests pass in any
  // timezone Node defaults to because parseISO/format are local-anchored —
  // what they guard against is a future refactor that reaches for
  // Date.UTC() or new Date("YYYY-MM-DDTHH:MM:SSZ"), which WOULD drift.

  describe("DST boundary correctness", () => {
    it("addWorkingDays crosses spring-forward (Mar 9 2025) without drift", () => {
      // Mon 2025-03-03 + 10 working days (Sat+Sun excluded) = Fri 2025-03-14
      // The range crosses the spring-forward boundary on Sun Mar 9.
      expect(addWorkingDays("2025-03-03", 10, EXCLUDE_WEEKENDS)).toBe(
        "2025-03-14"
      );
    });

    it("addWorkingDays crosses fall-back (Nov 2 2025) without drift", () => {
      // Mon 2025-10-27 + 10 working days = Fri 2025-11-07
      // The range crosses the fall-back boundary on Sun Nov 2.
      expect(addWorkingDays("2025-10-27", 10, EXCLUDE_WEEKENDS)).toBe(
        "2025-11-07"
      );
    });

    it("calculateWorkingDays counts correctly across spring-forward", () => {
      // Mon Mar 3 .. Fri Mar 14 inclusive = 10 working days
      expect(
        calculateWorkingDays("2025-03-03", "2025-03-14", EXCLUDE_WEEKENDS)
      ).toBe(10);
    });

    it("calculateWorkingDays counts correctly across fall-back", () => {
      expect(
        calculateWorkingDays("2025-10-27", "2025-11-07", EXCLUDE_WEEKENDS)
      ).toBe(10);
    });

    it("subtractWorkingDays crosses spring-forward going backward", () => {
      // Fri Mar 14 - 10 working days = Mon Mar 3
      expect(subtractWorkingDays("2025-03-14", 10, EXCLUDE_WEEKENDS)).toBe(
        "2025-03-03"
      );
    });
  });

  describe("addWorkingDays loop guard", () => {
    it("throws WorkingDaysLoopError when every day is excluded", () => {
      mockGetHolidayForDateString.mockReturnValue(makeHoliday("forever"));
      expect(() =>
        addWorkingDays("2025-01-06", 5, EXCLUDE_ALL, "XX")
      ).toThrow(WorkingDaysLoopError);
    });

    it("error has the correct name for instanceof checks at boundaries", () => {
      mockGetHolidayForDateString.mockReturnValue(makeHoliday("forever"));
      try {
        addWorkingDays("2025-01-06", 5, EXCLUDE_ALL, "XX");
      } catch (e) {
        expect(e).toBeInstanceOf(WorkingDaysLoopError);
        expect((e as Error).name).toBe("WorkingDaysLoopError");
      }
    });
  });
});
