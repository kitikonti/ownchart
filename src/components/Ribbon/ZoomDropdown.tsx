/**
 * ZoomDropdown - MS Project-style zoom level combobox.
 * Extracted from Ribbon.tsx for modularity.
 */

import type { MouseEvent } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { DropdownItem } from "../Toolbar/DropdownItem";

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
        width: "70px",
        height: "28px",
        borderRadius: "4px",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Text display */}
      <span
        style={{
          display: "inline-block",
          width: "46px",
          height: "26px",
          lineHeight: "26px",
          paddingLeft: "8px",
          color: "rgb(36, 36, 36)",
          fontSize: "14px",
          fontWeight: 400,
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
          width: "24px",
          height: "26px",
          backgroundColor: isOpen ? "rgb(235, 235, 235)" : "transparent",
          borderRadius: "0 3px 3px 0",
          cursor: "default",
        }}
      >
        <CaretDown
          size={12}
          weight="regular"
          style={{
            color: isOpen ? "rgb(37, 36, 35)" : "rgb(121, 119, 117)",
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
