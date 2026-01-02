/**
 * useZoom - Hook for handling zoom interactions on Gantt chart
 * Sprint 1.2 Package 3: Navigation & Scale
 *
 * Features:
 * - Ctrl/Cmd + Wheel to zoom (mouse-centered)
 * - Keyboard shortcuts (Ctrl+0, Ctrl++, Ctrl+-)
 */

import { useCallback, useEffect } from 'react';
import { useChartStore } from '../store/slices/chartSlice';

interface UseZoomOptions {
  containerRef: React.RefObject<HTMLElement>;
  enabled?: boolean;
}

export function useZoom({ containerRef, enabled = true }: UseZoomOptions) {
  const {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useChartStore();

  // Zoom with Ctrl/Cmd + Wheel (centered on mouse)
  // Note: preventDefault is handled by window-level capture listener below
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enabled) return;

    // Only zoom with Ctrl (Windows/Linux) or Cmd (Mac)
    if (!e.ctrlKey && !e.metaKey) return;

    // Don't call e.preventDefault() here - React's onWheel is passive by default
    // The window-level capture listener (below) handles preventDefault with passive: false

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate zoom direction (negative deltaY = zoom in)
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = zoom + delta;

    // Set zoom with mouse centering
    setZoom(newZoom, { x: mouseX, y: mouseY });
  }, [enabled, zoom, setZoom, containerRef]);

  // Additional global prevention of browser zoom when over timeline
  useEffect(() => {
    if (!enabled) return;

    const preventBrowserZoom = (e: WheelEvent) => {
      // If Ctrl/Cmd is pressed, prevent default browser zoom globally
      if (e.ctrlKey || e.metaKey) {
        const container = containerRef.current;
        if (!container) return;

        // Check if mouse is over our container
        const rect = container.getBoundingClientRect();
        const isOverContainer =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (isOverContainer) {
          e.preventDefault();
        }
      }
    };

    // Attach to window in capture phase to intercept before browser
    window.addEventListener('wheel', preventBrowserZoom, { passive: false, capture: true });

    return () => {
      window.removeEventListener('wheel', preventBrowserZoom, { capture: true });
    };
  }, [enabled, containerRef]);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if target is an input element
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' ||
                     target.tagName === 'TEXTAREA' ||
                     target.isContentEditable;

      // Zoom shortcuts (Ctrl/Cmd + key)
      if ((e.ctrlKey || e.metaKey) && !isInput) {
        switch (e.key) {
          case '0':
            e.preventDefault();
            resetZoom();
            break;
          case '+':
          case '=':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
          case '_':
            e.preventDefault();
            zoomOut();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, zoomIn, zoomOut, resetZoom]);

  return {
    // Event handlers
    handlers: {
      onWheel: handleWheel,
    },
  };
}
