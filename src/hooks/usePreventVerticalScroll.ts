/**
 * usePreventVerticalScroll - Prevents an element from scrolling vertically.
 *
 * Workaround for Chromium bug where focus() can scroll overflow containers
 * even with overflow-y: clip. See GitHub #16.
 */

import { useEffect } from "react";
import type { RefObject } from "react";

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
    // { passive: true } cannot be used — this handler writes el.scrollTop to
    // reset vertical scroll. In passive mode the browser may silently ignore
    // DOM property writes that occur during the scroll event, so the reset
    // would have no effect.
    el.addEventListener("scroll", resetScroll);
    return (): void => {
      el.removeEventListener("scroll", resetScroll);
    };
  }, [ref]);
}
