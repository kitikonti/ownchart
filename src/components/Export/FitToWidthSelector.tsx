/**
 * FitToWidthSelector - Preset and custom pixel-width selector for PNG/SVG exports.
 * Offers common screen/print sizes and a free-form custom pixel input.
 */

import { useState } from "react";
import { Input } from "../common/Input";
import { Select } from "../common/Select";

export const MIN_FIT_WIDTH_PX = 100;
export const MAX_FIT_WIDTH_PX = 20000;

interface FitToWidthPreset {
  label: string;
  value: number;
}

const FIT_TO_WIDTH_GROUPS = {
  screenSizes: {
    label: "Screen Sizes",
    presets: [
      { label: "HD Screen (1920px)", value: 1920 },
      { label: "4K Screen (3840px)", value: 3840 },
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

  const handleSelectChange = (value: string): void => {
    if (value === "custom") {
      setIsCustomWidth(true);
    } else {
      const numValue = parseInt(value, 10);
      setIsCustomWidth(false);
      onFitToWidthChange?.(numValue);
    }
  };

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
                    parseInt(e.target.value, 10) || 1920
                  )
                )
              )
            }
            onClick={(e) => e.stopPropagation()}
            fullWidth={false}
            className="flex-1"
            mono
            min={MIN_FIT_WIDTH_PX}
            max={MAX_FIT_WIDTH_PX}
            placeholder="1920"
          />
          <span className="text-sm text-neutral-500">px</span>
        </div>
      )}
    </div>
  );
}
