/**
 * Unit tests for useScrollToDate hook.
 *
 * Tests the scroll-to-date mechanism that ensures newly created tasks
 * are visible in the timeline viewport.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollToDate } from "@/hooks/useScrollToDate";
import { useChartStore } from "@/store/slices/chartSlice";
import type { TimelineScale } from "@/utils/timelineUtils";

/** Creates a mock scale where date "2025-01-01" is at pixel 0 */
function createMockScale(pixelsPerDay = 10): TimelineScale {
  return {
    minDate: "2025-01-01",
    maxDate: "2025-12-31",
    pixelsPerDay,
    totalWidth: 3650,
    totalDays: 365,
    zoom: 1,
    scales: [],
  };
}

/** Creates a mock chart container */
function createMockChartContainer(
  overrides: Partial<{
    scrollLeft: number;
    clientWidth: number;
  }> = {}
): HTMLDivElement {
  return {
    scrollLeft: overrides.scrollLeft ?? 0,
    scrollWidth: 5000,
    clientWidth: overrides.clientWidth ?? 1000,
  } as unknown as HTMLDivElement;
}

describe("useScrollToDate", () => {
  beforeEach(() => {
    useChartStore.setState({
      scrollTargetDate: null,
      scale: null,
      // dateRange must cover the mock scale's minDate..maxDate for scroll tests.
      // Without this, the hook returns early because dateRange is null.
      dateRange: { min: "2025-01-01", max: "2025-12-31" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should do nothing when no scrollTargetDate is set", () => {
    const chartEl = createMockChartContainer({ scrollLeft: 500 });
    const chartContainerRef = {
      current: chartEl,
    } as React.RefObject<HTMLDivElement>;

    renderHook(() => useScrollToDate(chartContainerRef, createMockScale()));

    expect(chartEl.scrollLeft).toBe(500);
  });

  it("should scroll when target date is off-screen (to the right)", () => {
    const chartEl = createMockChartContainer({
      scrollLeft: 0,
      clientWidth: 500,
    });
    const chartContainerRef = {
      current: chartEl,
    } as React.RefObject<HTMLDivElement>;
    const scale = createMockScale(10);

    // Target date is at pixel position 1000 (100 days * 10 ppd)
    // Viewport shows 0..500, so 1000 is off-screen
    renderHook(() => useScrollToDate(chartContainerRef, scale));

    act(() => {
      useChartStore.getState().requestScrollToDate("2025-04-11"); // ~100 days from minDate
    });

    // Should have scrolled (scrollLeft changed from 0)
    expect(chartEl.scrollLeft).toBeGreaterThan(0);
  });

  it("should not scroll when target date is already visible", () => {
    const chartEl = createMockChartContainer({
      scrollLeft: 900,
      clientWidth: 500,
    });
    const chartContainerRef = {
      current: chartEl,
    } as React.RefObject<HTMLDivElement>;
    const scale = createMockScale(10);

    // Target date at ~1000px. Viewport shows 900..1400, so 1000 is visible
    renderHook(() => useScrollToDate(chartContainerRef, scale));

    act(() => {
      useChartStore.getState().requestScrollToDate("2025-04-11"); // ~100 days = 1000px
    });

    // scrollLeft should remain unchanged
    expect(chartEl.scrollLeft).toBe(900);
  });

  it("should clear scrollTargetDate after processing", () => {
    const chartEl = createMockChartContainer();
    const chartContainerRef = {
      current: chartEl,
    } as React.RefObject<HTMLDivElement>;
    const scale = createMockScale(10);

    renderHook(() => useScrollToDate(chartContainerRef, scale));

    act(() => {
      useChartStore.getState().requestScrollToDate("2025-06-15");
    });

    expect(useChartStore.getState().scrollTargetDate).toBeNull();
  });

  it("should do nothing when scale is null", () => {
    const chartEl = createMockChartContainer({ scrollLeft: 500 });
    const chartContainerRef = {
      current: chartEl,
    } as React.RefObject<HTMLDivElement>;

    renderHook(() => useScrollToDate(chartContainerRef, null));

    act(() => {
      useChartStore.getState().requestScrollToDate("2025-06-15");
    });

    // scrollLeft should remain unchanged since scale is null
    expect(chartEl.scrollLeft).toBe(500);
  });
});
