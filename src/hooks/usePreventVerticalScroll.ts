/**
 * usePreventVerticalScroll - Prevents an element from scrolling vertically.
 *
 * Workaround for Chromium bug where focus() can scroll overflow containers
 * even with overflow-y: clip. See GitHub #16.
 */

import { useEffect, type RefObject } from "react";

/**
 * Attaches a scroll listener that resets scrollTop to 0 whenever the element
 * scrolls vertically. Workaround for Chromium bug (GitHub #16) where
 * `focus()` can trigger vertical scrolling on overflow-clipped containers.
 */
export function usePreventVerticalScroll(
  ref: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const resetScroll = (): void => {
      if (el.scrollTop !== 0) el.scrollTop = 0;
    };
    // Cannot use { passive: true } — handler writes scrollTop to reset
    // vertical scroll, which is incompatible with passive event listeners.
    el.addEventListener("scroll", resetScroll);
    return (): void => {
      el.removeEventListener("scroll", resetScroll);
    };
  }, [ref]);
}
