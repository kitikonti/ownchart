/**
 * Unit tests for useContainerDimensions hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useContainerDimensions } from "../../../src/hooks/useContainerDimensions";

/** Minimal mock element for dimension measurement.
 * Uses mutable backing fields accessible via configurable getters
 * so tests can change values and trigger ResizeObserver. */
function createMockElement(
  initialWidth = 800,
  initialHeight = 600
): HTMLDivElement & {
  _listeners: Map<string, EventListener>;
  _scrollLeft: number;
  _clientWidth: number;
  _offsetWidth: number;
  _offsetHeight: number;
} {
  const listeners = new Map<string, EventListener>();
  const el = {
    _offsetWidth: initialWidth,
    _offsetHeight: initialHeight,
    _scrollLeft: 0,
    _clientWidth: initialWidth,
    get offsetWidth() {
      return this._offsetWidth;
    },
    get offsetHeight() {
      return this._offsetHeight;
    },
    get scrollLeft() {
      return this._scrollLeft;
    },
    set scrollLeft(v: number) {
      this._scrollLeft = v;
    },
    get clientWidth() {
      return this._clientWidth;
    },
    addEventListener: vi.fn((event: string, handler: EventListener) => {
      listeners.set(event, handler);
    }),
    removeEventListener: vi.fn((event: string) => {
      listeners.delete(event);
    }),
    _listeners: listeners,
  } as unknown as HTMLDivElement & {
    _listeners: Map<string, EventListener>;
    _scrollLeft: number;
    _clientWidth: number;
    _offsetWidth: number;
    _offsetHeight: number;
  };
  return el;
}

// Mock ResizeObserver — tracks all instances
let resizeObserverCallbacks: ResizeObserverCallback[] = [];
let observedElements: Element[] = [];

class MockResizeObserver {
  private callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObserverCallbacks.push(callback);
  }
  observe(el: Element): void {
    observedElements.push(el);
  }
  unobserve(): void {
    /* noop */
  }
  disconnect(): void {
    observedElements = [];
  }
}

/** Fire all ResizeObserver callbacks (simulates a resize event) */
function fireAllResizeObservers(): void {
  for (const cb of resizeObserverCallbacks) {
    cb([], {} as ResizeObserver);
  }
}

describe("useContainerDimensions", () => {
  let outerEl: ReturnType<typeof createMockElement>;
  let chartEl: ReturnType<typeof createMockElement>;
  let outerScrollRef: React.RefObject<HTMLDivElement | null>;
  let chartContainerRef: React.RefObject<HTMLDivElement | null>;
  let setViewport: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    observedElements = [];
    resizeObserverCallbacks = [];

    outerEl = createMockElement(1200, 700);
    chartEl = createMockElement(900, 600);
    outerScrollRef = { current: outerEl };
    chartContainerRef = { current: chartEl };
    setViewport = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should return initial default dimensions before measurement", () => {
    // Use null refs so the effect doesn't fire
    const { result } = renderHook(() =>
      useContainerDimensions({
        outerScrollRef: { current: null },
        chartContainerRef: { current: null },
        setViewport,
      })
    );

    expect(result.current.viewportHeight).toBe(600);
    expect(result.current.chartContainerWidth).toBe(800);
  });

  it("should measure dimensions after initial timeout", () => {
    const { result } = renderHook(() =>
      useContainerDimensions({
        outerScrollRef,
        chartContainerRef,
        setViewport,
      })
    );

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.viewportHeight).toBe(700);
    expect(result.current.chartContainerWidth).toBe(900);
  });

  it("should ignore dimensions below MIN_VALID_DIMENSION", () => {
    outerEl = createMockElement(50, 50); // Both dimensions too small
    outerScrollRef = { current: outerEl };

    const { result } = renderHook(() =>
      useContainerDimensions({
        outerScrollRef,
        chartContainerRef,
        setViewport,
      })
    );

    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Should keep defaults (600) because measurement was below threshold
    expect(result.current.viewportHeight).toBe(600);
    // Chart container is still valid (900)
    expect(result.current.chartContainerWidth).toBe(900);
  });

  it("should update dimensions via ResizeObserver", () => {
    const { result } = renderHook(() =>
      useContainerDimensions({
        outerScrollRef,
        chartContainerRef,
        setViewport,
      })
    );

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.viewportHeight).toBe(700);
    expect(result.current.chartContainerWidth).toBe(900);

    // Simulate a resize by changing the backing fields
    outerEl._offsetHeight = 900;
    chartEl._offsetWidth = 1100;

    act(() => {
      fireAllResizeObservers();
    });

    expect(result.current.viewportHeight).toBe(900);
    expect(result.current.chartContainerWidth).toBe(1100);
  });

  it("should call setViewport on mount", () => {
    renderHook(() =>
      useContainerDimensions({
        outerScrollRef,
        chartContainerRef,
        setViewport,
      })
    );

    expect(setViewport).toHaveBeenCalledWith(0, 900);
  });

  it("should update viewport on chart container scroll", () => {
    renderHook(() =>
      useContainerDimensions({
        outerScrollRef,
        chartContainerRef,
        setViewport,
      })
    );

    // Simulate scroll
    chartEl._scrollLeft = 250;
    const scrollHandler = chartEl._listeners.get("scroll");
    scrollHandler?.(new Event("scroll"));

    expect(setViewport).toHaveBeenCalledWith(250, 900);
  });

  it("should clean up on unmount", () => {
    const { unmount } = renderHook(() =>
      useContainerDimensions({
        outerScrollRef,
        chartContainerRef,
        setViewport,
      })
    );

    unmount();

    expect(chartEl.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    );
  });
});
