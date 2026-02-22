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
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
} from "../../../styles/design-tokens";

// =============================================================================
// Constants
// =============================================================================

const POPOVER_WIDTH = 280;
const POPOVER_MAX_HEIGHT = 400;
const SWATCH_SIZE = 24;
const PREVIEW_SIZE = 40;
const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 4;

/** Swatch category definitions for DRY iteration */
const SWATCH_CATEGORIES: {
  key: keyof typeof CURATED_SWATCHES;
  label: string;
}[] = [
  { key: "blues", label: "Blues" },
  { key: "greens", label: "Greens" },
  { key: "warm", label: "Warm" },
  { key: "neutral", label: "Neutral" },
];

// =============================================================================
// Sub-components
// =============================================================================

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
        width: SWATCH_SIZE,
        height: SWATCH_SIZE,
        backgroundColor: color,
        border: isSelected
          ? `2px solid ${COLORS.brand[600]}`
          : "1px solid rgba(0, 0, 0, 0.15)",
        borderRadius: RADIUS.md,
        cursor: "pointer",
        padding: 0,
        transition: "transform 0.1s, box-shadow 0.1s",
        boxShadow: isSelected ? SHADOWS.focus : "none",
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
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.neutral[600],
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: SPACING[2],
        marginTop: SPACING[1],
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
  colors: readonly string[];
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

// =============================================================================
// Main component
// =============================================================================

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

  const projectColors = useProjectColors(8);

  // Show reset button when in auto mode and override is active
  const showResetButton =
    colorMode !== "manual" && hasOverride && onResetOverride;

  // Focus popover on mount for keyboard accessibility
  useEffect(() => {
    popoverRef.current?.focus();
  }, []);

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

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleColorSelect = (color: string): void => {
    setLocalColor(color);
    onSelect(color);
    onClose();
  };

  const handleNativePickerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const color = e.target.value;
    setLocalColor(color);
    onSelect(color);
  };

  const handleReset = (): void => {
    onResetOverride?.();
    onClose();
  };

  // Popover base style
  const popoverStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 10000,
    backgroundColor: COLORS.neutral[0],
    borderRadius: RADIUS.lg,
    boxShadow: SHADOWS.dropdown,
    padding: SPACING[4],
    width: POPOVER_WIDTH,
    maxHeight: POPOVER_MAX_HEIGHT,
    overflowY: "auto",
  };

  // Position relative to anchor with viewport-aware flipping
  if (anchorRect) {
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;

    if (
      spaceBelow < POPOVER_MAX_HEIGHT + ANCHOR_GAP &&
      spaceAbove > spaceBelow
    ) {
      popoverStyle.bottom = window.innerHeight - anchorRect.top + ANCHOR_GAP;
    } else {
      popoverStyle.top = anchorRect.bottom + ANCHOR_GAP;
    }

    popoverStyle.left = Math.min(
      Math.max(VIEWPORT_MARGIN, anchorRect.left),
      window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN
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
          marginBottom: SPACING[3],
        }}
      >
        <span
          style={{
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            fontSize: TYPOGRAPHY.fontSize.base,
          }}
        >
          Choose Color
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: SPACING[1],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: RADIUS.md,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.neutral[100];
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
          gap: SPACING[3],
          marginBottom: SPACING[4],
          padding: SPACING[2],
          backgroundColor: COLORS.neutral[50],
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            width: PREVIEW_SIZE,
            height: PREVIEW_SIZE,
            backgroundColor: localColor,
            borderRadius: "6px",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: getContrastTextColor(localColor),
            fontSize: "10px",
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
          }}
        >
          Aa
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              fontSize: TYPOGRAPHY.fontSize.sm,
            }}
          >
            {localColor.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.neutral[500],
            }}
          >
            {showResetButton ? "Manual override" : "Current color"}
          </div>
        </div>
        {showResetButton && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset to automatic color"
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING[1],
              padding: `${SPACING[1]} ${SPACING[2]}`,
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.brand[600],
              backgroundColor: COLORS.brand[50],
              border: `1px solid ${COLORS.brand[100]}`,
              borderRadius: RADIUS.md,
              cursor: "pointer",
              fontWeight: TYPOGRAPHY.fontWeight.medium,
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
        <div style={{ marginBottom: SPACING[4] }}>
          <SectionHeader>Project Colors</SectionHeader>
          <SwatchGrid
            colors={projectColors}
            selectedColor={localColor}
            onSelect={handleColorSelect}
          />
        </div>
      )}

      {/* Curated swatches */}
      {SWATCH_CATEGORIES.map(({ key, label }) => (
        <div key={key} style={{ marginBottom: SPACING[4] }}>
          <SectionHeader>{label}</SectionHeader>
          <SwatchGrid
            colors={CURATED_SWATCHES[key]}
            selectedColor={localColor}
            onSelect={handleColorSelect}
          />
        </div>
      ))}

      {/* Custom color picker */}
      <div
        style={{
          borderTop: `1px solid ${COLORS.neutral[200]}`,
          paddingTop: SPACING[3],
        }}
      >
        <SectionHeader>Custom Color</SectionHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SPACING[2],
          }}
        >
          <input
            ref={nativePickerRef}
            type="color"
            value={localColor}
            onChange={handleNativePickerChange}
            style={{
              width: "40px",
              height: "32px",
              border: `1px solid ${COLORS.neutral[200]}`,
              borderRadius: RADIUS.md,
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
              padding: `${SPACING[2]} ${SPACING[3]}`,
              backgroundColor: COLORS.neutral[50],
              border: `1px solid ${COLORS.neutral[200]}`,
              borderRadius: RADIUS.md,
              cursor: "pointer",
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.neutral[600],
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.neutral[100];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.neutral[50];
            }}
          >
            Choose custom color...
          </button>
        </div>
      </div>
    </div>
  );
}
