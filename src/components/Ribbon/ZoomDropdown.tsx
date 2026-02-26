/**
 * ZoomDropdown - MS Project-style zoom level combobox.
 * Extracted from Ribbon.tsx for modularity.
 */

import { useCallback, type CSSProperties, type MouseEvent } from "react";
import { CaretDown } from "@phosphor-icons/react";
import {
  COLORS,
  TYPOGRAPHY,
  RADIUS,
  SPACING,
} from "../../styles/design-tokens";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { DropdownItem } from "../Toolbar/DropdownItem";

/** Combobox layout constants (px) — pixel-precise Fluent UI fidelity */
const COMBOBOX_WIDTH = 70;
const COMBOBOX_HEIGHT = 28;
const TEXT_WIDTH = 46;
const TEXT_HEIGHT = 26;
const CHEVRON_WIDTH = 24;

const comboboxStyle: CSSProperties = {
  position: "relative",
  display: "block",
  width: `${COMBOBOX_WIDTH}px`,
  height: `${COMBOBOX_HEIGHT}px`,
  borderRadius: RADIUS.md,
  cursor: "pointer",
  userSelect: "none",
};

const textStyle: CSSProperties = {
  display: "inline-block",
  width: `${TEXT_WIDTH}px`,
  height: `${TEXT_HEIGHT}px`,
  lineHeight: `${TEXT_HEIGHT}px`,
  paddingLeft: SPACING[2],
  color: COLORS.neutral[800],
  fontSize: TYPOGRAPHY.fontSize.base,
  fontWeight: TYPOGRAPHY.fontWeight.normal,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const chevronBaseStyle: CSSProperties = {
  position: "absolute",
  top: "0",
  right: "0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: `${CHEVRON_WIDTH}px`,
  height: `${TEXT_HEIGHT}px`,
  borderRadius: `0 ${RADIUS.md} ${RADIUS.md} 0`,
  cursor: "default",
};

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
  const { isOpen, toggle, close, containerRef, triggerRef } = useDropdown();

  // Container IS the trigger — combine both refs
  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
        el;
      triggerRef(el);
    },
    [containerRef, triggerRef]
  );

  const handleSelect = (level: number | "fit"): void => {
    onSelectLevel(level);
    close(true);
  };

  const handleContainerClick = (e: MouseEvent): void => {
    // Don't toggle when clicking inside the dropdown panel
    if ((e.target as HTMLElement).closest("[data-dropdown-panel]")) return;
    toggle();
  };

  const chevronStyle: CSSProperties = {
    ...chevronBaseStyle,
    backgroundColor: isOpen ? COLORS.neutral[100] : "transparent",
  };

  return (
    <div
      ref={combinedRef}
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
      style={comboboxStyle}
    >
      {/* Text display */}
      <span style={textStyle}>{zoomPercentage}%</span>

      {/* Chevron button */}
      <span style={chevronStyle}>
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
                role="option"
              >
                {level}%
              </DropdownItem>
            );
          })}
          {/* Fit option */}
          <DropdownItem
            showCheckmark={false}
            onClick={() => handleSelect("fit")}
            role="option"
          >
            Fit
          </DropdownItem>
        </DropdownPanel>
      )}
    </div>
  );
}
