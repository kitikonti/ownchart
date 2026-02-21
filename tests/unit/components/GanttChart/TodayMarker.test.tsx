/**
 * Unit tests for TodayMarker component
 * Focus: visibility range check, correct positioning, design-token usage
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { TodayMarker } from "../../../../src/components/GanttChart/TodayMarker";
import type { TimelineScale } from "../../../../src/utils/timelineUtils";
import { COLORS } from "../../../../src/styles/design-tokens";

// ---------------------------------------------------------------------------
// Mock dateToPixel to avoid scale internals
// ---------------------------------------------------------------------------

vi.mock("../../../../src/utils/timelineUtils", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/utils/timelineUtils")>(
    "../../../../src/utils/timelineUtils",
  );
  return {
    ...actual,
    dateToPixel: vi.fn(() => 250),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createScale(overrides: Partial<TimelineScale> = {}): TimelineScale {
  return {
    minDate: "2025-01-01",
    maxDate: "2025-12-31",
    pixelsPerDay: 25,
    totalWidth: 9125,
    totalDays: 365,
    zoom: 1,
    scales: [],
    ...overrides,
  };
}

function renderMarker(
  scaleOverrides: Partial<TimelineScale> = {},
  svgHeight = 600,
): ReturnType<typeof render> {
  return render(
    <svg>
      <TodayMarker scale={createScale(scaleOverrides)} svgHeight={svgHeight} />
    </svg>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TodayMarker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Visibility range
  // -------------------------------------------------------------------------

  describe("visibility range", () => {
    it("renders when today is within scale range", () => {
      // Default scale spans all of 2025 — today (mocked or real) is within
      const { container } = renderMarker({
        minDate: "2020-01-01",
        maxDate: "2030-12-31",
      });
      const g = container.querySelector(".today-marker");
      expect(g).not.toBeNull();
    });

    it("returns null when today is before minDate", () => {
      const { container } = renderMarker({
        minDate: "2099-01-01",
        maxDate: "2099-12-31",
      });
      expect(container.querySelector(".today-marker")).toBeNull();
    });

    it("returns null when today is after maxDate", () => {
      const { container } = renderMarker({
        minDate: "2000-01-01",
        maxDate: "2000-12-31",
      });
      expect(container.querySelector(".today-marker")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // SVG structure
  // -------------------------------------------------------------------------

  describe("SVG structure", () => {
    it("renders a vertical line inside a .today-marker group", () => {
      const { container } = renderMarker({
        minDate: "2020-01-01",
        maxDate: "2030-12-31",
      });
      const line = container.querySelector(".today-marker line");
      expect(line).not.toBeNull();
    });

    it("line spans from y=0 to svgHeight", () => {
      const { container } = renderMarker(
        { minDate: "2020-01-01", maxDate: "2030-12-31" },
        800,
      );
      const line = container.querySelector(".today-marker line")!;
      expect(line.getAttribute("y1")).toBe("0");
      expect(line.getAttribute("y2")).toBe("800");
    });

    it("line x1 and x2 are equal (vertical)", () => {
      const { container } = renderMarker({
        minDate: "2020-01-01",
        maxDate: "2030-12-31",
      });
      const line = container.querySelector(".today-marker line")!;
      expect(line.getAttribute("x1")).toBe(line.getAttribute("x2"));
    });
  });

  // -------------------------------------------------------------------------
  // Design tokens
  // -------------------------------------------------------------------------

  describe("design-token colors", () => {
    it("uses todayMarker color from design tokens", () => {
      const { container } = renderMarker({
        minDate: "2020-01-01",
        maxDate: "2030-12-31",
      });
      const line = container.querySelector(".today-marker line")!;
      expect(line.getAttribute("stroke")).toBe(COLORS.chart.todayMarker);
    });

    it("has strokeWidth of 1", () => {
      const { container } = renderMarker({
        minDate: "2020-01-01",
        maxDate: "2030-12-31",
      });
      const line = container.querySelector(".today-marker line")!;
      expect(line.getAttribute("stroke-width")).toBe("1");
    });
  });
});
