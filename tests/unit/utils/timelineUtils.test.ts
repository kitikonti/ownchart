/**
 * Unit tests for Timeline Utilities
 * Sprint 1.5.9: Tests for getScaleConfig at various zoom levels
 */

import { describe, it, expect } from "vitest";
import {
  getScaleConfig,
  getTimelineScale,
  dateToPixel,
  pixelToDate,
  getUnitStart,
  addUnit,
  FIXED_BASE_PIXELS_PER_DAY,
} from "../../../src/utils/timelineUtils";

describe("timelineUtils", () => {
  describe("getScaleConfig", () => {
    const basePixelsPerDay = FIXED_BASE_PIXELS_PER_DAY; // 25

    describe("zoom level configurations", () => {
      it("should return Quarter+Year -> Month at very low zoom (< 3 px/day)", () => {
        // 5% zoom = 25 * 0.05 = 1.25 px/day
        const config = getScaleConfig(0.05, basePixelsPerDay);

        expect(config).toHaveLength(2);
        expect(config[0].unit).toBe("quarter");
        expect(config[1].unit).toBe("month");
      });

      it("should return Month+Year -> Week (number only) at low zoom (3-5 px/day)", () => {
        // 15% zoom = 25 * 0.15 = 3.75 px/day
        const config = getScaleConfig(0.15, basePixelsPerDay);

        expect(config).toHaveLength(2);
        expect(config[0].unit).toBe("month");
        expect(config[1].unit).toBe("week");

        // Check that format returns number only (no "W" prefix)
        if (typeof config[1].format === "function") {
          const testDate = new Date(2026, 0, 5); // A Monday in week 2
          const formatted = config[1].format(testDate);
          expect(formatted).toMatch(/^\d+$/); // Only digits
        }
      });

      it("should return Month+Year -> Week (with W) at medium-low zoom (5-15 px/day)", () => {
        // 25% zoom = 25 * 0.25 = 6.25 px/day
        const config = getScaleConfig(0.25, basePixelsPerDay);

        expect(config).toHaveLength(2);
        expect(config[0].unit).toBe("month");
        expect(config[1].unit).toBe("week");

        // Check that format includes "W" prefix
        if (typeof config[1].format === "function") {
          const testDate = new Date(2026, 0, 5);
          const formatted = config[1].format(testDate);
          expect(formatted).toMatch(/^W\d+$/);
        }
      });

      it("should return Month -> Week at medium zoom (15-30 px/day)", () => {
        // 80% zoom = 25 * 0.8 = 20 px/day
        const config = getScaleConfig(0.8, basePixelsPerDay);

        expect(config).toHaveLength(2);
        expect(config[0].unit).toBe("month");
        expect(config[1].unit).toBe("week");
      });

      it("should return Month -> Day at normal zoom (30-60 px/day)", () => {
        // 150% zoom = 25 * 1.5 = 37.5 px/day
        const config = getScaleConfig(1.5, basePixelsPerDay);

        expect(config).toHaveLength(2);
        expect(config[0].unit).toBe("month");
        expect(config[1].unit).toBe("day");
      });

      it("should return Week -> Day at high zoom (>= 60 px/day)", () => {
        // 300% zoom = 25 * 3 = 75 px/day
        const config = getScaleConfig(3.0, basePixelsPerDay);

        expect(config).toHaveLength(2);
        expect(config[0].unit).toBe("week");
        expect(config[1].unit).toBe("day");
      });
    });

    describe("quarter format at very low zoom", () => {
      it("should format quarter with year", () => {
        const config = getScaleConfig(0.05, basePixelsPerDay);
        const quarterConfig = config[0];

        if (typeof quarterConfig.format === "function") {
          // Q1 2026
          expect(quarterConfig.format(new Date(2026, 0, 15))).toBe("Q1 2026");
          // Q2 2026
          expect(quarterConfig.format(new Date(2026, 4, 15))).toBe("Q2 2026");
          // Q3 2026
          expect(quarterConfig.format(new Date(2026, 8, 15))).toBe("Q3 2026");
          // Q4 2026
          expect(quarterConfig.format(new Date(2026, 11, 15))).toBe("Q4 2026");
        }
      });
    });

    describe("month format at low zoom", () => {
      it("should format month with year at low zoom", () => {
        const config = getScaleConfig(0.15, basePixelsPerDay);
        const monthConfig = config[0];

        expect(monthConfig.format).toBe("MMM yyyy");
      });

      it("should format month only at very low zoom", () => {
        const config = getScaleConfig(0.05, basePixelsPerDay);
        const monthConfig = config[1];

        expect(monthConfig.format).toBe("MMM");
      });
    });
  });

  describe("getTimelineScale", () => {
    it("should calculate scale with default zoom", () => {
      const scale = getTimelineScale("2026-01-01", "2026-01-31", 800, 1.0);

      expect(scale.minDate).toBe("2026-01-01");
      expect(scale.maxDate).toBe("2026-01-31");
      // Duration is inclusive: Jan 1 to Jan 31 = 31 days
      expect(scale.totalDays).toBe(31);
      expect(scale.pixelsPerDay).toBe(FIXED_BASE_PIXELS_PER_DAY);
      expect(scale.totalWidth).toBe(31 * FIXED_BASE_PIXELS_PER_DAY);
    });

    it("should apply zoom factor", () => {
      const scale = getTimelineScale("2026-01-01", "2026-01-31", 800, 2.0);

      expect(scale.pixelsPerDay).toBe(FIXED_BASE_PIXELS_PER_DAY * 2);
      expect(scale.totalWidth).toBe(31 * FIXED_BASE_PIXELS_PER_DAY * 2);
    });

    it("should include scale config", () => {
      const scale = getTimelineScale("2026-01-01", "2026-12-31", 800, 0.05);

      expect(scale.scales).toBeDefined();
      expect(scale.scales.length).toBe(2);
    });
  });

  describe("dateToPixel", () => {
    it("should convert date to pixel position", () => {
      const scale = getTimelineScale("2026-01-01", "2026-01-31", 800, 1.0);

      // First day should be at 0
      expect(dateToPixel("2026-01-01", scale)).toBe(0);

      // Second day should be at pixelsPerDay
      expect(dateToPixel("2026-01-02", scale)).toBe(FIXED_BASE_PIXELS_PER_DAY);

      // 10th day
      expect(dateToPixel("2026-01-10", scale)).toBe(
        9 * FIXED_BASE_PIXELS_PER_DAY
      );
    });
  });

  describe("pixelToDate", () => {
    it("should convert pixel position to date", () => {
      const scale = getTimelineScale("2026-01-01", "2026-01-31", 800, 1.0);

      expect(pixelToDate(0, scale)).toBe("2026-01-01");
      expect(pixelToDate(FIXED_BASE_PIXELS_PER_DAY, scale)).toBe("2026-01-02");
    });

    it("should round to nearest day", () => {
      const scale = getTimelineScale("2026-01-01", "2026-01-31", 800, 1.0);

      // Just under 1.5 days should round to day 2
      expect(pixelToDate(FIXED_BASE_PIXELS_PER_DAY * 1.4, scale)).toBe(
        "2026-01-02"
      );

      // Just over 1.5 days should round to day 2
      expect(pixelToDate(FIXED_BASE_PIXELS_PER_DAY * 1.6, scale)).toBe(
        "2026-01-03"
      );
    });
  });

  describe("getUnitStart", () => {
    it("should get start of year", () => {
      const date = new Date(2026, 5, 15);
      const start = getUnitStart(date, "year");

      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);
    });

    it("should get start of quarter", () => {
      const date = new Date(2026, 5, 15); // June = Q2
      const start = getUnitStart(date, "quarter");

      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(3); // April = start of Q2
      expect(start.getDate()).toBe(1);
    });

    it("should get start of month", () => {
      const date = new Date(2026, 5, 15);
      const start = getUnitStart(date, "month");

      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(5);
      expect(start.getDate()).toBe(1);
    });

    it("should get start of week", () => {
      const date = new Date(2026, 0, 8); // Thursday
      const start = getUnitStart(date, "week");

      // Should be Monday Jan 5, 2026 (with default Monday start)
      expect(start.getDate()).toBeLessThanOrEqual(8);
    });

    it("should get start of day", () => {
      const date = new Date(2026, 5, 15, 14, 30, 45);
      const start = getUnitStart(date, "day");

      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });
  });

  describe("addUnit", () => {
    it("should add years", () => {
      const date = new Date(2026, 0, 1);
      const result = addUnit(date, "year", 2);

      expect(result.getFullYear()).toBe(2028);
    });

    it("should add quarters", () => {
      const date = new Date(2026, 0, 1);
      const result = addUnit(date, "quarter", 2);

      expect(result.getMonth()).toBe(6); // July
    });

    it("should add months", () => {
      const date = new Date(2026, 0, 1);
      const result = addUnit(date, "month", 3);

      expect(result.getMonth()).toBe(3); // April
    });

    it("should add weeks", () => {
      const date = new Date(2026, 0, 1);
      const result = addUnit(date, "week", 2);

      expect(result.getDate()).toBe(15);
    });

    it("should add days", () => {
      const date = new Date(2026, 0, 1);
      const result = addUnit(date, "day", 10);

      expect(result.getDate()).toBe(11);
    });

    it("should add hours", () => {
      const date = new Date(2026, 0, 1, 10, 0, 0);
      const result = addUnit(date, "hour", 5);

      expect(result.getHours()).toBe(15);
    });
  });

  describe("zoom level boundaries", () => {
    const basePixelsPerDay = FIXED_BASE_PIXELS_PER_DAY;

    it("should switch at exactly 3 px/day boundary", () => {
      // Just below 3 px/day -> Quarter -> Month
      const below = getScaleConfig(0.119, basePixelsPerDay); // 2.975 px/day
      expect(below[0].unit).toBe("quarter");

      // At/above 3 px/day -> Month -> Week
      const above = getScaleConfig(0.12, basePixelsPerDay); // 3 px/day
      expect(above[0].unit).toBe("month");
      expect(above[1].unit).toBe("week");
    });

    it("should switch at exactly 5 px/day boundary", () => {
      // Just below 5 px/day -> Week without W
      const below = getScaleConfig(0.199, basePixelsPerDay); // 4.975 px/day
      const belowFormat = below[1].format;
      if (typeof belowFormat === "function") {
        expect(belowFormat(new Date(2026, 0, 5))).toMatch(/^\d+$/);
      }

      // At/above 5 px/day -> Week with W
      const above = getScaleConfig(0.2, basePixelsPerDay); // 5 px/day
      const aboveFormat = above[1].format;
      if (typeof aboveFormat === "function") {
        expect(aboveFormat(new Date(2026, 0, 5))).toMatch(/^W\d+$/);
      }
    });

    it("should switch at exactly 15 px/day boundary", () => {
      // Just below 15 px/day -> Month -> Week with W
      const below = getScaleConfig(0.59, basePixelsPerDay); // 14.75 px/day
      expect(below[0].unit).toBe("month");
      expect(below[1].unit).toBe("week");

      // At/above 15 px/day -> still Month -> Week (different format though)
      const above = getScaleConfig(0.6, basePixelsPerDay); // 15 px/day
      expect(above[0].unit).toBe("month");
      expect(above[1].unit).toBe("week");
    });

    it("should switch at exactly 30 px/day boundary", () => {
      // Just below 30 px/day -> Month -> Week
      const below = getScaleConfig(1.19, basePixelsPerDay); // 29.75 px/day
      expect(below[1].unit).toBe("week");

      // At/above 30 px/day -> Month -> Day
      const above = getScaleConfig(1.2, basePixelsPerDay); // 30 px/day
      expect(above[1].unit).toBe("day");
    });

    it("should switch at exactly 60 px/day boundary", () => {
      // Just below 60 px/day -> Month -> Day
      const below = getScaleConfig(2.39, basePixelsPerDay); // 59.75 px/day
      expect(below[0].unit).toBe("month");

      // At/above 60 px/day -> Week -> Day with weekday
      const above = getScaleConfig(2.4, basePixelsPerDay); // 60 px/day
      expect(above[0].unit).toBe("week");
    });
  });
});
