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
  // The effect depends on the ref objects (not their .current values), so it
  // only runs once on mount. This is intentional: the DOM elements attached to
  // these refs are expected to remain stable for the component lifetime. If the
  // underlying element is ever replaced (e.g. conditional rendering swaps the
  // node), a new hook instance is required to re-attach the listeners.
  useEffect(() => {
    const elA = refA.current;
    const elB = refB.current;

    if (!elA || !elB) return;

    // Guard flag prevents a scroll feedback loop: when we programmatically set
    // scrollLeft on one element, some browsers fire a scroll event on it, which
    // would then update the other element again in an infinite cycle.
    //
    // The flag is reset inside a requestAnimationFrame so that any echoed scroll
    // event (which fires before the next animation frame in Chromium) is still
    // seen as a sync operation and discarded. Resetting synchronously would allow
    // the echoed event to slip through before the flag is cleared.
    let isSyncing = false;
    let rafId = 0;

    const syncAtoB = (): void => {
      if (isSyncing) return;
      isSyncing = true;
      elB.scrollLeft = elA.scrollLeft;
      rafId = requestAnimationFrame(() => {
        isSyncing = false;
      });
    };
    const syncBtoA = (): void => {
      if (isSyncing) return;
      isSyncing = true;
      elA.scrollLeft = elB.scrollLeft;
      rafId = requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    elA.addEventListener("scroll", syncAtoB);
    elB.addEventListener("scroll", syncBtoA);

    return (): void => {
      elA.removeEventListener("scroll", syncAtoB);
      elB.removeEventListener("scroll", syncBtoA);
      cancelAnimationFrame(rafId);
    };
  }, [refA, refB]);
}
