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

import { useEffect, useState, type RefObject } from "react";
import {
  INITIAL_CHART_CONTAINER_WIDTH,
  INITIAL_VIEWPORT_HEIGHT,
  MIN_VALID_DIMENSION,
} from "../config/layoutConstants";

interface UseContainerDimensionsOptions {
  outerScrollRef: RefObject<HTMLDivElement | null>;
  chartContainerRef: RefObject<HTMLDivElement | null>;
  setViewport: (scrollLeft: number, width: number) => void;
}

interface ContainerDimensions {
  viewportHeight: number;
  chartContainerWidth: number;
}

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

    // Initial measurement (delayed to ensure DOM is ready)
    const timer = setTimeout(measure, 0);

    const ro = new ResizeObserver(measure);
    ro.observe(outerScroll);
    ro.observe(chartContainer);

    return (): void => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [outerScrollRef, chartContainerRef]);

  // Track viewport state for export visible range calculation.
  // This effect creates its own ResizeObserver on chartContainer (separate from
  // the one above) because the two concerns are independent: the first measures
  // layout dimensions for rendering, this one tracks scroll position + width for
  // the export viewport range. Keeping them separate avoids coupling two distinct
  // side-effects into a single observer callback.
  //
  // NOTE: `setViewport` must be a stable reference (wrapped with useCallback at
  // the call site) to prevent this effect from re-running on every render.
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    const updateViewport = (): void => {
      setViewport(chartContainer.scrollLeft, chartContainer.clientWidth);
    };

    updateViewport();

    chartContainer.addEventListener("scroll", updateViewport);

    const ro = new ResizeObserver(updateViewport);
    ro.observe(chartContainer);

    return (): void => {
      chartContainer.removeEventListener("scroll", updateViewport);
      ro.disconnect();
    };
  }, [setViewport, chartContainerRef]);

  return { viewportHeight, chartContainerWidth };
}
