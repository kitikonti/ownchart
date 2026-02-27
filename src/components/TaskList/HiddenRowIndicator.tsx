/**
 * HiddenRowIndicator - Excel-style double-line indicator for hidden rows.
 * Shows above or below a RowNumberCell when there are hidden rows adjacent to it.
 * On hover, reveals an unhide button to restore hidden rows.
 */

import { useState } from "react";
import { CaretUpDown } from "@phosphor-icons/react";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";

// Density breakpoints for indicator height scaling
const COMPACT_ROW_HEIGHT = 28;
const NORMAL_ROW_HEIGHT = 36;
const INDICATOR_HEIGHT_COMPACT = 6;
const INDICATOR_HEIGHT_NORMAL = 8;
const INDICATOR_HEIGHT_COMFORTABLE = 10;

// Hover zone proportions (relative to row height)
const HOVER_ZONE_OFFSET_RATIO = 0.45;
const HOVER_ZONE_HEIGHT_RATIO = 0.9;

interface HiddenRowIndicatorProps {
  /** Number of hidden rows (for tooltip text) */
  hiddenCount?: number;
  /** Callback to unhide hidden rows */
  onUnhide?: () => void;
  /** Brand color for controls */
  controlsColor: string;
  /** Color for the double-line indicator */
  indicatorColor: string;
  /** Position relative to the row — "below" (default) or "above" */
  position?: "above" | "below";
}

export function HiddenRowIndicator({
  hiddenCount,
  onUnhide,
  controlsColor,
  indicatorColor,
  position = "below",
}: HiddenRowIndicatorProps): JSX.Element {
  const { rowHeight } = useDensityConfig();
  const [showUnhideButton, setShowUnhideButton] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const indicatorHeight =
    rowHeight <= COMPACT_ROW_HEIGHT
      ? INDICATOR_HEIGHT_COMPACT
      : rowHeight <= NORMAL_ROW_HEIGHT
        ? INDICATOR_HEIGHT_NORMAL
        : INDICATOR_HEIGHT_COMFORTABLE;

  const isAbove = position === "above";

  // Position the double-line at the top or bottom edge of the cell
  const lineStyle = isAbove
    ? { top: `${-(indicatorHeight / 2 + 1)}px` }
    : { bottom: `${-(indicatorHeight / 2 + 1)}px` };

  // Position the hover zone at the top or bottom edge
  const hoverZoneStyle = isAbove
    ? { top: `${-(rowHeight * HOVER_ZONE_OFFSET_RATIO)}px` }
    : { bottom: `${-(rowHeight * HOVER_ZONE_OFFSET_RATIO)}px` };

  return (
    <>
      {/* Double-line */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          ...lineStyle,
          height: `${indicatorHeight}px`,
          backgroundColor: "white",
          borderTop: `1.5px solid ${indicatorColor}`,
          borderBottom: `1.5px solid ${indicatorColor}`,
          zIndex: 40,
        }}
      />
      {/* Hover zone — covers double-line area + extends right for button */}
      {onUnhide && (
        <div
          data-unhide-zone
          className="absolute"
          style={{
            left: 0,
            right: "-21px",
            ...hoverZoneStyle,
            height: `${rowHeight * HOVER_ZONE_HEIGHT_RATIO}px`,
            zIndex: 42,
          }}
          onMouseEnter={() => setShowUnhideButton(true)}
          onMouseLeave={(e) => {
            const related = e.relatedTarget as HTMLElement | null;
            if (related?.closest?.("[data-unhide-zone], [data-unhide-button]"))
              return;
            setShowUnhideButton(false);
            setIsButtonHovered(false);
          }}
        >
          {showUnhideButton && (
            <div
              data-unhide-button
              className="absolute flex items-center justify-center"
              style={{
                right: 0,
                top: 0,
                bottom: 0,
                width: "20px",
                backgroundColor: isButtonHovered ? controlsColor : "white",
                border: `1px solid ${controlsColor}`,
                borderRadius: "3px",
                cursor: "pointer",
                zIndex: 50,
              }}
              role="button"
              tabIndex={0}
              title={`${hiddenCount ?? 0} hidden — click to unhide`}
              aria-label={`Unhide ${hiddenCount ?? 0} hidden rows`}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={(e) => {
                setIsButtonHovered(false);
                const related = e.relatedTarget as HTMLElement | null;
                if (
                  related?.closest?.("[data-unhide-zone], [data-unhide-button]")
                )
                  return;
                setShowUnhideButton(false);
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
                size={20}
                weight="fill"
                color={isButtonHovered ? "white" : controlsColor}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
