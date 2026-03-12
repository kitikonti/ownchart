/**
 * FitToWidthSelector - Preset and custom pixel-width selector for PNG/SVG exports.
 * Offers common screen/print sizes and a free-form custom pixel input.
 */

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_FIT_TO_WIDTH_PX,
  UHD_SCREEN_WIDTH_PX,
} from "../../utils/export/types";
import { Input } from "../common/Input";
import { Select } from "../common/Select";

export const MIN_FIT_WIDTH_PX = 100;
export const MAX_FIT_WIDTH_PX = 20000;

/** HD (1080p) screen width in pixels — matches DEFAULT_FIT_TO_WIDTH_PX. */
const HD_SCREEN_WIDTH_PX = DEFAULT_FIT_TO_WIDTH_PX; // 1920

// Print pixel widths at 150 DPI for common paper sizes in landscape orientation.
// Formula: paper width in inches × 150 DPI.
// A4 landscape: 11.69 in × 150 = 1754 px
// A3 landscape: 16.54 in × 150 = 2480 px (rounded)
// Letter landscape: 11.00 in × 150 = 1650 px
const A4_LANDSCAPE_150DPI_PX = 1754;
const A3_LANDSCAPE_150DPI_PX = 2480;
const LETTER_LANDSCAPE_150DPI_PX = 1650;

interface FitToWidthPreset {
  label: string;
  value: number;
}

const FIT_TO_WIDTH_GROUPS = {
  screenSizes: {
    label: "Screen Sizes",
    presets: [
      {
        label: `HD Screen (${HD_SCREEN_WIDTH_PX}px)`,
        value: HD_SCREEN_WIDTH_PX,
      },
      {
        label: `4K Screen (${UHD_SCREEN_WIDTH_PX}px)`,
        value: UHD_SCREEN_WIDTH_PX,
      },
    ] as FitToWidthPreset[],
  },
  print150dpi: {
    label: "Print @ 150 DPI",
    presets: [
      {
        label: `A4 Landscape (${A4_LANDSCAPE_150DPI_PX}px)`,
        value: A4_LANDSCAPE_150DPI_PX,
      },
      {
        label: `A3 Landscape (${A3_LANDSCAPE_150DPI_PX}px)`,
        value: A3_LANDSCAPE_150DPI_PX,
      },
      {
        label: `Letter Landscape (${LETTER_LANDSCAPE_150DPI_PX}px)`,
        value: LETTER_LANDSCAPE_150DPI_PX,
      },
    ] as FitToWidthPreset[],
  },
};

const ALL_PRESET_VALUES = [
  ...FIT_TO_WIDTH_GROUPS.screenSizes.presets,
  ...FIT_TO_WIDTH_GROUPS.print150dpi.presets,
].map((p) => p.value);

/**
 * Parse a raw string input into a clamped pixel width.
 * Falls back to DEFAULT_FIT_TO_WIDTH_PX when the input is not a valid integer.
 */
function clampFitToWidth(rawInput: string): number {
  const parsed = parseInt(rawInput, 10);
  const value = Number.isNaN(parsed) ? DEFAULT_FIT_TO_WIDTH_PX : parsed;
  return Math.max(MIN_FIT_WIDTH_PX, Math.min(MAX_FIT_WIDTH_PX, value));
}

export interface FitToWidthSelectorProps {
  fitToWidth: number;
  onFitToWidthChange?: (width: number) => void;
}

export function FitToWidthSelector({
  fitToWidth,
  onFitToWidthChange,
}: FitToWidthSelectorProps): JSX.Element {
  const [isCustomWidth, setIsCustomWidth] = useState(
    !ALL_PRESET_VALUES.includes(fitToWidth)
  );

  // Sync local "custom" flag when the parent resets fitToWidth to a known
  // preset (e.g. on format change). Without this, the dropdown would still
  // show "Custom width..." even though a preset is now active.
  useEffect(() => {
    if (ALL_PRESET_VALUES.includes(fitToWidth)) {
      setIsCustomWidth(false);
    }
  }, [fitToWidth]);

  const handleSelectChange = useCallback(
    (value: string): void => {
      if (value === "custom") {
        setIsCustomWidth(true);
      } else {
        const numValue = parseInt(value, 10);
        setIsCustomWidth(false);
        onFitToWidthChange?.(numValue);
      }
    },
    [onFitToWidthChange]
  );

  return (
    <div className="space-y-3">
      <Select
        value={isCustomWidth ? "custom" : fitToWidth.toString()}
        onChange={(e) => handleSelectChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      >
        <optgroup label={FIT_TO_WIDTH_GROUPS.screenSizes.label}>
          {FIT_TO_WIDTH_GROUPS.screenSizes.presets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </optgroup>
        <optgroup label={FIT_TO_WIDTH_GROUPS.print150dpi.label}>
          {FIT_TO_WIDTH_GROUPS.print150dpi.presets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </optgroup>
        <option value="custom">Custom width...</option>
      </Select>

      {isCustomWidth && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={fitToWidth}
            onChange={(e) =>
              onFitToWidthChange?.(clampFitToWidth(e.target.value))
            }
            onClick={(e) => e.stopPropagation()}
            aria-label="Custom width in pixels"
            fullWidth={false}
            className="flex-1"
            mono
            min={MIN_FIT_WIDTH_PX}
            max={MAX_FIT_WIDTH_PX}
            placeholder={String(DEFAULT_FIT_TO_WIDTH_PX)}
          />
          <span className="text-sm text-neutral-500">px</span>
        </div>
      )}
    </div>
  );
}
