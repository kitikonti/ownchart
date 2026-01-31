/**
 * ZoomDropdown - MS Project-style zoom level combobox.
 * Extracted from Ribbon.tsx for modularity.
 */

import { CaretDown } from "@phosphor-icons/react";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownPanel } from "../Toolbar/DropdownPanel";

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

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-label="Zoom level"
      onClick={toggle}
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
              <button
                key={level}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(level);
                }}
                className={`dropdown-item${isSelected ? " dropdown-item-selected" : ""}`}
                style={{
                  display: "block",
                  width: "100%",
                  height: "32px",
                  minHeight: "32px",
                  padding: "0 16px",
                  color: "rgb(50, 49, 48)",
                  border: "1px solid transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: isSelected ? 600 : 400,
                  lineHeight: "20px",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                {level}%
              </button>
            );
          })}
          {/* Fit option */}
          <button
            type="button"
            role="option"
            aria-selected={false}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect("fit");
            }}
            className="dropdown-item"
            style={{
              display: "block",
              width: "100%",
              height: "32px",
              minHeight: "32px",
              padding: "0 16px",
              color: "rgb(50, 49, 48)",
              border: "1px solid transparent",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "20px",
              textAlign: "left",
              whiteSpace: "nowrap",
            }}
          >
            Fit
          </button>
        </DropdownPanel>
      )}
    </div>
  );
}
