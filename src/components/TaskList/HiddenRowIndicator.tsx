/**
 * HiddenRowIndicator - Excel-style double-line indicator for hidden rows.
 * Shows above or below a RowNumberCell when there are hidden rows adjacent to it.
 * On hover, reveals an unhide button to restore hidden rows.
 */

import { memo, useState } from "react";
import { CaretUpDown } from "@phosphor-icons/react";
import { useDensityConfig } from "@/store/slices/userPreferencesSlice";

// Density breakpoints for indicator height scaling
const COMPACT_ROW_HEIGHT = 28;
const NORMAL_ROW_HEIGHT = 36;
const INDICATOR_HEIGHT_COMPACT = 6;
const INDICATOR_HEIGHT_NORMAL = 8;
const INDICATOR_HEIGHT_COMFORTABLE = 10;

// Hover zone proportions (relative to row height)
const HOVER_ZONE_OFFSET_RATIO = 0.45;
const HOVER_ZONE_HEIGHT_RATIO = 0.9;

// Unhide button dimensions
const UNHIDE_BUTTON_WIDTH = 20;
const UNHIDE_HOVER_ZONE_EXTENSION = UNHIDE_BUTTON_WIDTH + 1; // extends past button by 1px for border overlap
const UNHIDE_ICON_SIZE = 20;
// 1px bleed so the double-line straddles the cell edge rather than sitting inside it
const INDICATOR_LINE_HALF_OVERLAP_PX = 1;

// Z-index layers for indicator elements
const INDICATOR_Z_INDEX = 40;
const HOVER_ZONE_Z_INDEX = 42;
const UNHIDE_BUTTON_Z_INDEX = 50;

/** Tracks which part of the unhide interaction zone the cursor is over */
type UnhideHoverState = "none" | "zone" | "button";

interface HiddenRowIndicatorProps {
  /** Number of hidden rows (for tooltip text) */
  hiddenCount?: number;
  /** Callback to unhide hidden rows */
  onUnhide?: () => void;
  /** Brand color for controls (only used when onUnhide is provided) */
  controlsColor?: string;
  /** Color for the double-line indicator */
  indicatorColor: string;
  /** Position relative to the row — "below" (default) or "above" */
  position?: "above" | "below";
}

/** Returns true when the element (or an ancestor) is part of the unhide interaction zone. */
function isWithinUnhideArea(element: HTMLElement | null): boolean {
  return !!element?.closest?.("[data-unhide-zone], [data-unhide-button]");
}

export const HiddenRowIndicator = memo(function HiddenRowIndicator({
  hiddenCount,
  onUnhide,
  controlsColor = "transparent",
  indicatorColor,
  position = "below",
}: HiddenRowIndicatorProps): JSX.Element {
  const { rowHeight } = useDensityConfig();
  const [unhideHoverState, setUnhideHoverState] =
    useState<UnhideHoverState>("none");
  const showUnhideButton = unhideHoverState !== "none";
  const isButtonHovered = unhideHoverState === "button";

  const indicatorHeight =
    rowHeight <= COMPACT_ROW_HEIGHT
      ? INDICATOR_HEIGHT_COMPACT
      : rowHeight <= NORMAL_ROW_HEIGHT
        ? INDICATOR_HEIGHT_NORMAL
        : INDICATOR_HEIGHT_COMFORTABLE;

  const isAbove = position === "above";

  // Position the double-line at the top or bottom edge of the cell
  const lineStyle = isAbove
    ? { top: `${-(indicatorHeight / 2 + INDICATOR_LINE_HALF_OVERLAP_PX)}px` }
    : {
        bottom: `${-(indicatorHeight / 2 + INDICATOR_LINE_HALF_OVERLAP_PX)}px`,
      };

  // Position the hover zone at the top or bottom edge
  const hoverZoneStyle = isAbove
    ? { top: `${-(rowHeight * HOVER_ZONE_OFFSET_RATIO)}px` }
    : { bottom: `${-(rowHeight * HOVER_ZONE_OFFSET_RATIO)}px` };

  return (
    <>
      {/* Double-line */}
      <div
        className="absolute left-0 right-0 pointer-events-none bg-white"
        style={{
          ...lineStyle,
          height: `${indicatorHeight}px`,
          borderTop: `1.5px solid ${indicatorColor}`,
          borderBottom: `1.5px solid ${indicatorColor}`,
          zIndex: INDICATOR_Z_INDEX,
        }}
      />
      {/* Hover zone — covers double-line area + extends right for button */}
      {onUnhide && (
        <div
          data-unhide-zone
          className="absolute"
          style={{
            left: 0,
            right: `-${UNHIDE_HOVER_ZONE_EXTENSION}px`,
            ...hoverZoneStyle,
            height: `${rowHeight * HOVER_ZONE_HEIGHT_RATIO}px`,
            zIndex: HOVER_ZONE_Z_INDEX,
          }}
          onMouseEnter={() => setUnhideHoverState("zone")}
          onMouseLeave={(e) => {
            if (!isWithinUnhideArea(e.relatedTarget as HTMLElement | null)) {
              setUnhideHoverState("none");
            }
          }}
        >
          {showUnhideButton && (
            <button
              type="button"
              data-unhide-button
              className="absolute flex items-center justify-center cursor-pointer rounded bg-white p-0"
              style={{
                right: 0,
                top: 0,
                bottom: 0,
                width: `${UNHIDE_BUTTON_WIDTH}px`,
                backgroundColor: isButtonHovered ? controlsColor : undefined,
                border: `1px solid ${controlsColor}`,
                zIndex: UNHIDE_BUTTON_Z_INDEX,
              }}
              title={`${hiddenCount ?? 0} hidden — click to unhide`}
              aria-label={`Unhide ${hiddenCount ?? 0} hidden rows`}
              onMouseEnter={() => setUnhideHoverState("button")}
              onMouseLeave={(e) => {
                if (isWithinUnhideArea(e.relatedTarget as HTMLElement | null)) {
                  setUnhideHoverState("zone");
                } else {
                  setUnhideHoverState("none");
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                onUnhide();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onUnhide();
                }
              }}
            >
              <CaretUpDown
                size={UNHIDE_ICON_SIZE}
                weight="fill"
                color={isButtonHovered ? "white" : controlsColor}
                aria-hidden
              />
            </button>
          )}
        </div>
      )}
    </>
  );
});
