/**
 * ColorModeDropdown - Smart Color Management mode selector
 *
 * MS Office Ribbon-style dropdown for selecting color mode:
 * - Manual: Per-task control
 * - Theme: One-click palette themes
 * - Summary: Children inherit parent color
 * - Task Type: Summary/Task/Milestone each get fixed color
 * - Hierarchy: Darker→lighter based on depth
 */

import { useState, useRef, useEffect } from "react";
import { CaretDown, Check, Palette } from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import type { ColorMode } from "../../types/colorMode.types";
import { TOOLBAR } from "../../styles/design-tokens";

interface ColorModeOption {
  value: ColorMode;
  label: string;
  description: string;
}

const COLOR_MODE_OPTIONS: ColorModeOption[] = [
  {
    value: "manual",
    label: "Manual",
    description: "Per-task color control",
  },
  {
    value: "theme",
    label: "Theme",
    description: "One-click palette themes",
  },
  {
    value: "summary",
    label: "Summary Group",
    description: "Children inherit parent color",
  },
  {
    value: "taskType",
    label: "Task Type",
    description: "Color by Summary/Task/Milestone",
  },
  {
    value: "hierarchy",
    label: "Hierarchy",
    description: "Darker→lighter by depth",
  },
];

export function ColorModeDropdown(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const colorModeState = useChartStore((state) => state.colorModeState);
  const setColorMode = useChartStore((state) => state.setColorMode);

  const currentMode = colorModeState.mode;
  const currentOption = COLOR_MODE_OPTIONS.find((o) => o.value === currentMode);

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

  const handleSelect = (mode: ColorMode): void => {
    setColorMode(mode);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Color Mode"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Select color mode"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          height: `${TOOLBAR.buttonHeight}px`,
          padding: "5px 8px",
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
        <Palette size={18} weight="light" />
        <span>{currentOption?.label || "Color"}</span>
        <CaretDown size={12} weight="bold" style={{ marginLeft: "2px" }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Color mode"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "2px",
            backgroundColor: "#ffffff",
            borderRadius: "4px",
            boxShadow:
              "0 0 2px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.14)",
            zIndex: 1000,
            minWidth: "200px",
            padding: "4px 0",
            overflow: "hidden",
          }}
        >
          {COLOR_MODE_OPTIONS.map((option) => {
            const isSelected = option.value === currentMode;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  minHeight: "36px",
                  padding: "6px 12px 6px 8px",
                  backgroundColor: "transparent",
                  color: "rgb(36, 36, 36)",
                  border: "none",
                  borderRadius: "0",
                  cursor: "pointer",
                  fontSize: "14px",
                  textAlign: "left",
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
                    marginRight: "8px",
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: isSelected ? 600 : 400 }}>
                    {option.label}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgb(120, 120, 120)",
                      marginTop: "1px",
                    }}
                  >
                    {option.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
