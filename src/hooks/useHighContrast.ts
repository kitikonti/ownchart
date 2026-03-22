/**
 * useHighContrast - Manages high contrast mode side effects.
 *
 * Applies/removes data-high-contrast attribute on <html>.
 * CSS rules in index.css use this attribute to boost contrast
 * for grid lines, text, and backgrounds.
 */

import { useEffect } from "react";
import { useUIStore } from "@/store/slices/uiSlice";

export function useHighContrast(): void {
  const isHighContrast = useUIStore((state) => state.isHighContrast);

  useEffect(() => {
    const html = document.documentElement;
    if (isHighContrast) {
      html.dataset.highContrast = "true";
    } else {
      delete html.dataset.highContrast;
    }
  }, [isHighContrast]);
}
