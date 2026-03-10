/**
 * useDeviceDetection - Detects mobile devices via viewport width + pointer type.
 *
 * Blocks narrow touch devices (phones, portrait tablets) while allowing:
 * - Desktop with narrow window (fine pointer → not blocked)
 * - Touch-enabled desktop/laptop (wide viewport → not blocked)
 * - Landscape tablets (wide enough → not blocked)
 */

import { useState, useEffect, useCallback } from "react";

export interface DeviceDetection {
  isMobileDevice: boolean;
  isDismissed: boolean;
  dismiss: () => void;
  shouldShowMobileBlock: boolean;
}

/** 768 px = Tailwind's md breakpoint; blocks phones and portrait tablets. */
const MOBILE_BREAKPOINT_PX = 768;
const NARROW_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX}px)`;
/** "coarse" pointer = primary input is a touchscreen (finger), not a mouse. */
const COARSE_QUERY = "(pointer: coarse)";

/** Safe wrapper — returns false when window is unavailable (test/SSR environments). */
function safeMatchMedia(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

export function useDeviceDetection(): DeviceDetection {
  const [isNarrow, setIsNarrow] = useState(() => safeMatchMedia(NARROW_QUERY));
  const [isCoarse, setIsCoarse] = useState(() => safeMatchMedia(COARSE_QUERY));
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const narrowMql = window.matchMedia(NARROW_QUERY);
    const coarseMql = window.matchMedia(COARSE_QUERY);

    const handleNarrowChange = (e: MediaQueryListEvent): void => {
      setIsNarrow(e.matches);
    };
    const handleCoarseChange = (e: MediaQueryListEvent): void => {
      setIsCoarse(e.matches);
    };

    narrowMql.addEventListener("change", handleNarrowChange);
    coarseMql.addEventListener("change", handleCoarseChange);

    return () => {
      narrowMql.removeEventListener("change", handleNarrowChange);
      coarseMql.removeEventListener("change", handleCoarseChange);
    };
  }, []);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const isMobileDevice = isNarrow && isCoarse;

  return {
    isMobileDevice,
    isDismissed,
    dismiss,
    shouldShowMobileBlock: isMobileDevice && !isDismissed,
  };
}
