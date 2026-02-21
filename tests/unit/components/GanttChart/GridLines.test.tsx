/**
 * Unit tests for GridLines component
 * Focus: getVerticalLineStroke helper, adaptive grid density,
 * weekend/holiday column filtering, vertical line alignment,
 * gridHeight used correctly in SVG elements
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import {
  GridLines,
  getVerticalLineStroke,
} from "../../../../src/components/GanttChart/GridLines";
import { GRID } from "../../../../src/styles/design-tokens";
import type { TimelineScale } from "../../../../src/utils/timelineUtils";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../../../../src/store/slices/userPreferencesSlice", () => ({
  useFirstDayOfWeek: vi.fn(() => "monday"),
}));

vi.mock("../../../../src/services/holidayService", () => ({
  holidayService: {
    setRegion: vi.fn(),
    isHolidayString: vi.fn((date: string) => {
      // Simulate Jan 1 as a holiday
      if (date === "2025-01-01") return { name: "New Year" };
      return null;
    }),
  },
}));

import { holidayService } from "../../../../src/services/holidayService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createScale(overrides: Partial<TimelineScale> = {}): TimelineScale {
  return {
    minDate: "2025-01-01",
    maxDate: "2025-01-31",
    pixelsPerDay: 25,
    totalWidth: 775, // 31 days * 25 px
    totalDays: 31,
    zoom: 1,
    scales: [],
    ...overrides,
  };
}

/** Render GridLines inside an SVG (required for valid DOM nesting) */
function renderGridLines(
  props: Partial<Parameters<typeof GridLines>[0]> = {},
): ReturnType<typeof render> {
  const defaultProps = {
    scale: createScale(),
    taskCount: 5,
  };
  return render(
    <svg>
      <GridLines {...defaultProps} {...props} />
    </svg>,
  );
}

// ---------------------------------------------------------------------------
// getVerticalLineStroke
// ---------------------------------------------------------------------------

describe("getVerticalLineStroke", () => {
  it("returns daily color for weekday at daily zoom", () => {
    expect(getVerticalLineStroke("daily", false)).toBe(GRID.lineDaily);
  });

  it("returns daily-weekend color for weekend at daily zoom", () => {
    expect(getVerticalLineStroke("daily", true)).toBe(GRID.lineDailyWeekend);
  });

  it("returns weekly/monthly color regardless of weekend flag", () => {
    expect(getVerticalLineStroke("weekly", false)).toBe(GRID.lineWeeklyMonthly);
    expect(getVerticalLineStroke("weekly", true)).toBe(GRID.lineWeeklyMonthly);
    expect(getVerticalLineStroke("monthly", false)).toBe(
      GRID.lineWeeklyMonthly,
    );
    expect(getVerticalLineStroke("monthly", true)).toBe(
      GRID.lineWeeklyMonthly,
    );
  });
});

// ---------------------------------------------------------------------------
// GridLines component
// ---------------------------------------------------------------------------

describe("GridLines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Adaptive grid density
  // -------------------------------------------------------------------------

  describe("adaptive grid density", () => {
    it("renders daily lines at high pixelsPerDay (>= 10)", () => {
      const { container } = renderGridLines({
        scale: createScale({ pixelsPerDay: 25 }),
      });
      const lines = container.querySelectorAll(".daily-line");
      expect(lines.length).toBeGreaterThan(0);
      expect(container.querySelectorAll(".weekly-line")).toHaveLength(0);
      expect(container.querySelectorAll(".monthly-line")).toHaveLength(0);
    });

    it("renders weekly lines at medium pixelsPerDay (3–9)", () => {
      const { container } = renderGridLines({
        scale: createScale({ pixelsPerDay: 5, totalWidth: 155 }),
      });
      const lines = container.querySelectorAll(".weekly-line");
      expect(lines.length).toBeGreaterThan(0);
      expect(container.querySelectorAll(".daily-line")).toHaveLength(0);
      expect(container.querySelectorAll(".monthly-line")).toHaveLength(0);
    });

    it("renders monthly lines at low pixelsPerDay (< 3)", () => {
      const { container } = renderGridLines({
        scale: createScale({
          pixelsPerDay: 2,
          totalWidth: 730,
          totalDays: 365,
          maxDate: "2025-12-31",
        }),
      });
      const lines = container.querySelectorAll(".monthly-line");
      expect(lines.length).toBeGreaterThan(0);
      expect(container.querySelectorAll(".daily-line")).toHaveLength(0);
      expect(container.querySelectorAll(".weekly-line")).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Weekend columns
  // -------------------------------------------------------------------------

  describe("weekend columns", () => {
    it("renders weekend columns when showWeekends is true (default)", () => {
      const { container } = renderGridLines();
      const weekendRects = container.querySelectorAll(".weekend-column");
      expect(weekendRects.length).toBeGreaterThan(0);
    });

    it("renders no weekend columns when showWeekends is false", () => {
      const { container } = renderGridLines({ showWeekends: false });
      const weekendRects = container.querySelectorAll(".weekend-column");
      expect(weekendRects).toHaveLength(0);
    });

    it("uses GRID design tokens for weekend styling", () => {
      const { container } = renderGridLines();
      const rect = container.querySelector(".weekend-column");
      expect(rect).not.toBeNull();
      expect(rect!.getAttribute("fill")).toBe(GRID.weekendBg);
      expect(rect!.getAttribute("opacity")).toBe(String(GRID.weekendOpacity));
    });
  });

  // -------------------------------------------------------------------------
  // Holiday columns
  // -------------------------------------------------------------------------

  describe("holiday columns", () => {
    it("renders no holiday columns when showHolidays is false (default)", () => {
      const { container } = renderGridLines();
      const holidayRects = container.querySelectorAll(".holiday-column");
      expect(holidayRects).toHaveLength(0);
    });

    it("renders no holiday columns when holidayRegion is empty", () => {
      const { container } = renderGridLines({
        showHolidays: true,
        holidayRegion: "",
      });
      const holidayRects = container.querySelectorAll(".holiday-column");
      expect(holidayRects).toHaveLength(0);
    });

    it("renders holiday columns with tooltip when enabled", () => {
      const { container } = renderGridLines({
        showHolidays: true,
        holidayRegion: "DE",
      });
      const holidayRects = container.querySelectorAll(".holiday-column");
      expect(holidayRects.length).toBeGreaterThan(0);

      // Check tooltip (<title> element)
      const title = holidayRects[0].querySelector("title");
      expect(title).not.toBeNull();
      expect(title!.textContent).toBe("New Year");
    });

    it("calls holidayService.setRegion when holidays are enabled", () => {
      renderGridLines({
        showHolidays: true,
        holidayRegion: "DE",
      });
      expect(holidayService.setRegion).toHaveBeenCalledWith("DE");
    });

    it("does not call holidayService.setRegion when holidays are disabled", () => {
      renderGridLines({
        showHolidays: false,
        holidayRegion: "DE",
      });
      expect(holidayService.setRegion).not.toHaveBeenCalled();
    });

    it("uses GRID design tokens for holiday styling", () => {
      const { container } = renderGridLines({
        showHolidays: true,
        holidayRegion: "DE",
      });
      const rect = container.querySelector(".holiday-column");
      expect(rect).not.toBeNull();
      expect(rect!.getAttribute("fill")).toBe(GRID.holidayBg);
      expect(rect!.getAttribute("opacity")).toBe(String(GRID.holidayOpacity));
    });
  });

  // -------------------------------------------------------------------------
  // Horizontal lines
  // -------------------------------------------------------------------------

  describe("horizontal lines", () => {
    /** Horizontal lines have y1 === y2 (same vertical position, spans width) */
    function selectHorizontalLines(container: HTMLElement): Element[] {
      const allLines = container.querySelectorAll("line");
      return Array.from(allLines).filter(
        (l) => l.getAttribute("y1") === l.getAttribute("y2"),
      );
    }

    it("renders taskCount + 1 horizontal lines", () => {
      const { container } = renderGridLines({ taskCount: 5 });
      expect(selectHorizontalLines(container)).toHaveLength(6); // 5 + 1
    });

    it("spaces horizontal lines by rowHeight", () => {
      const rowHeight = 40;
      const { container } = renderGridLines({ taskCount: 3, rowHeight });
      const horizontalLines = selectHorizontalLines(container);

      horizontalLines.forEach((line, i) => {
        expect(line.getAttribute("y1")).toBe(String(i * rowHeight));
      });
    });
  });

  // -------------------------------------------------------------------------
  // gridHeight consistency
  // -------------------------------------------------------------------------

  describe("gridHeight", () => {
    it("sets consistent height/y2 across weekend, holiday, and vertical SVG elements", () => {
      const taskCount = 4;
      const rowHeight = 40;
      const expectedHeight = String(taskCount * rowHeight);

      const { container } = renderGridLines({
        taskCount,
        rowHeight,
        showHolidays: true,
        holidayRegion: "DE",
      });

      // Weekend rects
      const weekendRect = container.querySelector(".weekend-column");
      if (weekendRect) {
        expect(weekendRect.getAttribute("height")).toBe(expectedHeight);
      }

      // Holiday rects
      const holidayRect = container.querySelector(".holiday-column");
      if (holidayRect) {
        expect(holidayRect.getAttribute("height")).toBe(expectedHeight);
      }

      // Vertical lines
      const vline = container.querySelector(".daily-line");
      if (vline) {
        expect(vline.getAttribute("y2")).toBe(expectedHeight);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe("edge cases", () => {
    it("renders with taskCount = 0 without errors", () => {
      const { container } = renderGridLines({ taskCount: 0 });
      // Should render the group element with horizontal lines (1 line at y=0)
      expect(container.querySelector(".grid-lines")).not.toBeNull();
    });

    it("uses scale.totalWidth when width prop is not provided", () => {
      const scale = createScale({ totalWidth: 500, pixelsPerDay: 25 });
      const { container } = renderGridLines({ scale });
      // Pick the first horizontal line (y1 === y2) and check x2
      const allLines = container.querySelectorAll("line");
      const hLine = Array.from(allLines).find(
        (l) => l.getAttribute("y1") === l.getAttribute("y2"),
      );
      expect(hLine).toBeDefined();
      expect(hLine!.getAttribute("x2")).toBe("500");
    });

    it("uses width prop when provided (overrides scale.totalWidth)", () => {
      const scale = createScale({ totalWidth: 500, pixelsPerDay: 25 });
      const { container } = renderGridLines({ scale, width: 300 });
      const allLines = container.querySelectorAll("line");
      const hLine = Array.from(allLines).find(
        (l) => l.getAttribute("y1") === l.getAttribute("y2"),
      );
      expect(hLine).toBeDefined();
      expect(hLine!.getAttribute("x2")).toBe("300");
    });
  });
});
