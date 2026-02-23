/**
 * ZoomDropdown - MS Project-style zoom level combobox.
 * Extracted from Ribbon.tsx for modularity.
 */

import type { MouseEvent } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { COLORS, TYPOGRAPHY, RADIUS } from "../../styles/design-tokens";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { DropdownItem } from "../Toolbar/DropdownItem";

/** Combobox layout constants (px) — pixel-precise Fluent UI fidelity */
const COMBOBOX_WIDTH = 70;
const COMBOBOX_HEIGHT = 28;
const TEXT_WIDTH = 46;
const TEXT_HEIGHT = 26;
const CHEVRON_WIDTH = 24;

interface ZoomDropdownProps {
  zoomPercentage: number;
  zoomOptions: number[];
  onSelectLevel: (level: number | "fit") => void;
}

export function ZoomDropdown({
  zoomPercentage,
  zoomOptions,
  onSelectLevel,
}: ZoomDropdownProps): JSX.Element {
  const { isOpen, toggle, close, containerRef } = useDropdown();

  const handleSelect = (level: number | "fit"): void => {
    onSelectLevel(level);
    close();
  };

  const handleContainerClick = (e: MouseEvent): void => {
    // Don't toggle when clicking inside the dropdown panel
    if ((e.target as HTMLElement).closest(".dropdown-panel")) return;
    toggle();
  };

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-label="Zoom level"
      onClick={handleContainerClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      className="zoom-combobox"
      style={{
        position: "relative",
        display: "block",
        width: `${COMBOBOX_WIDTH}px`,
        height: `${COMBOBOX_HEIGHT}px`,
        borderRadius: RADIUS.md,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Text display */}
      <span
        style={{
          display: "inline-block",
          width: `${TEXT_WIDTH}px`,
          height: `${TEXT_HEIGHT}px`,
          lineHeight: `${TEXT_HEIGHT}px`,
          paddingLeft: "8px",
          color: COLORS.neutral[800],
          fontSize: TYPOGRAPHY.fontSize.base,
          fontWeight: TYPOGRAPHY.fontWeight.normal,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {zoomPercentage}%
      </span>

      {/* Chevron button */}
      <span
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: `${CHEVRON_WIDTH}px`,
          height: `${TEXT_HEIGHT}px`,
          backgroundColor: isOpen ? COLORS.neutral[100] : "transparent",
          borderRadius: "0 3px 3px 0",
          cursor: "default",
        }}
      >
        <CaretDown
          size={12}
          weight="bold"
          style={{
            color: isOpen ? COLORS.neutral[800] : COLORS.neutral[600],
          }}
        />
      </span>

      {/* Dropdown Menu */}
      {isOpen && (
        <DropdownPanel
          role="listbox"
          aria-label="Zoom level"
          style={{ padding: 0 }}
        >
          {zoomOptions.map((level) => {
            const isSelected = level === zoomPercentage;
            return (
              <DropdownItem
                key={level}
                isSelected={isSelected}
                showCheckmark={false}
                onClick={() => handleSelect(level)}
              >
                {level}%
              </DropdownItem>
            );
          })}
          {/* Fit option */}
          <DropdownItem
            showCheckmark={false}
            onClick={() => handleSelect("fit")}
          >
            Fit
          </DropdownItem>
        </DropdownPanel>
      )}
    </div>
  );
}
