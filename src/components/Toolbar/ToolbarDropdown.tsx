/**
 * ToolbarDropdown - MS Word style dropdown for toolbar
 *
 * Features:
 * - Icon + text trigger button
 * - Hover state with light gray background
 * - Dropdown menu with checkmark for selected item
 * - Keyboard navigation support
 */

import { useState, useRef, useEffect, type ReactNode } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { TOOLBAR } from "../../styles/design-tokens";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

interface ToolbarDropdownProps<T extends string = string> {
  /** Currently selected value */
  value: T;
  /** Available options */
  options: DropdownOption<T>[];
  /** Called when selection changes */
  onChange: (value: T) => void;
  /** Optional icon to show before the label */
  icon?: ReactNode;
  /** Optional prefix for the displayed label (e.g., "Labels: ") */
  labelPrefix?: string;
  /** Accessible label */
  "aria-label"?: string;
  /** Tooltip */
  title?: string;
}

export function ToolbarDropdown<T extends string = string>({
  value,
  options,
  onChange,
  icon,
  labelPrefix = "",
  "aria-label": ariaLabel,
  title,
}: ToolbarDropdownProps<T>): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Only show the label prefix, not the selected value (MS Office style)
  const displayLabel = labelPrefix || "Select";

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return (): void => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: T): void => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={title}
        className="toolbar-dropdown-trigger"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          height: `${TOOLBAR.buttonHeight}px`,
          padding: "5px 6px",
          backgroundColor: isOpen ? "rgb(230, 230, 230)" : "transparent",
          color: "rgb(66, 66, 66)",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: 400,
          userSelect: "none",
          whiteSpace: "nowrap",
          transition: "background 0.1s cubic-bezier(0.33, 0, 0.67, 1)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = "rgb(243, 243, 243)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isOpen
            ? "rgb(230, 230, 230)"
            : "transparent";
        }}
      >
        {icon}
        <span>{displayLabel}</span>
        <CaretDown size={12} weight="bold" style={{ marginLeft: "2px" }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label={ariaLabel}
          className="toolbar-dropdown-menu"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "2px",
            backgroundColor: "#ffffff",
            borderRadius: "2px",
            boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 8px 0px",
            zIndex: 1000,
            minWidth: "100%",
            padding: "4px 0",
            overflow: "hidden",
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className="toolbar-dropdown-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  height: "32px",
                  padding: "0 15px 0 9px",
                  backgroundColor: "transparent",
                  color: "rgb(36, 36, 36)",
                  border: "none",
                  borderRadius: "0",
                  cursor: "pointer",
                  fontSize: "14px",
                  lineHeight: "32px",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgb(245, 245, 245)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {/* Checkmark space */}
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    marginRight: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <Check
                      size={16}
                      weight="bold"
                      style={{ color: "rgb(73, 130, 5)" }}
                    />
                  )}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
