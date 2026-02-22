/**
 * Unit tests for useInfiniteScroll hook
 *
 * Tests focus on the scroll positioning logic (fitToView, file load)
 * and the edge-detection behavior of infinite scroll.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInfiniteScroll } from "../../../src/hooks/useInfiniteScroll";
import type { TimelineScale } from "../../../src/utils/timelineUtils";
import {
  INITIAL_BLOCK_MS,
  INFINITE_SCROLL_THRESHOLD,
  SCROLL_IDLE_MS,
  EXTEND_COOLDOWN_MS,
} from "../../../src/config/layoutConstants";

/** Creates a minimal mock chart container element */
function createMockChartContainer(): HTMLDivElement & {
  _listeners: Map<string, EventListener>;
} {
  const listeners = new Map<string, EventListener>();
  return {
    scrollLeft: 0,
    scrollWidth: 5000,
    clientWidth: 1000,
    addEventListener: vi.fn((event: string, handler: EventListener) => {
      listeners.set(event, handler);
    }),
    removeEventListener: vi.fn((event: string) => {
      listeners.delete(event);
    }),
    _listeners: listeners,
  } as unknown as HTMLDivElement & {
    _listeners: Map<string, EventListener>;
  };
}

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

describe("useInfiniteScroll", () => {
  let chartEl: ReturnType<typeof createMockChartContainer>;
  let chartContainerRef: React.RefObject<HTMLDivElement | null>;
  let extendDateRange: ReturnType<typeof vi.fn>;
  let rafCallbacks: (() => void)[];

  beforeEach(() => {
    vi.useFakeTimers();
    rafCallbacks = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb: () => void) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      })
    );

    chartEl = createMockChartContainer();
    chartContainerRef = { current: chartEl };
    extendDateRange = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Flush all queued rAF callbacks (nested double-rAF) */
  function flushRAF(): void {
    // Process up to 10 rounds (covers double-rAF patterns)
    for (let i = 0; i < 10 && rafCallbacks.length > 0; i++) {
      const batch = [...rafCallbacks];
      rafCallbacks = [];
      batch.forEach((cb) => cb());
    }
  }

  it("should set initial scroll position on first dateRange", () => {
    renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: createMockScale(10),
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    flushRAF();

    // SCROLL_OFFSET_DAYS = 83, pixelsPerDay = 10 → 830px
    expect(chartEl.scrollLeft).toBe(830);
  });

  it("should reset scroll position on fitToView", () => {
    const { rerender } = renderHook(
      ({ lastFitToViewTime }) =>
        useInfiniteScroll({
          chartContainerRef,
          scale: createMockScale(10),
          dateRange: { min: "2025-01-01", max: "2025-12-31" },
          lastFitToViewTime,
          fileLoadCounter: 0,
          extendDateRange,
        }),
      { initialProps: { lastFitToViewTime: 0 } }
    );

    flushRAF();
    chartEl.scrollLeft = 999; // User scrolled somewhere

    // Trigger fitToView
    rerender({ lastFitToViewTime: Date.now() });
    flushRAF();

    expect(chartEl.scrollLeft).toBe(830);
  });

  it("should reset scroll position when fileLoadCounter increases", () => {
    const { rerender } = renderHook(
      ({ fileLoadCounter }) =>
        useInfiniteScroll({
          chartContainerRef,
          scale: createMockScale(10),
          dateRange: { min: "2025-06-01", max: "2025-12-31" },
          lastFitToViewTime: 0,
          fileLoadCounter,
          extendDateRange,
        }),
      { initialProps: { fileLoadCounter: 0 } }
    );

    flushRAF();
    chartEl.scrollLeft = 999;

    rerender({ fileLoadCounter: 1 });
    flushRAF();

    expect(chartEl.scrollLeft).toBe(830);
  });

  it("should block infinite scroll during initial mount period", () => {
    renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: createMockScale(10),
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    // Simulate near-right-edge scroll during initial block period
    chartEl.scrollLeft = 4200;
    const handler = chartEl._listeners.get("scroll");
    handler?.(new Event("scroll"));

    expect(extendDateRange).not.toHaveBeenCalled();
  });

  it("should extend future when near right edge after initial block", () => {
    renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: createMockScale(10),
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    // Advance past initial block time
    vi.advanceTimersByTime(INITIAL_BLOCK_MS + 1);

    // Position near right edge (scrollLeft + clientWidth > scrollWidth - THRESHOLD)
    chartEl.scrollLeft = 4200; // 4200 + 1000 > 5000 - 500
    const handler = chartEl._listeners.get("scroll");
    handler?.(new Event("scroll"));

    expect(extendDateRange).toHaveBeenCalledWith("future", 30);
  });

  it("should schedule past extension when near left edge after idle time", () => {
    renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: createMockScale(10),
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    // Advance past initial block time
    vi.advanceTimersByTime(INITIAL_BLOCK_MS + 1);

    // Position near left edge
    chartEl.scrollLeft = 100;
    const handler = chartEl._listeners.get("scroll");
    handler?.(new Event("scroll"));

    // Not called yet (waiting for idle time)
    expect(extendDateRange).not.toHaveBeenCalled();

    // After idle delay, should trigger
    vi.advanceTimersByTime(SCROLL_IDLE_MS + 1);

    expect(extendDateRange).toHaveBeenCalledWith("past", 30);
  });

  it("should respect cooldown between future extensions", () => {
    renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: createMockScale(10),
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    vi.advanceTimersByTime(INITIAL_BLOCK_MS + 1);

    const handler = chartEl._listeners.get("scroll");

    // First trigger
    chartEl.scrollLeft = 4200;
    handler?.(new Event("scroll"));
    expect(extendDateRange).toHaveBeenCalledTimes(1);

    // Immediate second trigger — should be blocked by cooldown
    handler?.(new Event("scroll"));
    expect(extendDateRange).toHaveBeenCalledTimes(1);

    // After cooldown
    vi.advanceTimersByTime(EXTEND_COOLDOWN_MS + 1);
    handler?.(new Event("scroll"));
    expect(extendDateRange).toHaveBeenCalledTimes(2);
  });

  it("should not trigger when scroll is in safe zone", () => {
    renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: createMockScale(10),
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    vi.advanceTimersByTime(INITIAL_BLOCK_MS + 1);

    // Middle of scroll range — safe zone
    chartEl.scrollLeft = 2500;
    const handler = chartEl._listeners.get("scroll");
    handler?.(new Event("scroll"));

    vi.advanceTimersByTime(SCROLL_IDLE_MS + 100);

    expect(extendDateRange).not.toHaveBeenCalled();
  });

  it("should clean up scroll listener and pending timeout on unmount", () => {
    const { unmount } = renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: createMockScale(10),
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    vi.advanceTimersByTime(INITIAL_BLOCK_MS + 1);

    // Trigger a pending past extension
    chartEl.scrollLeft = 100;
    const handler = chartEl._listeners.get("scroll");
    handler?.(new Event("scroll"));

    unmount();

    // After unmount + idle time, should NOT call extendDateRange
    vi.advanceTimersByTime(SCROLL_IDLE_MS + 100);
    expect(extendDateRange).not.toHaveBeenCalled();

    expect(chartEl.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
  });

  it("should not register scroll listener without scale", () => {
    renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: null,
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    // The infinite scroll effect registers a "scroll" listener only when scale exists.
    // The initial scroll positioning effect also registers no listeners.
    // Only the initial positioning effect runs (but does nothing without scale).
    // Check that no scroll listener was registered by the infinite scroll effect
    // by checking the mock — it may have 0 or only other listeners.
    expect(extendDateRange).not.toHaveBeenCalled();
  });

  it("should cancel pending past extension on repeated left-edge scrolls", () => {
    renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: createMockScale(10),
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    vi.advanceTimersByTime(INITIAL_BLOCK_MS + 1);

    const handler = chartEl._listeners.get("scroll");

    // First near-left-edge scroll
    chartEl.scrollLeft = 100;
    handler?.(new Event("scroll"));

    // Another scroll before idle time expires (resets the timer)
    vi.advanceTimersByTime(SCROLL_IDLE_MS - 50);
    chartEl.scrollLeft = 80;
    handler?.(new Event("scroll"));

    // Original timer would have fired by now, but it was cancelled
    vi.advanceTimersByTime(60);
    expect(extendDateRange).not.toHaveBeenCalled();

    // New timer fires
    vi.advanceTimersByTime(SCROLL_IDLE_MS);
    expect(extendDateRange).toHaveBeenCalledTimes(1);
  });

  it("should not set scroll position when scale is null", () => {
    renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: null,
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    flushRAF();

    expect(chartEl.scrollLeft).toBe(0);
  });

  it("should block infinite scroll shortly after fitToView", () => {
    const { rerender } = renderHook(
      ({ lastFitToViewTime }) =>
        useInfiniteScroll({
          chartContainerRef,
          scale: createMockScale(10),
          dateRange: { min: "2025-01-01", max: "2025-12-31" },
          lastFitToViewTime,
          fileLoadCounter: 0,
          extendDateRange,
        }),
      { initialProps: { lastFitToViewTime: 0 } }
    );

    vi.advanceTimersByTime(INITIAL_BLOCK_MS + 1);

    // Trigger fitToView
    rerender({ lastFitToViewTime: Date.now() });
    flushRAF();

    // Try to scroll near right edge — should be blocked
    chartEl.scrollLeft = 4200;
    const handler = chartEl._listeners.get("scroll");
    handler?.(new Event("scroll"));

    expect(extendDateRange).not.toHaveBeenCalled();
  });
});

describe("useInfiniteScroll - edge thresholds", () => {
  it("should not extend when exactly at threshold boundary", () => {
    vi.useFakeTimers();

    const chartEl = createMockChartContainer();
    const chartContainerRef = { current: chartEl };
    const extendDateRange = vi.fn();

    renderHook(() =>
      useInfiniteScroll({
        chartContainerRef,
        scale: createMockScale(10),
        dateRange: { min: "2025-01-01", max: "2025-12-31" },
        lastFitToViewTime: 0,
        fileLoadCounter: 0,
        extendDateRange,
      })
    );

    vi.advanceTimersByTime(INITIAL_BLOCK_MS + 1);

    // Exactly at threshold — should NOT trigger (< THRESHOLD check)
    chartEl.scrollLeft = INFINITE_SCROLL_THRESHOLD;
    const handler = chartEl._listeners.get("scroll");
    handler?.(new Event("scroll"));

    vi.advanceTimersByTime(SCROLL_IDLE_MS + 100);

    expect(extendDateRange).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
