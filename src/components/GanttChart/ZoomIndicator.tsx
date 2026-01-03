/**
 * ZoomIndicator - Floating zoom level indicator
 * Sprint 1.2 Package 3: Navigation & Scale
 *
 * Shows current zoom percentage in center of screen
 * Fades in/out during zoom operations
 */

import { useEffect, useState } from "react";
import { useChartStore } from "../../store/slices/chartSlice";

export function ZoomIndicator() {
  const zoom = useChartStore((state) => state.zoom);
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    // Show indicator when zoom changes
    setVisible(true);

    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Hide after 1.5 seconds
    const id = window.setTimeout(() => {
      setVisible(false);
    }, 1500);

    setTimeoutId(id);

    return () => {
      if (id !== null) {
        clearTimeout(id);
      }
    };
  }, [zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div
      className="zoom-indicator fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-3 bg-black bg-opacity-80 text-white rounded-lg text-2xl font-bold pointer-events-none z-[9999] animate-fade-in-out"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {zoomPercentage}%
    </div>
  );
}
