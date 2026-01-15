/**
 * Zoom mode selector component.
 * Used by PNG and PDF export for timeline scale selection.
 * Supports current view, fit to width/page, and custom zoom modes.
 */

import { useState } from "react";
import { RadioOptionCard } from "../common/RadioOptionCard";
import {
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
  EXPORT_ZOOM_PRESETS,
} from "../../utils/export/types";
import type { ExportZoomMode, ExportFormat } from "../../utils/export/types";

/** Fit to width preset option (PNG only) */
interface FitToWidthPreset {
  label: string;
  value: number;
}

/** Fit to width preset groups (PNG only) */
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

/** All preset values for quick lookup */
const ALL_PRESET_VALUES = [
  ...FIT_TO_WIDTH_GROUPS.screenSizes.presets,
  ...FIT_TO_WIDTH_GROUPS.print150dpi.presets,
].map((p) => p.value);

/** Custom zoom presets */
const CUSTOM_ZOOM_PRESETS_ARRAY = [0.1, 0.25, 0.5, 1.0, 1.5, 2.0];

export interface ZoomModeSelectorProps {
  /** Current zoom mode */
  zoomMode: ExportZoomMode;
  /** Called when zoom mode changes */
  onZoomModeChange: (mode: ExportZoomMode) => void;
  /** Current timeline zoom value (for custom mode) */
  timelineZoom: number;
  /** Called when timeline zoom changes */
  onTimelineZoomChange: (zoom: number) => void;
  /** Current app zoom level (displayed in "Use current view") */
  currentAppZoom: number;
  /** Export format - determines available options */
  format: ExportFormat;
  /** Fit to width value in pixels (PNG/SVG only) */
  fitToWidth?: number;
  /** Called when fit to width changes (PNG/SVG only) */
  onFitToWidthChange?: (width: number) => void;
}

export function ZoomModeSelector({
  zoomMode,
  onZoomModeChange,
  timelineZoom,
  onTimelineZoomChange,
  currentAppZoom,
  format,
  fitToWidth = 1920,
  onFitToWidthChange,
}: ZoomModeSelectorProps): JSX.Element {
  // Track if custom width is selected (PNG only)
  const [isCustomWidth, setIsCustomWidth] = useState(
    !ALL_PRESET_VALUES.includes(fitToWidth)
  );

  const isPngOrSvg = format === "png" || format === "svg";
  const radioName = `${format}ZoomMode`;

  // Handle fit to width select change (PNG only)
  const handleSelectChange = (value: string): void => {
    if (value === "custom") {
      setIsCustomWidth(true);
    } else {
      const numValue = parseInt(value);
      setIsCustomWidth(false);
      onFitToWidthChange?.(numValue);
    }
  };

  return (
    <section>
      <span className="block text-sm font-semibold text-neutral-900 mb-3">
        Timeline Scale
      </span>

      <div className="space-y-2">
        {/* Use Current View */}
        <RadioOptionCard
          name={radioName}
          selected={zoomMode === "currentView"}
          onChange={() => onZoomModeChange("currentView")}
          title="Use current view"
          description="Export at your current zoom level"
          badge={`${Math.round(currentAppZoom * 100)}%`}
        />

        {/* Fit to Width/Page */}
        <RadioOptionCard
          name={radioName}
          selected={zoomMode === "fitToWidth"}
          onChange={() => onZoomModeChange("fitToWidth")}
          title={isPngOrSvg ? "Fit to width" : "Fit to page"}
          description={
            isPngOrSvg ? undefined : "Automatically scale to fit page width"
          }
        >
          {isPngOrSvg && (
            <div className="space-y-3">
              {/* Select Dropdown */}
              <select
                value={isCustomWidth ? "custom" : fitToWidth.toString()}
                onChange={(e) => handleSelectChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 hover:border-neutral-400 cursor-pointer"
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
              </select>

              {/* Custom Width Input */}
              {isCustomWidth && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={fitToWidth}
                    onChange={(e) =>
                      onFitToWidthChange?.(
                        Math.max(
                          100,
                          Math.min(20000, parseInt(e.target.value) || 1920)
                        )
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 hover:border-neutral-400"
                    min={100}
                    max={20000}
                    placeholder="1920"
                  />
                  <span className="text-sm text-neutral-500">px</span>
                </div>
              )}
            </div>
          )}
        </RadioOptionCard>

        {/* Custom Zoom */}
        <RadioOptionCard
          name={radioName}
          selected={zoomMode === "custom"}
          onChange={() => onZoomModeChange("custom")}
          title="Custom zoom"
          description="Set a specific zoom percentage"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={EXPORT_ZOOM_MIN * 100}
                max={EXPORT_ZOOM_MAX * 100}
                step={1}
                value={timelineZoom * 100}
                onChange={(e) =>
                  onTimelineZoomChange(parseInt(e.target.value) / 100)
                }
                onClick={(e) => e.stopPropagation()}
                className="flex-1 h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded px-3 py-1.5">
                <input
                  type="number"
                  value={Math.round(timelineZoom * 100)}
                  onChange={(e) =>
                    onTimelineZoomChange(
                      Math.max(
                        EXPORT_ZOOM_MIN,
                        Math.min(
                          EXPORT_ZOOM_MAX,
                          parseInt(e.target.value) / 100 || 1
                        )
                      )
                    )
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 text-sm text-center font-mono bg-transparent border-none focus:outline-none text-neutral-900"
                  min={EXPORT_ZOOM_MIN * 100}
                  max={EXPORT_ZOOM_MAX * 100}
                />
                <span className="text-xs text-neutral-500">%</span>
              </div>
            </div>

            {/* Zoom presets */}
            <div className="flex flex-wrap gap-1.5">
              {(isPngOrSvg
                ? CUSTOM_ZOOM_PRESETS_ARRAY
                : Object.values(EXPORT_ZOOM_PRESETS)
              ).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTimelineZoomChange(value);
                  }}
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
        </RadioOptionCard>
      </div>
    </section>
  );
}
