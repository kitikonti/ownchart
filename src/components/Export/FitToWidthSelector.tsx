/**
 * FitToWidthSelector - Preset and custom pixel-width selector for PNG/SVG exports.
 * Offers common screen/print sizes and a free-form custom pixel input.
 */

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useState,
  type KeyboardEvent,
} from "react";
import {
  DEFAULT_FIT_TO_WIDTH_PX,
  UHD_SCREEN_WIDTH_PX,
  MIN_FIT_WIDTH_PX,
  MAX_FIT_WIDTH_PX,
} from "@/utils/export/types";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { stopPropagation } from "./exportEventUtils";

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
    ],
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
    ],
  },
};

const ALL_PRESET_VALUES = [
  ...FIT_TO_WIDTH_GROUPS.screenSizes.presets,
  ...FIT_TO_WIDTH_GROUPS.print150dpi.presets,
].map((p) => p.value);

/**
 * Parse a raw string input into a clamped pixel width.
 * Falls back to DEFAULT_FIT_TO_WIDTH_PX when the input is not a valid integer.
 *
 * parseInt is intentional here — pixel dimensions must be whole numbers.
 * Fractional parts (e.g. "1000.5" → 1000) are silently truncated, which is
 * the correct behaviour for a pixel-width field.
 */
function clampFitToWidth(rawInput: string): number {
  const parsed = parseInt(rawInput, 10);
  const value = Number.isNaN(parsed) ? DEFAULT_FIT_TO_WIDTH_PX : parsed;
  return Math.max(MIN_FIT_WIDTH_PX, Math.min(MAX_FIT_WIDTH_PX, value));
}

export interface FitToWidthSelectorProps {
  fitToWidth: number;
  /**
   * Called when the user changes the width. Optional because this component
   * can be rendered inside a parent where the format does not support
   * fit-to-width (e.g. PDF) and no callback is wired up. Width changes are
   * silently ignored when this prop is absent.
   */
  onFitToWidthChange?: (width: number) => void;
}

export const FitToWidthSelector = memo(function FitToWidthSelector({
  fitToWidth,
  onFitToWidthChange,
}: FitToWidthSelectorProps): JSX.Element {
  // Unique id per instance — prevents duplicate ids if this component is
  // rendered more than once in the same DOM (e.g. tests, multiple dialogs).
  const pxUnitId = `${useId()}-px-unit`;

  const [isCustomWidth, setIsCustomWidth] = useState(
    !ALL_PRESET_VALUES.includes(fitToWidth)
  );

  // Local draft string for the custom width input. Kept as a string so the
  // user can type freely without intermediate clamping on every keystroke.
  // The clamped value is committed to the parent on blur only.
  const [customDraft, setCustomDraft] = useState(String(fitToWidth));

  // Sync local "custom" flag and draft when the parent changes fitToWidth
  // externally (e.g. on format change or restored saved state). Without this,
  // the dropdown could show the wrong label after a programmatic update.
  useEffect(() => {
    const isPreset = ALL_PRESET_VALUES.includes(fitToWidth);
    setIsCustomWidth(!isPreset);
    // Sync the draft when the parent resets to a preset value. When the value
    // is a non-preset (custom) we leave the draft alone so the user's in-progress
    // typing is not overwritten by a prop that equals what they already have.
    if (isPreset) {
      setCustomDraft(String(fitToWidth));
    }
  }, [fitToWidth]);

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>): void => {
      const value = e.target.value;
      if (value === "custom") {
        setIsCustomWidth(true);
        // Seed the draft with the current committed value so the input is not blank.
        setCustomDraft(String(fitToWidth));
      } else {
        // Preset values are module-level constants guaranteed to be within
        // [MIN_FIT_WIDTH_PX, MAX_FIT_WIDTH_PX], so clamping is not needed here.
        // Free-form custom input goes through clampFitToWidth instead.
        const numValue = parseInt(value, 10);
        if (Number.isNaN(numValue)) return;
        // Always flip local state so the dropdown label stays in sync, even
        // when onFitToWidthChange is not wired up. Only the parent callback is
        // conditional — keeping local UI state consistent is always correct.
        setIsCustomWidth(false);
        onFitToWidthChange?.(numValue);
      }
    },
    [fitToWidth, onFitToWidthChange]
  );

  // Update local draft on every keystroke so the input feels responsive, but
  // do NOT propagate to the parent yet — intermediate values (e.g. "20" while
  // typing "2000") would trigger unnecessary upstream re-renders.
  const handleCustomWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setCustomDraft(e.target.value);
    },
    []
  );

  // Commit the clamped value to the parent when the user leaves the field.
  // This is when the value is truly "done", avoiding per-keystroke churn.
  const handleCustomWidthBlur = useCallback((): void => {
    const clamped = clampFitToWidth(customDraft);
    // Normalise the draft to the clamped value so the field shows the real
    // committed number after blur (e.g. "99999" → "20000").
    setCustomDraft(String(clamped));
    onFitToWidthChange?.(clamped);
  }, [customDraft, onFitToWidthChange]);

  // Commit on Enter, mirroring ZoomPercentInput behaviour so both number
  // inputs in the export dialog have consistent keyboard UX.
  const handleCustomWidthKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    },
    []
  );

  return (
    <div className="space-y-3">
      {/* stopPropagation prevents click events from bubbling to the export
          dialog's backdrop overlay, which closes the dialog on click. Native
          <select> and <input> elements fire click events that would otherwise
          reach the backdrop and dismiss the dialog. */}
      <Select
        value={isCustomWidth ? "custom" : fitToWidth.toString()}
        onChange={handleSelectChange}
        onClick={stopPropagation}
        aria-label="Export width"
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
            value={customDraft}
            onChange={handleCustomWidthChange}
            onBlur={handleCustomWidthBlur}
            onKeyDown={handleCustomWidthKeyDown}
            onClick={stopPropagation}
            aria-label="Custom width in pixels"
            aria-describedby={pxUnitId}
            fullWidth={false}
            className="flex-1"
            mono
            min={MIN_FIT_WIDTH_PX}
            max={MAX_FIT_WIDTH_PX}
            step={1}
            placeholder={String(DEFAULT_FIT_TO_WIDTH_PX)}
          />
          <span id={pxUnitId} className="text-sm text-slate-500">
            px
          </span>
        </div>
      )}
    </div>
  );
});
