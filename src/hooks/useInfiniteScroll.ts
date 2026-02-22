/**
 * useInfiniteScroll - Auto-extends timeline date range when scrolling near edges.
 *
 * Handles:
 * - Left-edge extension with idle-time debounce (browser overrides scrollLeft during drag)
 * - Right-edge extension on scroll
 * - Cooldown to prevent rapid-fire extensions
 * - Post-fitToView blocking to avoid immediate re-extension
 * - Post-mount blocking to wait for settings to load
 * - Initial scroll positioning on file load / fitToView
 */

import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import type { TimelineScale } from "../utils/timelineUtils";
import { SCROLL_OFFSET_DAYS } from "../utils/timelineUtils";
import {
  EXTEND_COOLDOWN_MS,
  FIT_TO_VIEW_BLOCK_MS,
  INITIAL_BLOCK_MS,
  SCROLL_IDLE_MS,
  INFINITE_SCROLL_THRESHOLD,
  FIT_TO_VIEW_EDGE_THRESHOLD,
  EXTEND_DAYS,
} from "../config/layoutConstants";

interface UseInfiniteScrollOptions {
  chartContainerRef: React.RefObject<HTMLDivElement | null>;
  scale: TimelineScale | null;
  dateRange: { min: string; max: string } | null;
  lastFitToViewTime: number;
  fileLoadCounter: number;
  extendDateRange: (direction: "past" | "future", days?: number) => void;
}

export function useInfiniteScroll({
  chartContainerRef,
  scale,
  dateRange,
  lastFitToViewTime,
  fileLoadCounter,
  extendDateRange,
}: UseInfiniteScrollOptions): void {
  // Cooldown refs (prevents rapid-fire extensions)
  const lastExtendPastRef = useRef<number>(0);
  const lastExtendFutureRef = useRef<number>(0);
  const lastFitToViewTimeRef = useRef<number>(0);
  const fitToViewScrollLockRef = useRef<boolean>(false);
  const mountTimeRef = useRef<number>(Date.now());
  const pendingPastExtensionRef = useRef<number | null>(null);

  // Track dateRange, fitToView, and file load for scroll positioning
  const prevDateRangeRef = useRef<string | null>(null);
  const prevFitToViewTimeRef = useRef<number>(0);
  const prevFileLoadCounterRef = useRef<number>(fileLoadCounter);

  // Set initial scroll position when a new file is loaded, or reset on fitToView
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer || !scale || !dateRange) return;

    // Check if fitToView was just called
    const fitToViewJustCalled =
      lastFitToViewTime > prevFitToViewTimeRef.current;
    prevFitToViewTimeRef.current = lastFitToViewTime;

    // Check if a file was just loaded
    const fileJustLoaded = fileLoadCounter > prevFileLoadCounterRef.current;
    prevFileLoadCounterRef.current = fileLoadCounter;

    const dateRangeKey = `${dateRange.min}-${dateRange.max}`;

    if (fitToViewJustCalled) {
      // Block infinite scroll for a short time to prevent immediate re-extension
      lastFitToViewTimeRef.current = Date.now();
      const fitScrollLeft = SCROLL_OFFSET_DAYS * scale.pixelsPerDay;
      // If scroll position will be near edge, lock until user scrolls away
      if (fitScrollLeft < FIT_TO_VIEW_EDGE_THRESHOLD) {
        fitToViewScrollLockRef.current = true;
      }
      // Double rAF to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          chartContainer.scrollLeft = fitScrollLeft;
        });
      });
      prevDateRangeRef.current = dateRangeKey;
      return;
    }

    // Scroll to show first task on initial load or when a new file is opened
    const isNewDateRange = prevDateRangeRef.current === null;

    if (isNewDateRange || fileJustLoaded) {
      const initialScrollLeft = SCROLL_OFFSET_DAYS * scale.pixelsPerDay;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          chartContainer.scrollLeft = initialScrollLeft;
        });
      });
    }

    prevDateRangeRef.current = dateRangeKey;
  }, [dateRange, scale, lastFitToViewTime, fileLoadCounter, chartContainerRef]);

  // Infinite scroll detection - extend timeline when near edges
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer || !scale) return;

    const handleScroll = (): void => {
      const { scrollLeft, scrollWidth, clientWidth } = chartContainer;
      const now = Date.now();

      // Block during initial load (wait for settings to be applied)
      if (now - mountTimeRef.current < INITIAL_BLOCK_MS) return;

      // Block shortly after fitToView to prevent immediate re-extension
      if (now - lastFitToViewTimeRef.current < FIT_TO_VIEW_BLOCK_MS) return;

      // If scroll lock is active, only release when user scrolls away from edge
      if (fitToViewScrollLockRef.current) {
        if (scrollLeft > FIT_TO_VIEW_EDGE_THRESHOLD) {
          fitToViewScrollLockRef.current = false;
        } else {
          return;
        }
      }

      // Near left edge? Schedule extension after scroll stops.
      // We must wait for scroll to stop because during active scrollbar drag,
      // the browser overrides any programmatic scrollLeft changes.
      if (scrollLeft < INFINITE_SCROLL_THRESHOLD) {
        if (pendingPastExtensionRef.current) {
          clearTimeout(pendingPastExtensionRef.current);
        }

        pendingPastExtensionRef.current = window.setTimeout(() => {
          pendingPastExtensionRef.current = null;

          const currentScrollLeft = chartContainer.scrollLeft;
          const currentScrollWidth = chartContainer.scrollWidth;
          const currentNow = Date.now();

          if (
            currentScrollLeft < INFINITE_SCROLL_THRESHOLD &&
            currentNow - lastExtendPastRef.current > EXTEND_COOLDOWN_MS
          ) {
            lastExtendPastRef.current = currentNow;

            // Capture distance from right edge (preserved during extension)
            const distanceFromRightEdge =
              currentScrollWidth - currentScrollLeft;

            flushSync(() => {
              extendDateRange("past", EXTEND_DAYS);
            });

            const newScrollWidth = chartContainer.scrollWidth;
            chartContainer.scrollLeft = newScrollWidth - distanceFromRightEdge;
          }
        }, SCROLL_IDLE_MS);
      }

      // Near right edge? Extend into future
      if (
        scrollLeft + clientWidth > scrollWidth - INFINITE_SCROLL_THRESHOLD &&
        now - lastExtendFutureRef.current > EXTEND_COOLDOWN_MS
      ) {
        lastExtendFutureRef.current = now;
        extendDateRange("future", EXTEND_DAYS);
      }
    };

    chartContainer.addEventListener("scroll", handleScroll);
    return (): void => {
      chartContainer.removeEventListener("scroll", handleScroll);
      if (pendingPastExtensionRef.current) {
        clearTimeout(pendingPastExtensionRef.current);
        pendingPastExtensionRef.current = null;
      }
    };
  }, [scale, extendDateRange, chartContainerRef]);
}
