/**
 * CustomZoomControl - Zoom slider, percentage input, and preset buttons for export.
 */

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
const CUSTOM_ZOOM_PRESETS_ARRAY = [
  0.1,
  0.25,
  ...Object.values(EXPORT_ZOOM_PRESETS),
];

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

ZoomPercentInput.displayName = "ZoomPercentInput";

export interface CustomZoomControlProps {
  timelineZoom: number;
  onTimelineZoomChange: (zoom: number) => void;
  isPngOrSvg: boolean;
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
}: {
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick: (e: React.MouseEvent<HTMLInputElement>) => void;
}): JSX.Element {
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

export function CustomZoomControl({
  timelineZoom,
  onTimelineZoomChange,
  isPngOrSvg,
}: CustomZoomControlProps): JSX.Element {
  const presets = isPngOrSvg
    ? CUSTOM_ZOOM_PRESETS_ARRAY
    : Object.values(EXPORT_ZOOM_PRESETS);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={EXPORT_ZOOM_MIN * 100}
          max={EXPORT_ZOOM_MAX * 100}
          step={1}
          value={timelineZoom * 100}
          onChange={(e) =>
            onTimelineZoomChange(parseInt(e.target.value, 10) / 100)
          }
          onClick={(e) => e.stopPropagation()}
          aria-label="Zoom level"
          className="flex-1 h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-brand-600"
        />
        <ZoomPercentInput
          value={Math.round(timelineZoom * 100)}
          onChange={(e) =>
            onTimelineZoomChange(clampExportZoom(e.target.value))
          }
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Zoom presets */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((value) => (
          <button
            key={value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTimelineZoomChange(value);
            }}
            aria-pressed={timelineZoom === value}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors duration-150 ${
              timelineZoom === value
                ? "bg-brand-600 text-white"
                : "bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
            }`}
          >
            {Math.round(value * 100)}%
          </button>
        ))}
      </div>
    </div>
  );
}
