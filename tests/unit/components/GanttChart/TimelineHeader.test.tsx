/**
 * Unit tests for TimelineHeader component
 * Focus: design token usage, scale cell generation, today highlighting,
 * font constants, width override prop
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { TimelineHeader } from "../../../../src/components/GanttChart/TimelineHeader";
import {
  COLORS,
  TIMELINE_HEADER,
  TYPOGRAPHY,
} from "../../../../src/styles/design-tokens";
import type { TimelineScale } from "../../../../src/utils/timelineUtils";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../../../../src/store/slices/userPreferencesSlice", () => ({
  useFirstDayOfWeek: vi.fn(() => "monday"),
  useWeekNumberingSystem: vi.fn(() => "iso"),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createScale(overrides: Partial<TimelineScale> = {}): TimelineScale {
  return {
    minDate: "2025-01-01",
    maxDate: "2025-01-31",
    pixelsPerDay: 25,
    totalWidth: 775,
    totalDays: 31,
    zoom: 1,
    scales: [],
    ...overrides,
  };
}

function renderHeader(
  props: Partial<Parameters<typeof TimelineHeader>[0]> = {},
): ReturnType<typeof render> {
  const defaultProps = {
    scale: createScale(),
  };
  return render(
    <svg>
      <TimelineHeader {...defaultProps} {...props} />
    </svg>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TimelineHeader", () => {
  // -------------------------------------------------------------------------
  // Basic rendering
  // -------------------------------------------------------------------------

  describe("basic rendering", () => {
    it("renders a timeline-header group", () => {
      const { container } = renderHeader();
      const header = container.querySelector(".timeline-header");
      expect(header).not.toBeNull();
    });

    it("renders scale rows", () => {
      const { container } = renderHeader();
      const rows = container.querySelectorAll("[class^='scale-row']");
      expect(rows.length).toBeGreaterThan(0);
    });

    it("renders text elements for cell labels", () => {
      const { container } = renderHeader();
      const texts = container.querySelectorAll(".timeline-header text");
      expect(texts.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Design tokens
  // -------------------------------------------------------------------------

  describe("design tokens", () => {
    it("uses TIMELINE_HEADER.bg for background fill", () => {
      const { container } = renderHeader();
      const bg = container.querySelector(".timeline-header > rect");
      expect(bg).not.toBeNull();
      expect(bg!.getAttribute("fill")).toBe(TIMELINE_HEADER.bg);
    });

    it("uses TIMELINE_HEADER.border for separator lines", () => {
      const { container } = renderHeader();
      const lines = container.querySelectorAll(".timeline-header line");
      expect(lines.length).toBeGreaterThan(0);
      // All lines should use the border token
      lines.forEach((line) => {
        expect(line.getAttribute("stroke")).toBe(TIMELINE_HEADER.border);
      });
    });

    it("uses COLORS.chart.text for non-today cell text", () => {
      const { container } = renderHeader();
      const texts = container.querySelectorAll(".timeline-header text");
      // At least some text should have the standard text color
      const standardTexts = Array.from(texts).filter(
        (t) => t.getAttribute("fill") === COLORS.chart.text,
      );
      expect(standardTexts.length).toBeGreaterThan(0);
    });

    it("uses TYPOGRAPHY.fontWeight tokens for text weight", () => {
      const { container } = renderHeader();
      const texts = container.querySelectorAll(".timeline-header text");
      const weights = Array.from(texts).map((t) =>
        Number(t.getAttribute("font-weight")),
      );
      // All weights must be from TYPOGRAPHY tokens
      weights.forEach((w) => {
        expect([
          TYPOGRAPHY.fontWeight.normal,
          TYPOGRAPHY.fontWeight.semibold,
        ]).toContain(w);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Today highlighting
  // -------------------------------------------------------------------------

  describe("today highlighting", () => {
    it("highlights today's cell with todayHighlight fill at daily zoom", () => {
      const today = new Date();
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() - 5);
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 5);

      // Need zoom >= 1.2 (effective 30+ px/day) for day-level cells
      const scale = createScale({
        minDate: minDate.toISOString().split("T")[0],
        maxDate: maxDate.toISOString().split("T")[0],
        pixelsPerDay: 40,
        totalWidth: 440,
        totalDays: 11,
        zoom: 2,
      });

      const { container } = renderHeader({ scale });
      const todayRects = Array.from(
        container.querySelectorAll(".timeline-header rect"),
      ).filter((r) => r.getAttribute("fill") === COLORS.chart.todayHighlight);
      expect(todayRects.length).toBeGreaterThan(0);
    });

    it("uses todayMarker color for today's text", () => {
      const today = new Date();
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() - 5);
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 5);

      // Need zoom >= 1.2 (effective 30+ px/day) for day-level cells
      const scale = createScale({
        minDate: minDate.toISOString().split("T")[0],
        maxDate: maxDate.toISOString().split("T")[0],
        pixelsPerDay: 40,
        totalWidth: 440,
        totalDays: 11,
        zoom: 2,
      });

      const { container } = renderHeader({ scale });
      const todayTexts = Array.from(
        container.querySelectorAll(".timeline-header text"),
      ).filter((t) => t.getAttribute("fill") === COLORS.chart.todayMarker);
      expect(todayTexts.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Width override
  // -------------------------------------------------------------------------

  describe("width prop", () => {
    it("uses scale.totalWidth when no width prop provided", () => {
      const scale = createScale({ totalWidth: 500 });
      const { container } = renderHeader({ scale });
      const bg = container.querySelector(".timeline-header > rect");
      expect(bg!.getAttribute("width")).toBe("500");
    });

    it("uses explicit width prop when provided", () => {
      const scale = createScale({ totalWidth: 500 });
      const { container } = renderHeader({ scale, width: 800 });
      const bg = container.querySelector(".timeline-header > rect");
      expect(bg!.getAttribute("width")).toBe("800");
    });
  });

  // -------------------------------------------------------------------------
  // Zoom-based scale adaptation
  // -------------------------------------------------------------------------

  describe("zoom adaptation", () => {
    it("renders at least 2 scale rows at standard zoom", () => {
      const { container } = renderHeader();
      const rows = container.querySelectorAll("[class^='scale-row']");
      expect(rows.length).toBeGreaterThanOrEqual(2);
    });

    it("renders cells at very low zoom (monthly scale)", () => {
      const scale = createScale({
        pixelsPerDay: 1,
        totalWidth: 365,
        totalDays: 365,
        maxDate: "2025-12-31",
        zoom: 1,
      });
      const { container } = renderHeader({ scale });
      const texts = container.querySelectorAll(".timeline-header text");
      expect(texts.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Font size constants
  // -------------------------------------------------------------------------

  describe("font sizes", () => {
    it("uses 12px for primary scale row and 11px for secondary", () => {
      const { container } = renderHeader();
      const row0Texts = container.querySelectorAll(".scale-row-0 text");
      const row1Texts = container.querySelectorAll(".scale-row-1 text");

      if (row0Texts.length > 0) {
        expect(row0Texts[0].getAttribute("font-size")).toBe("12");
      }
      if (row1Texts.length > 0) {
        expect(row1Texts[0].getAttribute("font-size")).toBe("11");
      }
    });
  });
});
