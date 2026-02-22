/**
 * ColorPickerPopover - Enhanced color picker with swatches
 *
 * Features:
 * - Project colors (colors already used in current project)
 * - Curated color swatches by category
 * - Native color picker for custom colors
 * - Reset-to-automatic button when colorOverride is active
 * - Click-outside to close
 * - Keyboard navigation (Escape to close, focus-trapped Tab)
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
  Z_INDEX,
} from "../../../styles/design-tokens";

// =============================================================================
// Constants
// =============================================================================

const POPOVER_WIDTH = 280;
const POPOVER_MAX_HEIGHT = 400;
const SWATCH_SIZE = 24;
const SWATCH_GAP = 6;
const PREVIEW_SIZE = 40;
const NATIVE_PICKER_WIDTH = 40;
const NATIVE_PICKER_HEIGHT = 32;
const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 4;

/** Selector for elements that can receive focus inside the popover */
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Border style for unselected swatches */
const SWATCH_BORDER = `1px solid ${COLORS.neutral[200]}`;

/** Border style for the selected swatch */
const SWATCH_BORDER_SELECTED = `2px solid ${COLORS.brand[600]}`;

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
      className="transition-transform duration-100 hover:scale-110"
      onClick={onClick}
      title={color}
      aria-label={`Select color ${color}`}
      style={{
        width: SWATCH_SIZE,
        height: SWATCH_SIZE,
        backgroundColor: color,
        border: isSelected ? SWATCH_BORDER_SELECTED : SWATCH_BORDER,
        borderRadius: RADIUS.md,
        cursor: "pointer",
        padding: 0,
        boxShadow: isSelected ? SHADOWS.focus : "none",
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
        letterSpacing: TYPOGRAPHY.letterSpacing.wide,
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
        gap: SWATCH_GAP,
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

/**
 * Current color preview with optional reset button
 */
function ColorPreview({
  color,
  showResetButton,
  onReset,
}: {
  color: string;
  showResetButton: boolean;
  onReset: () => void;
}): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: SPACING[3],
        marginBottom: SPACING[4],
        padding: SPACING[2],
        backgroundColor: COLORS.neutral[50],
        borderRadius: RADIUS.lg,
      }}
    >
      <div
        style={{
          width: PREVIEW_SIZE,
          height: PREVIEW_SIZE,
          backgroundColor: color,
          borderRadius: RADIUS.lg,
          border: SWATCH_BORDER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: getContrastTextColor(color),
          fontSize: TYPOGRAPHY.fontSize.xs,
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
          {color.toUpperCase()}
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
          onClick={onReset}
          title="Reset to automatic color"
          aria-label="Reset to automatic color"
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
  );
}

/**
 * Custom color picker section with native input and trigger button
 */
function CustomColorSection({
  color,
  onChange,
}: {
  color: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}): JSX.Element {
  const nativePickerRef = useRef<HTMLInputElement>(null);

  return (
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
          value={color}
          onChange={onChange}
          aria-label="Pick custom color"
          style={{
            width: NATIVE_PICKER_WIDTH,
            height: NATIVE_PICKER_HEIGHT,
            border: SWATCH_BORDER,
            borderRadius: RADIUS.md,
            cursor: "pointer",
            padding: SPACING[0.5],
          }}
          title="Pick custom color"
        />
        <button
          type="button"
          className="hover:bg-neutral-100"
          onClick={() => nativePickerRef.current?.click()}
          style={{
            flex: 1,
            padding: `${SPACING[2]} ${SPACING[3]}`,
            border: SWATCH_BORDER,
            borderRadius: RADIUS.md,
            cursor: "pointer",
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.neutral[600],
            textAlign: "left",
            backgroundColor: COLORS.neutral[50],
          }}
        >
          Choose custom color...
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Positioning
// =============================================================================

/** Compute popover style with viewport-aware anchor positioning */
function computePopoverStyle(anchorRect?: DOMRect): React.CSSProperties {
  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: Z_INDEX.popover,
    backgroundColor: COLORS.neutral[0],
    borderRadius: RADIUS.lg,
    boxShadow: SHADOWS.dropdown,
    padding: SPACING[4],
    width: POPOVER_WIDTH,
    maxHeight: POPOVER_MAX_HEIGHT,
    overflowY: "auto",
  };

  if (!anchorRect) {
    return {
      ...style,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const spaceAbove = anchorRect.top;

  if (
    spaceBelow < POPOVER_MAX_HEIGHT + ANCHOR_GAP &&
    spaceAbove > spaceBelow
  ) {
    style.bottom = window.innerHeight - anchorRect.top + ANCHOR_GAP;
  } else {
    style.top = anchorRect.bottom + ANCHOR_GAP;
  }

  style.left = Math.min(
    Math.max(VIEWPORT_MARGIN, anchorRect.left),
    window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN
  );

  return style;
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

  const projectColors = useProjectColors(8);

  // Show reset button when in auto mode and override is active
  const showResetButton =
    colorMode !== "manual" && hasOverride && !!onResetOverride;

  // Focus popover on mount for keyboard accessibility
  useEffect(() => {
    popoverRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        popoverRef.current &&
        e.target instanceof Node &&
        !popoverRef.current.contains(e.target)
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
      return;
    }

    // Focus trapping: keep Tab/Shift+Tab within the popover
    if (e.key === "Tab") {
      const focusable =
        popoverRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (
          document.activeElement === first ||
          document.activeElement === popoverRef.current
        ) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
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

  const popoverStyle = computePopoverStyle(anchorRect);

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- dialog needs keyboard handling for Escape and focus trapping
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
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
          className="hover:bg-neutral-100"
          style={{
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            padding: SPACING[1],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: RADIUS.md,
          }}
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      {/* Current color preview */}
      <ColorPreview
        color={localColor}
        showResetButton={showResetButton}
        onReset={handleReset}
      />

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
      <CustomColorSection
        color={localColor}
        onChange={handleNativePickerChange}
      />
    </div>
  );
}
