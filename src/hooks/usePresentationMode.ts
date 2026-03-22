/**
 * usePresentationMode - Manages presentation mode side effects.
 *
 * Applies/removes data-presentation-mode attribute on <html>.
 * No fullscreen — users can press F11 themselves if needed.
 */

import { useEffect } from "react";
import { useUIStore } from "@/store/slices/uiSlice";

export function usePresentationMode(): void {
  const isPresentationMode = useUIStore((state) => state.isPresentationMode);

  useEffect(() => {
    const html = document.documentElement;
    if (isPresentationMode) {
      html.dataset.presentationMode = "true";
    } else {
      delete html.dataset.presentationMode;
    }
  }, [isPresentationMode]);
}
