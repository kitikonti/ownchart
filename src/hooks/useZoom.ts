/**
 * useZoom - Hook for handling zoom interactions on Gantt chart
 * Sprint 1.2 Package 3: Navigation & Scale
 *
 * Features:
 * - Ctrl/Cmd + Wheel to zoom (cursor-centered)
 * - Keyboard shortcuts (Ctrl+0, Ctrl++, Ctrl+-) (viewport-centered)
 *
 * Zoom Anchoring:
 * - Wheel zoom: keeps the date under cursor at the same position
 * - Keyboard zoom: keeps the date at viewport center at the same position
 */

import { useCallback, useEffect } from "react";
import { useChartStore } from "../store/slices/chartSlice";
import { pixelToDate } from "../utils/timelineUtils";

interface UseZoomOptions {
  containerRef: React.RefObject<HTMLElement>;
  enabled?: boolean;
}

/** CSS class of the scrollable timeline container */
const SCROLL_CONTAINER_CLASS = "gantt-chart-scroll-container";

/** Zoom factor per mouse wheel step (exponential zoom for consistent feel) */
const WHEEL_ZOOM_FACTOR = 1.15;

/**
 * Get the scroll container element
 */
function getScrollContainer(): HTMLElement | null {
  return document.querySelector(`.${SCROLL_CONTAINER_CLASS}`);
}

/**
 * Apply scroll position after zoom
 */
function applyScrollLeft(newScrollLeft: number | null): void {
  if (newScrollLeft === null) return;

  const scrollContainer = getScrollContainer();
  if (scrollContainer) {
    scrollContainer.scrollLeft = newScrollLeft;
  }
}

export function useZoom({ containerRef, enabled = true }: UseZoomOptions): {
  handlers: {
    onWheel: (e: React.WheelEvent) => void;
  };
} {
  const { zoom, scale, setZoom, zoomIn, zoomOut, resetZoom } = useChartStore();

  // Zoom with Ctrl/Cmd + Wheel (centered on cursor position)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enabled) return;

      // Only zoom with Ctrl (Windows/Linux) or Cmd (Mac)
      if (!e.ctrlKey && !e.metaKey) return;

      const container = containerRef.current;
      if (!container) return;

      const scrollContainer = getScrollContainer();
      if (!scrollContainer || !scale) {
        // Fallback: zoom without anchoring (exponential)
        const factor = e.deltaY > 0 ? 1 / WHEEL_ZOOM_FACTOR : WHEEL_ZOOM_FACTOR;
        setZoom(zoom * factor);
        return;
      }

      // Get cursor position relative to the scroll container's content
      const rect = scrollContainer.getBoundingClientRect();
      const cursorXInViewport = e.clientX - rect.left;
      const scrollLeft = scrollContainer.scrollLeft;

      // Calculate the absolute pixel position of the cursor in the timeline
      const cursorPixelPos = scrollLeft + cursorXInViewport;

      // Convert pixel position to date (this is the anchor point)
      const anchorDate = pixelToDate(cursorPixelPos, scale);

      // Calculate zoom factor (exponential for consistent feel at all levels)
      const factor = e.deltaY > 0 ? 1 / WHEEL_ZOOM_FACTOR : WHEEL_ZOOM_FACTOR;
      const newZoom = zoom * factor;

      // Set zoom with cursor-centered anchor
      const result = setZoom(newZoom, {
        anchorDate,
        anchorPixelOffset: cursorXInViewport,
      });

      // Apply the calculated scroll position
      applyScrollLeft(result?.newScrollLeft ?? null);
    },
    [enabled, zoom, scale, setZoom, containerRef]
  );

  // Global prevention of browser zoom (Ctrl+Wheel) throughout the entire app
  // This provides consistent behavior like Figma/Miro where Ctrl+Wheel always
  // controls app zoom, not browser zoom. Browser zoom remains accessible via
  // the browser menu (View → Zoom) for accessibility/WCAG compliance.
  useEffect(() => {
    if (!enabled) return;

    const preventBrowserZoom = (e: WheelEvent): void => {
      // If Ctrl/Cmd is pressed, prevent browser zoom globally
      // This ensures consistent Ctrl+Wheel behavior across the entire app
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // Attach to window in capture phase to intercept before browser
    window.addEventListener("wheel", preventBrowserZoom, {
      passive: false,
      capture: true,
    });

    return (): void => {
      window.removeEventListener("wheel", preventBrowserZoom, {
        capture: true,
      });
    };
  }, [enabled]);

  // Keyboard shortcuts for zoom (viewport-centered)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Check if target is an input element
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Zoom shortcuts (Ctrl/Cmd + key)
      if ((e.ctrlKey || e.metaKey) && !isInput) {
        // Get viewport center anchor for keyboard zoom
        const getViewportCenterAnchor = ():
          | { anchorDate: string; anchorPixelOffset: number }
          | undefined => {
          const scrollContainer = getScrollContainer();
          const currentScale = useChartStore.getState().scale;

          if (!scrollContainer || !currentScale) {
            return undefined;
          }

          const scrollLeft = scrollContainer.scrollLeft;
          const viewportWidth = scrollContainer.clientWidth;
          const centerPixelPos = scrollLeft + viewportWidth / 2;

          return {
            anchorDate: pixelToDate(centerPixelPos, currentScale),
            anchorPixelOffset: viewportWidth / 2,
          };
        };

        switch (e.key) {
          case "0": {
            e.preventDefault();
            const anchor = getViewportCenterAnchor();
            const result = resetZoom(anchor);
            applyScrollLeft(result?.newScrollLeft ?? null);
            break;
          }
          case "+":
          case "=": {
            e.preventDefault();
            const anchor = getViewportCenterAnchor();
            const result = zoomIn(anchor);
            applyScrollLeft(result?.newScrollLeft ?? null);
            break;
          }
          case "-":
          case "_": {
            e.preventDefault();
            const anchor = getViewportCenterAnchor();
            const result = zoomOut(anchor);
            applyScrollLeft(result?.newScrollLeft ?? null);
            break;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return (): void => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, zoomIn, zoomOut, resetZoom]);

  return {
    // Event handlers
    handlers: {
      onWheel: handleWheel,
    },
  };
}

/**
 * Helper to get viewport center anchor for external use (e.g., toolbar buttons)
 */
export function getViewportCenterAnchor():
  | { anchorDate: string; anchorPixelOffset: number }
  | undefined {
  const scrollContainer = getScrollContainer();
  const scale = useChartStore.getState().scale;

  if (!scrollContainer || !scale) {
    return undefined;
  }

  const scrollLeft = scrollContainer.scrollLeft;
  const viewportWidth = scrollContainer.clientWidth;
  const centerPixelPos = scrollLeft + viewportWidth / 2;

  return {
    anchorDate: pixelToDate(centerPixelPos, scale),
    anchorPixelOffset: viewportWidth / 2,
  };
}

/**
 * Apply scroll position after zoom (exported for toolbar use)
 */
export { applyScrollLeft };
