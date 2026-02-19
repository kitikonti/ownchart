/**
 * ColorPickerPopover - Enhanced color picker with swatches
 *
 * Features:
 * - Project colors (colors already used in current project)
 * - Curated color swatches by category
 * - Native color picker for custom colors
 * - Reset-to-automatic button when colorOverride is active
 * - Click-outside to close
 * - Keyboard navigation (Escape to close)
 */

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { X, ArrowCounterClockwise } from "@phosphor-icons/react";
import {
  useProjectColors,
  CURATED_SWATCHES,
} from "../../../hooks/useProjectColors";
import { getContrastTextColor } from "../../../utils/colorUtils";
import type { ColorMode } from "../../../types/colorMode.types";
import { COLORS } from "../../../styles/design-tokens";

interface ColorPickerPopoverProps {
  /** Current color value (hex) */
  value: string;
  /** Called when a color is selected */
  onSelect: (color: string) => void;
  /** Called when the popover should close */
  onClose: () => void;
  /** Position of the popover trigger element */
  anchorRect?: DOMRect;
  /** Current color mode (for showing reset button) */
  colorMode?: ColorMode;
  /** Whether task has a colorOverride */
  hasOverride?: boolean;
  /** Called to reset colorOverride */
  onResetOverride?: () => void;
}

/**
 * Color swatch button
 */
function ColorSwatch({
  color,
  isSelected,
  onClick,
}: {
  color: string;
  isSelected: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      style={{
        width: "24px",
        height: "24px",
        backgroundColor: color,
        border: isSelected
          ? `2px solid ${COLORS.brand[600]}`
          : "1px solid rgba(0, 0, 0, 0.15)",
        borderRadius: "4px",
        cursor: "pointer",
        padding: 0,
        transition: "transform 0.1s, box-shadow 0.1s",
        boxShadow: isSelected ? "0 0 0 2px rgba(15, 108, 189, 0.3)" : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    />
  );
}

/**
 * Section header with subtle styling
 */
function SectionHeader({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: "rgb(100, 100, 100)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "8px",
        marginTop: "4px",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Swatch grid component
 */
function SwatchGrid({
  colors,
  selectedColor,
  onSelect,
}: {
  colors: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
}): JSX.Element {
  const normalizedSelected = selectedColor.toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
      }}
    >
      {colors.map((color) => (
        <ColorSwatch
          key={color}
          color={color}
          isSelected={color.toUpperCase() === normalizedSelected}
          onClick={() => onSelect(color)}
        />
      ))}
    </div>
  );
}

export function ColorPickerPopover({
  value,
  onSelect,
  onClose,
  anchorRect,
  colorMode = "manual",
  hasOverride = false,
  onResetOverride,
}: ColorPickerPopoverProps): JSX.Element {
  const [localColor, setLocalColor] = useState(value);
  const popoverRef = useRef<HTMLDivElement>(null);
  const nativePickerRef = useRef<HTMLInputElement>(null);

  // Get project colors
  const projectColors = useProjectColors(8);

  // Show reset button when in auto mode and override is active
  const showResetButton =
    colorMode !== "manual" && hasOverride && onResetOverride;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return (): void => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Handle keyboard
  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Handle color selection
  const handleColorSelect = (color: string): void => {
    setLocalColor(color);
    onSelect(color);
    onClose();
  };

  // Handle native picker change
  const handleNativePickerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const color = e.target.value;
    setLocalColor(color);
    onSelect(color);
  };

  // Handle reset to automatic
  const handleReset = (): void => {
    onResetOverride?.();
    onClose();
  };

  // Calculate popover position
  const popoverStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 10000,
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)",
    padding: "16px",
    width: "280px",
    maxHeight: "400px",
    overflowY: "auto",
  };

  // Position relative to anchor with viewport-aware flipping
  if (anchorRect) {
    const popoverHeight = 400; // matches maxHeight
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    const gap = 4;

    // Flip upward if not enough space below but enough above
    if (spaceBelow < popoverHeight + gap && spaceAbove > spaceBelow) {
      popoverStyle.bottom = window.innerHeight - anchorRect.top + gap;
    } else {
      popoverStyle.top = anchorRect.bottom + gap;
    }

    // Horizontal: keep within viewport
    const popoverWidth = 280; // matches width
    popoverStyle.left = Math.min(
      Math.max(8, anchorRect.left),
      window.innerWidth - popoverWidth - 8
    );
  } else {
    popoverStyle.top = "50%";
    popoverStyle.left = "50%";
    popoverStyle.transform = "translate(-50%, -50%)";
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- dialog needs keyboard handling for Escape
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Color picker"
      style={popoverStyle}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "14px" }}>Choose Color</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgb(240, 240, 240)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      {/* Current color preview */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
          padding: "8px",
          backgroundColor: "rgb(248, 248, 248)",
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: localColor,
            borderRadius: "6px",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: getContrastTextColor(localColor),
            fontSize: "10px",
            fontWeight: 600,
          }}
        >
          Aa
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: "13px" }}>
            {localColor.toUpperCase()}
          </div>
          <div style={{ fontSize: "11px", color: "rgb(120, 120, 120)" }}>
            {showResetButton ? "Manual override" : "Current color"}
          </div>
        </div>
        {/* Reset to automatic button */}
        {showResetButton && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset to automatic color"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              fontSize: "11px",
              color: "rgb(15, 108, 189)",
              backgroundColor: "rgb(235, 245, 255)",
              border: "1px solid rgb(190, 220, 250)",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            <ArrowCounterClockwise size={12} weight="bold" />
            Reset
          </button>
        )}
      </div>

      {/* Project colors (if any) */}
      {projectColors.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <SectionHeader>Project Colors</SectionHeader>
          <SwatchGrid
            colors={projectColors}
            selectedColor={localColor}
            onSelect={handleColorSelect}
          />
        </div>
      )}

      {/* Curated swatches */}
      <div style={{ marginBottom: "16px" }}>
        <SectionHeader>Blues</SectionHeader>
        <SwatchGrid
          colors={[...CURATED_SWATCHES.blues]}
          selectedColor={localColor}
          onSelect={handleColorSelect}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <SectionHeader>Greens</SectionHeader>
        <SwatchGrid
          colors={[...CURATED_SWATCHES.greens]}
          selectedColor={localColor}
          onSelect={handleColorSelect}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <SectionHeader>Warm</SectionHeader>
        <SwatchGrid
          colors={[...CURATED_SWATCHES.warm]}
          selectedColor={localColor}
          onSelect={handleColorSelect}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <SectionHeader>Neutral</SectionHeader>
        <SwatchGrid
          colors={[...CURATED_SWATCHES.neutral]}
          selectedColor={localColor}
          onSelect={handleColorSelect}
        />
      </div>

      {/* Custom color picker */}
      <div
        style={{
          borderTop: "1px solid rgb(230, 230, 230)",
          paddingTop: "12px",
        }}
      >
        <SectionHeader>Custom Color</SectionHeader>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            ref={nativePickerRef}
            type="color"
            value={localColor}
            onChange={handleNativePickerChange}
            style={{
              width: "40px",
              height: "32px",
              border: "1px solid rgb(200, 200, 200)",
              borderRadius: "4px",
              cursor: "pointer",
              padding: "2px",
            }}
            title="Pick custom color"
          />
          <button
            type="button"
            onClick={() => nativePickerRef.current?.click()}
            style={{
              flex: 1,
              padding: "8px 12px",
              backgroundColor: "rgb(248, 248, 248)",
              border: "1px solid rgb(220, 220, 220)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              color: "rgb(80, 80, 80)",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgb(240, 240, 240)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgb(248, 248, 248)";
            }}
          >
            Choose custom color...
          </button>
        </div>
      </div>
    </div>
  );
}
