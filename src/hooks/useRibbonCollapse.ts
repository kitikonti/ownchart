/**
 * useRibbonCollapse - Measures toolbar width and computes a collapse level.
 *
 * Strategy:
 * - Content div uses flex:1 + minWidth:0 so its clientWidth reflects available space
 * - Records naturalWidth at level 0 by measuring children bounding rects (not scrollWidth)
 * - Compares naturalWidth against clientWidth to detect overflow
 * - Resets naturalWidth when activeTab changes
 * - Uses hysteresis (20px) to prevent bouncing at boundaries
 */

import { useRef, useState, useEffect, useCallback } from "react";
import type { CollapseLevel } from "../components/Ribbon/RibbonCollapseContext";

/**
 * Maximum value of CollapseLevel — must equal THRESHOLDS.length and the
 * highest value in the CollapseLevel union type in RibbonCollapseContext.tsx.
 * Update all three together when adding collapse levels.
 */
const MAX_COLLAPSE_LEVEL = 5 as const;

/**
 * Overflow thresholds in px — collapse to level N when overflow >= THRESHOLDS[N-1].
 * IMPORTANT: THRESHOLDS.length must equal MAX_COLLAPSE_LEVEL.
 * If you add entries here, update MAX_COLLAPSE_LEVEL and the CollapseLevel union
 * type in RibbonCollapseContext.tsx accordingly.
 */
const THRESHOLDS: readonly number[] = [10, 80, 160, 240, 320];

// Development-time guard: THRESHOLDS.length must equal MAX_COLLAPSE_LEVEL.
// This will throw during development if someone adds a threshold without
// updating MAX_COLLAPSE_LEVEL (and the CollapseLevel union type).
if (import.meta.env.DEV && THRESHOLDS.length !== MAX_COLLAPSE_LEVEL) {
  throw new Error(
    `useRibbonCollapse: THRESHOLDS.length (${THRESHOLDS.length}) must equal MAX_COLLAPSE_LEVEL (${MAX_COLLAPSE_LEVEL}). ` +
      "Update both together along with the CollapseLevel union in RibbonCollapseContext.tsx."
  );
}

/** Hysteresis buffer: once at a level, require overflow to drop further before uncollapsing */
const HYSTERESIS_PX = 20;

export function useRibbonCollapse(activeTab: string): {
  collapseLevel: CollapseLevel;
  contentRef: React.RefObject<HTMLDivElement>;
} {
  // Cast required: React types useRef<T>(null) as MutableRefObject<T|null>,
  // but we never mutate this ref externally — RefObject is the correct API contract.
  const contentRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const naturalWidthRef = useRef<number>(0);
  const [collapseLevel, setCollapseLevel] = useState<CollapseLevel>(0);
  const collapseLevelRef = useRef<CollapseLevel>(0);

  // Reset natural width when tab changes
  useEffect(() => {
    naturalWidthRef.current = 0;
    setCollapseLevel(0);
    collapseLevelRef.current = 0;
  }, [activeTab]);

  const measure = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;

    // Capture natural content width at level 0 by measuring the span
    // from first child's left edge to last child's right edge.
    // This includes gaps and is independent of overflow/scrollWidth behavior.
    if (naturalWidthRef.current === 0 && collapseLevelRef.current === 0) {
      const children = Array.from(content.children) as HTMLElement[];
      if (children.length > 0) {
        const firstRect = children[0].getBoundingClientRect();
        const lastRect = children[children.length - 1].getBoundingClientRect();
        naturalWidthRef.current = lastRect.right - firstRect.left;
      }
    }

    const naturalWidth = naturalWidthRef.current;
    if (naturalWidth === 0) return;

    // Measure available space from the toolbar container (parent of content div).
    // The toolbar has fixed width and padding — its inner area is the usable space.
    const toolbar = content.parentElement;
    if (!toolbar) return;
    const style = getComputedStyle(toolbar);
    const available =
      toolbar.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const overflow = naturalWidth - available;
    const currentLevel = collapseLevelRef.current;

    // Determine new level: check from highest (5) down to 1.
    // Level 0 is the default when no threshold is met.
    // Hysteresis: if already at or above a level, require less overflow to STAY.
    let newLevel: CollapseLevel = 0;
    for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
      let threshold = THRESHOLDS[i];
      // If we're already at or above this level, lower the bar to stay
      if (i + 1 <= currentLevel) {
        threshold -= HYSTERESIS_PX;
      }
      if (overflow >= threshold) {
        // Clamp to the valid CollapseLevel range (0–MAX_COLLAPSE_LEVEL) in case THRESHOLDS grows
        newLevel = Math.min(i + 1, MAX_COLLAPSE_LEVEL) as CollapseLevel;
        break;
      }
    }

    if (newLevel !== currentLevel) {
      collapseLevelRef.current = newLevel;
      setCollapseLevel(newLevel);
    }
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    const toolbar = content?.parentElement;
    if (!content || !toolbar) return;

    // Initial measurement after render
    let rafHandle = requestAnimationFrame(measure);

    // Observe the toolbar (parent) — its width changes when the window resizes
    const observer = new ResizeObserver(() => {
      rafHandle = requestAnimationFrame(measure);
    });

    observer.observe(toolbar);

    return () => {
      cancelAnimationFrame(rafHandle);
      observer.disconnect();
    };
  }, [measure, activeTab]);

  return { collapseLevel, contentRef };
}
