/**
 * useContainerDimensions - Measures and tracks viewport/chart container dimensions.
 *
 * Consolidates:
 * - Initial dimension measurement
 * - ResizeObserver for ongoing updates
 * - Viewport state tracking for export visible range calculation
 *
 * Returns viewportHeight and chartContainerWidth as state.
 */

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import {
  INITIAL_CHART_CONTAINER_WIDTH,
  INITIAL_MEASURE_DELAY_MS,
  INITIAL_VIEWPORT_HEIGHT,
  MIN_VALID_DIMENSION,
} from "../config/layoutConstants";

interface UseContainerDimensionsOptions {
  outerScrollRef: RefObject<HTMLDivElement | null>;
  chartContainerRef: RefObject<HTMLDivElement | null>;
  /**
   * Callback to update the viewport's scroll position and width.
   * Must be wrapped in `useCallback` at the call site — an unstable reference
   * causes the viewport-tracking effect to re-run on every render, which can
   * trigger an infinite update loop via the scroll event.
   */
  setViewport: (scrollLeft: number, width: number) => void;
}

interface ContainerDimensions {
  viewportHeight: number;
  chartContainerWidth: number;
}

/**
 * Measures and tracks viewport and chart container dimensions.
 *
 * Sets up an initial deferred measurement (via setTimeout 0) and a
 * ResizeObserver for ongoing updates. Also tracks the chart viewport's scroll
 * position and width for export visible-range calculation.
 *
 * @param outerScrollRef - Ref to the outer scroll container (drives viewportHeight).
 * @param chartContainerRef - Ref to the chart container (drives chartContainerWidth).
 * @param setViewport - Callback to update scroll position + width for export.
 *   See `UseContainerDimensionsOptions.setViewport` for the `useCallback` requirement.
 */
export function useContainerDimensions({
  outerScrollRef,
  chartContainerRef,
  setViewport,
}: UseContainerDimensionsOptions): ContainerDimensions {
  const [viewportHeight, setViewportHeight] = useState(INITIAL_VIEWPORT_HEIGHT);
  const [chartContainerWidth, setChartContainerWidth] = useState(
    INITIAL_CHART_CONTAINER_WIDTH
  );

  // Initial measurement + ResizeObserver for ongoing dimension tracking
  useEffect(() => {
    const outerScroll = outerScrollRef.current;
    const chartContainer = chartContainerRef.current;

    if (!outerScroll || !chartContainer) return;

    const measure = (): void => {
      const height = outerScroll.offsetHeight;
      const width = chartContainer.offsetWidth;
      if (height > MIN_VALID_DIMENSION) setViewportHeight(height);
      if (width > MIN_VALID_DIMENSION) setChartContainerWidth(width);
    };

    // Initial measurement: defer one macrotask so the browser has committed
    // layout before we read offsetHeight / offsetWidth. Delay value is 0 ms —
    // see INITIAL_MEASURE_DELAY_MS in layoutConstants for the rationale.
    const timer = setTimeout(measure, INITIAL_MEASURE_DELAY_MS);

    const ro = new ResizeObserver(measure);
    ro.observe(outerScroll);
    ro.observe(chartContainer);

    return (): void => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [outerScrollRef, chartContainerRef]);

  // Track viewport state for export visible range calculation.
  // Separate from the dimension-measurement effect above because the two
  // concerns are independent: that one measures layout for rendering, this one
  // tracks scroll position + width for the export viewport range.
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    const updateViewport = (): void => {
      setViewport(chartContainer.scrollLeft, chartContainer.clientWidth);
    };

    updateViewport();

    // { passive: true } — handler only reads scrollLeft/clientWidth, never
    // calls preventDefault(). Passive listener avoids blocking compositing
    // on every scroll frame.
    chartContainer.addEventListener("scroll", updateViewport, {
      passive: true,
    });

    const ro = new ResizeObserver(updateViewport);
    ro.observe(chartContainer);

    return (): void => {
      chartContainer.removeEventListener("scroll", updateViewport);
      ro.disconnect();
    };
  }, [setViewport, chartContainerRef]);

  return { viewportHeight, chartContainerWidth };
}
