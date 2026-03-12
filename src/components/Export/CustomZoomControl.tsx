/**
 * CustomZoomControl - Zoom slider, percentage input, and preset buttons for export.
 */

import { useCallback, type ChangeEvent, type MouseEvent } from "react";
import {
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
  EXPORT_ZOOM_PRESETS,
} from "../../utils/export/types";

// PNG/SVG exports support finer zoom levels (0.1×, 0.25×) not available for
// PDF, because raster/vector outputs can represent very small scales without
// readability constraints imposed by fixed PDF page dimensions.
// The four shared presets from EXPORT_ZOOM_PRESETS are extended with the two
// finer levels; composing from the shared constant prevents value drift.

/** 10% zoom — fine-grained preset available only for PNG/SVG exports. */
const EXPORT_ZOOM_TENTH = 0.1;

/** 25% zoom — fine-grained preset available only for PNG/SVG exports. */
const EXPORT_ZOOM_QUARTER = 0.25;

const CUSTOM_ZOOM_PRESETS_ARRAY: ReadonlyArray<number> = [
  EXPORT_ZOOM_TENTH,
  EXPORT_ZOOM_QUARTER,
  ...Object.values(EXPORT_ZOOM_PRESETS),
];

/** Zoom presets for PDF exports (subset of EXPORT_ZOOM_PRESETS — no fine-grained levels). */
const PDF_ZOOM_PRESETS_ARRAY: ReadonlyArray<number> =
  Object.values(EXPORT_ZOOM_PRESETS);

/**
 * Tolerance for floating-point equality when matching the current zoom to a
 * preset. All defined presets are exactly representable IEEE-754 doubles
 * (0.1, 0.25, 0.5, 1.0, 1.5, 2.0), but using an epsilon guards against
 * precision drift if new fractional presets are added in the future.
 */
const PRESET_ACTIVE_EPSILON = 0.001;

/**
 * Parse a raw string input into a clamped export zoom multiplier.
 * The input is expected to be a percentage value (e.g. "100" → 1.0).
 * Falls back to 1.0 (100%) when the input is not a valid integer.
 */
function clampExportZoom(rawInput: string): number {
  const parsed = parseInt(rawInput, 10);
  const value = Number.isNaN(parsed) ? 100 : parsed;
  return Math.max(EXPORT_ZOOM_MIN, Math.min(EXPORT_ZOOM_MAX, value / 100));
}

export interface CustomZoomControlProps {
  timelineZoom: number;
  onTimelineZoomChange: (zoom: number) => void;
  isPngOrSvg: boolean;
}

interface ZoomPercentInputProps {
  value: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClick: (e: MouseEvent<HTMLInputElement>) => void;
}

/**
 * Bordered container combining a number input and "%" unit label.
 * Uses a compound border design (input + label share one border) which
 * prevents the standard Input component's own border from being used here.
 */
function ZoomPercentInput({
  value,
  onChange,
  onClick,
}: ZoomPercentInputProps): JSX.Element {
  return (
    <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded px-3 py-1.5">
      <input
        type="number"
        value={value}
        onChange={onChange}
        onClick={onClick}
        aria-label="Zoom percentage"
        className="w-10 text-sm text-center font-mono bg-transparent border-none focus:outline-none text-neutral-900"
        min={EXPORT_ZOOM_MIN * 100}
        max={EXPORT_ZOOM_MAX * 100}
      />
      <span className="text-xs text-neutral-500">%</span>
    </div>
  );
}

interface PresetButtonProps {
  value: number;
  isActive: boolean;
  onTimelineZoomChange: (zoom: number) => void;
}

function PresetButton({
  value,
  isActive,
  onTimelineZoomChange,
}: PresetButtonProps): JSX.Element {
  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>): void => {
      e.stopPropagation();
      onTimelineZoomChange(value);
    },
    [onTimelineZoomChange, value]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isActive}
      className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors duration-150 ${
        isActive
          ? "bg-brand-600 text-white"
          : "bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
      }`}
    >
      {Math.round(value * 100)}%
    </button>
  );
}

export function CustomZoomControl({
  timelineZoom,
  onTimelineZoomChange,
  isPngOrSvg,
}: CustomZoomControlProps): JSX.Element {
  const presets = isPngOrSvg
    ? CUSTOM_ZOOM_PRESETS_ARRAY
    : PDF_ZOOM_PRESETS_ARRAY;

  const handleSliderChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      onTimelineZoomChange(parseInt(e.target.value, 10) / 100);
    },
    [onTimelineZoomChange]
  );

  // Shared click handler — prevents click events from bubbling out of the
  // export dialog overlay. Used for both the slider and the percent input.
  const handleStopPropagation = useCallback((e: MouseEvent): void => {
    e.stopPropagation();
  }, []);

  const handlePercentInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      onTimelineZoomChange(clampExportZoom(e.target.value));
    },
    [onTimelineZoomChange]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={EXPORT_ZOOM_MIN * 100}
          max={EXPORT_ZOOM_MAX * 100}
          step={1}
          value={timelineZoom * 100}
          onChange={handleSliderChange}
          onClick={handleStopPropagation}
          aria-label="Zoom level"
          aria-valuemin={EXPORT_ZOOM_MIN * 100}
          aria-valuemax={EXPORT_ZOOM_MAX * 100}
          aria-valuenow={Math.round(timelineZoom * 100)}
          aria-valuetext={`${Math.round(timelineZoom * 100)}%`}
          className="flex-1 h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-brand-600"
        />
        <ZoomPercentInput
          value={Math.round(timelineZoom * 100)}
          onChange={handlePercentInputChange}
          onClick={handleStopPropagation}
        />
      </div>

      {/* Zoom presets */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((value) => (
          <PresetButton
            key={value}
            value={value}
            isActive={Math.abs(timelineZoom - value) < PRESET_ACTIVE_EPSILON}
            onTimelineZoomChange={onTimelineZoomChange}
          />
        ))}
      </div>
    </div>
  );
}
