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

import { useEffect, useRef, type MutableRefObject } from "react";
import { flushSync } from "react-dom";
import type { TimelineScale } from "@/utils/timelineUtils";
import { SCROLL_OFFSET_DAYS, dateToPixel } from "@/utils/timelineUtils";
import { useChartStore } from "@/store/slices/chartSlice";
import {
  EXTEND_COOLDOWN_MS,
  FIT_TO_VIEW_BLOCK_MS,
  INITIAL_BLOCK_MS,
  SCROLL_IDLE_MS,
  INFINITE_SCROLL_THRESHOLD,
  FIT_TO_VIEW_EDGE_THRESHOLD,
  EXTEND_DAYS,
} from "@/config/layoutConstants";

/**
 * Schedules a past-extension after scroll idle time, with scroll-anchor
 * restoration using flushSync. Cancels any pending timeout on each call
 * (debounce) so the extension fires only after the scroll has stopped.
 */
function schedulePastExtension(
  chartContainer: HTMLDivElement,
  pendingPastExtensionRef: MutableRefObject<number | null>,
  lastExtendPastRef: MutableRefObject<number>,
  extendDateRange: (direction: "past" | "future", days?: number) => void
): void {
  if (pendingPastExtensionRef.current) {
    clearTimeout(pendingPastExtensionRef.current);
  }

  pendingPastExtensionRef.current = window.setTimeout(() => {
    // Defensive: if the effect was cleaned up and the ref cleared
    // before this timeout fired, do nothing.
    if (pendingPastExtensionRef.current === null) return;
    pendingPastExtensionRef.current = null;

    const currentScrollLeft = chartContainer.scrollLeft;
    const currentScrollWidth = chartContainer.scrollWidth;
    const currentNow = Date.now();

    if (
      currentScrollLeft < INFINITE_SCROLL_THRESHOLD &&
      currentNow - lastExtendPastRef.current > EXTEND_COOLDOWN_MS
    ) {
      lastExtendPastRef.current = currentNow;

      // Capture the amount of content to the right of the current
      // viewport position; this is preserved after extending the left
      // edge so the visible area stays anchored to the same location.
      const scrollRightAnchor = currentScrollWidth - currentScrollLeft;

      // flushSync forces a synchronous React render so the DOM is
      // updated before we read the new scrollWidth below.
      // Guarded with try/catch: flushSync throws if called during an
      // existing React render (should not happen here, but defensive).
      try {
        flushSync(() => {
          extendDateRange("past", EXTEND_DAYS);
        });
        // Anchor restoration is inside the try block so it only runs
        // after the DOM has been synchronously updated by flushSync.
        const newScrollWidth = chartContainer.scrollWidth;
        chartContainer.scrollLeft = newScrollWidth - scrollRightAnchor;
      } catch (_e) {
        // flushSync throws if called inside an active React render cycle.
        // This should not happen here (scroll handler runs outside React),
        // but as a defensive fallback we schedule the update asynchronously.
        // Scroll-anchor restoration is intentionally skipped here because
        // the DOM has not updated yet; a slight visible jump is acceptable
        // for this already-exceptional case.
        extendDateRange("past", EXTEND_DAYS);
      }
    }
  }, SCROLL_IDLE_MS);
}

/**
 * Extends the timeline into the future when the scroll position is near the
 * right edge, respecting the cooldown between extensions.
 */
function extendFutureIfNearEdge(
  scrollLeft: number,
  scrollWidth: number,
  clientWidth: number,
  now: number,
  lastExtendFutureRef: MutableRefObject<number>,
  extendDateRange: (direction: "past" | "future", days?: number) => void
): void {
  if (
    scrollLeft + clientWidth > scrollWidth - INFINITE_SCROLL_THRESHOLD &&
    now - lastExtendFutureRef.current > EXTEND_COOLDOWN_MS
  ) {
    lastExtendFutureRef.current = now;
    extendDateRange("future", EXTEND_DAYS);
  }
}

interface UseInfiniteScrollOptions {
  chartContainerRef: React.RefObject<HTMLDivElement | null>;
  scale: TimelineScale | null;
  dateRange: { min: string; max: string } | null;
  lastFitToViewTime: number;
  fileLoadCounter: number;
  /**
   * Callback to extend the visible date range.
   * **Must be a stable reference** (e.g. from a Zustand store selector or
   * wrapped in `useCallback`) — it is listed as a dependency of the scroll
   * effect, so an unstable reference will re-register the listener on every
   * render and discard any pending debounced extension.
   */
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

  // Pending scroll target — survives effect re-runs caused by scale changes.
  // Without this, ChartCanvas.updateScale creates a new scale object → triggers
  // re-render → effect cleanup cancels the pending rAF → scroll never applied.
  // The ref preserves the target across re-runs so it can be re-scheduled.
  const pendingScrollTargetRef = useRef<number | null>(null);

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
      pendingScrollTargetRef.current = fitScrollLeft;
      prevDateRangeRef.current = dateRangeKey;
    } else if (fileJustLoaded || prevDateRangeRef.current === null) {
      // Scroll to show first task on initial load or when a new file is opened.
      // viewAnchorDate: device-independent scroll restore from saved date.
      // Falls back to SCROLL_OFFSET_DAYS (7 days before first task) for new
      // charts or old files that don't have viewAnchorDate.
      const viewAnchorDate = useChartStore.getState().viewAnchorDate;
      pendingScrollTargetRef.current = viewAnchorDate
        ? dateToPixel(viewAnchorDate, scale)
        : SCROLL_OFFSET_DAYS * scale.pixelsPerDay;
      prevDateRangeRef.current = dateRangeKey;
    }

    // Apply pending scroll position via double rAF (waits for DOM update).
    // Using a ref ensures the target survives effect re-runs caused by
    // scale re-derivation (ChartCanvas.updateScale creates a new scale
    // object on every call, triggering a re-render + effect re-run).
    if (pendingScrollTargetRef.current !== null) {
      const scrollTarget = pendingScrollTargetRef.current;
      let cancelled = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) {
            chartContainer.scrollLeft = scrollTarget;
            pendingScrollTargetRef.current = null;
          }
        });
      });
      if (!prevDateRangeRef.current) {
        prevDateRangeRef.current = dateRangeKey;
      }
      return (): void => {
        // Only cancel the rAF write — do NOT clear pendingScrollTargetRef.
        // The ref must survive effect re-runs so the next run can re-schedule
        // the scroll. ChartCanvas.updateScale creates a new scale object on
        // every call, triggering re-render → cleanup → re-run. If we cleared
        // the ref here, the scroll target would be lost.
        cancelled = true;
      };
    }

    prevDateRangeRef.current = dateRangeKey;
    // chartContainerRef intentionally omitted: the ref object is a stable
    // identity (React guarantees it never changes); .current is read
    // imperatively inside the effect, not captured in the closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chartContainerRef and prevDateRangeRef are stable refs
  }, [dateRange, scale, lastFitToViewTime, fileLoadCounter]);

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
        schedulePastExtension(
          chartContainer,
          pendingPastExtensionRef,
          lastExtendPastRef,
          extendDateRange
        );
      }

      // Near right edge? Extend into future
      extendFutureIfNearEdge(
        scrollLeft,
        scrollWidth,
        clientWidth,
        now,
        lastExtendFutureRef,
        extendDateRange
      );
    };

    chartContainer.addEventListener("scroll", handleScroll);
    return (): void => {
      chartContainer.removeEventListener("scroll", handleScroll);
      if (pendingPastExtensionRef.current) {
        clearTimeout(pendingPastExtensionRef.current);
        pendingPastExtensionRef.current = null;
      }
    };
    // chartContainerRef intentionally omitted: the ref object is a stable
    // identity (React guarantees it never changes); .current is read
    // imperatively inside the effect, not captured in the closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chartContainerRef and pendingPastExtensionRef are stable refs
  }, [scale, extendDateRange]);
}
