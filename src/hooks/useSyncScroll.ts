/**
 * useSyncScroll - Bidirectional horizontal scroll synchronization between two elements.
 *
 * When either element scrolls horizontally, the other element's scrollLeft
 * is updated to match. Used for keeping headers in sync with their content areas.
 */

import { useEffect, type RefObject } from "react";

export function useSyncScroll(
  refA: RefObject<HTMLDivElement | null>,
  refB: RefObject<HTMLDivElement | null>
): void {
  useEffect(() => {
    const elA = refA.current;
    const elB = refB.current;

    if (!elA || !elB) return;

    const syncAtoB = (): void => {
      elB.scrollLeft = elA.scrollLeft;
    };
    const syncBtoA = (): void => {
      elA.scrollLeft = elB.scrollLeft;
    };

    elA.addEventListener("scroll", syncAtoB);
    elB.addEventListener("scroll", syncBtoA);

    return (): void => {
      elA.removeEventListener("scroll", syncAtoB);
      elB.removeEventListener("scroll", syncBtoA);
    };
  }, [refA, refB]);
}
