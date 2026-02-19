/**
 * useDeviceDetection - Detects mobile devices via viewport width + pointer type.
 *
 * Blocks narrow touch devices (phones, portrait tablets) while allowing:
 * - Desktop with narrow window (fine pointer → not blocked)
 * - Touch-enabled desktop/laptop (wide viewport → not blocked)
 * - Landscape tablets (wide enough → not blocked)
 */

import { useState, useEffect, useCallback } from "react";

interface DeviceDetection {
  isMobileDevice: boolean;
  isDismissed: boolean;
  dismiss: () => void;
  shouldShowMobileBlock: boolean;
}

const NARROW_QUERY = "(max-width: 768px)";
const COARSE_QUERY = "(pointer: coarse)";

export function useDeviceDetection(): DeviceDetection {
  const [isNarrow, setIsNarrow] = useState(
    () => window.matchMedia(NARROW_QUERY).matches
  );
  const [isCoarse, setIsCoarse] = useState(
    () => window.matchMedia(COARSE_QUERY).matches
  );
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
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
