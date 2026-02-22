/**
 * usePreventVerticalScroll - Prevents an element from scrolling vertically.
 *
 * Workaround for Chromium bug where focus() can scroll overflow containers
 * even with overflow-y: clip. See GitHub #16.
 */

import { useEffect, type RefObject } from "react";

export function usePreventVerticalScroll(
  ref: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const resetScroll = (): void => {
      if (el.scrollTop !== 0) el.scrollTop = 0;
    };
    el.addEventListener("scroll", resetScroll);
    return () => el.removeEventListener("scroll", resetScroll);
  }, [ref]);
}
