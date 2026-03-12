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
      { label: "A4 Landscape (1754px)", value: 1754 },
      { label: "A3 Landscape (2480px)", value: 2480 },
      { label: "Letter Landscape (1650px)", value: 1650 },
    ] as FitToWidthPreset[],
  },
};

const ALL_PRESET_VALUES = [
  ...FIT_TO_WIDTH_GROUPS.screenSizes.presets,
  ...FIT_TO_WIDTH_GROUPS.print150dpi.presets,
].map((p) => p.value);

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
              onFitToWidthChange?.(
                Math.max(
                  MIN_FIT_WIDTH_PX,
                  Math.min(
                    MAX_FIT_WIDTH_PX,
                    parseInt(e.target.value, 10) || DEFAULT_FIT_TO_WIDTH_PX
                  )
                )
              )
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
