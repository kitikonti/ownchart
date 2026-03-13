/**
 * CustomZoomControl - Zoom slider, percentage input, and preset buttons for export.
 */

import {
  memo,
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
  EXPORT_ZOOM_PRESETS,
  EXPORT_ZOOM_TENTH,
  EXPORT_ZOOM_QUARTER,
} from "../../utils/export/types";

/**
 * Zoom presets for PNG/SVG exports: extends the shared EXPORT_ZOOM_PRESETS
 * with the two finer levels (0.1×, 0.25×) available only for raster/vector
 * outputs that have no fixed-page readability constraints.
 * Composing from the shared constant prevents value drift.
 */
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
 * Falls back to 1.0 (100%) when the input is not a valid number.
 *
 * Uses parseFloat (not parseInt) so decimal entries like "1.5" (1.5%)
 * are handled correctly instead of being silently truncated to "1".
 */
function clampExportZoom(rawInput: string): number {
  const parsed = parseFloat(rawInput);
  const value = Number.isNaN(parsed) ? 100 : parsed;
  return Math.max(EXPORT_ZOOM_MIN, Math.min(EXPORT_ZOOM_MAX, value / 100));
}

export interface CustomZoomControlProps {
  timelineZoom: number;
  onTimelineZoomChange: (zoom: number) => void;
  isPngOrSvg: boolean;
}

interface ZoomPercentInputProps {
  /** Committed zoom multiplier from the parent (e.g. 1.0 for 100%). */
  value: number;
  onCommit: (zoom: number) => void;
  /** Propagation-stop handler typed broadly so the parent's shared handler
   *  (typed as `MouseEvent<Element>`) satisfies this prop without widening. */
  onClick: (e: MouseEvent<Element>) => void;
}

/**
 * Bordered container combining a number input and "%" unit label.
 * Uses a compound border design (input + label share one border) which
 * prevents the standard Input component's own border from being used here.
 *
 * Maintains a local draft string so intermediate keystrokes (e.g. "15" while
 * typing "150") do not fire upstream re-renders. The clamped value is
 * committed to the parent on blur or Enter key.
 *
 * Memoized to avoid re-renders when the slider moves — the parent
 * (CustomZoomControl) re-renders on every `timelineZoom` change, but
 * ZoomPercentInput only needs to re-render when its `value` prop changes.
 */
const ZoomPercentInput = memo(function ZoomPercentInput({
  value,
  onCommit,
  onClick,
}: ZoomPercentInputProps): JSX.Element {
  // Local draft keeps the raw string so users can type freely.
  const [draft, setDraft] = useState(String(Math.round(value * 100)));

  // Sync draft when the parent changes the committed zoom externally
  // (e.g. preset button click or slider move).
  useEffect(() => {
    setDraft(String(Math.round(value * 100)));
  }, [value]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setDraft(e.target.value);
  }, []);

  const handleCommit = useCallback((): void => {
    const clamped = clampExportZoom(draft);
    // Normalise draft to the clamped percentage so the field reflects the
    // actual committed value after blur (e.g. "99999" → "200").
    setDraft(String(Math.round(clamped * 100)));
    onCommit(clamped);
  }, [draft, onCommit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    },
    []
  );

  return (
    <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded px-3 py-1.5">
      <input
        type="number"
        value={draft}
        onChange={handleChange}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        onClick={onClick}
        aria-label="Zoom percentage"
        className="w-10 text-sm text-center font-mono bg-transparent border-none focus:outline-none text-neutral-900"
        min={EXPORT_ZOOM_MIN * 100}
        max={EXPORT_ZOOM_MAX * 100}
      />
      <span className="text-xs text-neutral-500">%</span>
    </div>
  );
});

interface PresetButtonProps {
  value: number;
  isActive: boolean;
  onTimelineZoomChange: (zoom: number) => void;
}

const PresetButton = memo(function PresetButton({
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
      aria-label={`Set zoom to ${Math.round(value * 100)}%`}
      className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors duration-150 ${
        isActive
          ? "bg-brand-600 text-white"
          : "bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
      }`}
    >
      {Math.round(value * 100)}%
    </button>
  );
});

export const CustomZoomControl = memo(function CustomZoomControl({
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

  // Shared click handler — prevents click events from bubbling to the export
  // dialog's backdrop overlay, which closes the dialog on click. Native
  // <input type="range"> and <input type="number"> elements fire click events
  // that would otherwise reach the backdrop and dismiss the dialog unexpectedly.
  const handleStopPropagation = useCallback((e: MouseEvent<Element>): void => {
    e.stopPropagation();
  }, []);

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
          value={timelineZoom}
          onCommit={onTimelineZoomChange}
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
});
