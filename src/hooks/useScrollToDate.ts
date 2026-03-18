/**
 * useScrollToDate — Scrolls chart container to show a target date.
 *
 * When scrollTargetDate is set in chartSlice, checks if the date is
 * visible in the current viewport. If not, scrolls to show it with
 * a few days of breathing room. Does NOT change the zoom level.
 *
 * If the target date is outside the current dateRange (e.g., jumping
 * to today from a project far in the future), the dateRange is expanded
 * first so the scroll position is valid. This avoids the user needing
 * to press the shortcut multiple times while infinite scroll catches up.
 *
 * Used by task creation (auto-scroll to new task) and Alt+T
 * (go to today).
 */

import { useEffect } from "react";
import type { TimelineScale } from "@/utils/timelineUtils";
import { dateToPixel } from "@/utils/timelineUtils";
import { useChartStore } from "@/store/slices/chartSlice";

/** Days of breathing room shown before the target date when scrolling */
const SCROLL_PADDING_DAYS = 7;

export function useScrollToDate(
  chartContainerRef: React.RefObject<HTMLDivElement | null>,
  scale: TimelineScale | null
): void {
  const scrollTargetDate = useChartStore((s) => s.scrollTargetDate);
  const clearScrollTarget = useChartStore((s) => s.clearScrollTarget);

  useEffect(() => {
    if (!scrollTargetDate || !scale || !chartContainerRef.current) return;

    const state = useChartStore.getState();
    const dateRange = state.dateRange;
    if (!dateRange) {
      clearScrollTarget();
      return;
    }

    // If the target date is outside the current dateRange, expand it first.
    // Without this, dateToPixel would return a clamped position at the edge,
    // and the user would need to press the shortcut repeatedly while infinite
    // scroll extends the range incrementally.
    useChartStore.getState().expandDateRangeTo(scrollTargetDate);
    const effectiveScale = useChartStore.getState().scale ?? scale;

    // Scroll to the target date
    const container = chartContainerRef.current;
    const targetPixel = dateToPixel(scrollTargetDate, effectiveScale);
    const { scrollLeft, clientWidth } = container;

    const isVisible =
      targetPixel >= scrollLeft && targetPixel <= scrollLeft + clientWidth;

    if (!isVisible) {
      const newScrollLeft = Math.max(
        0,
        targetPixel - SCROLL_PADDING_DAYS * effectiveScale.pixelsPerDay
      );
      container.scrollLeft = newScrollLeft;
    }

    clearScrollTarget();
    // chartContainerRef is a stable ref identity, intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTargetDate, scale, clearScrollTarget]);
}
