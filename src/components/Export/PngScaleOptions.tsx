/**
 * PNG/SVG scale options component.
 * Contains Timeline Scale settings with Figma-style dropdown for fit-to-width.
 */

import { useState } from "react";
import type { ExportOptions } from "../../utils/export/types";
import {
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
} from "../../utils/export/types";

/** Fit to width preset option */
interface FitToWidthPreset {
  label: string;
  value: number;
}

/** Fit to width preset groups (Figma-style) */
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

/** Custom zoom presets - includes lower values per Figma design */
const CUSTOM_ZOOM_PRESETS = [0.1, 0.25, 0.5, 1.0, 1.5, 2.0];

export interface PngScaleOptionsProps {
  options: ExportOptions;
  onChange: (options: Partial<ExportOptions>) => void;
  currentAppZoom: number;
  projectDurationDays: number;
  taskTableWidth: number;
}

export function PngScaleOptions({
  options,
  onChange,
  currentAppZoom,
}: PngScaleOptionsProps): JSX.Element {
  // Track if custom width is selected (value not in presets)
  const [isCustomWidth, setIsCustomWidth] = useState(
    !ALL_PRESET_VALUES.includes(options.fitToWidth)
  );

  // Handle select change
  const handleSelectChange = (value: string): void => {
    if (value === "custom") {
      setIsCustomWidth(true);
    } else {
      const numValue = parseInt(value);
      setIsCustomWidth(false);
      onChange({ fitToWidth: numValue });
    }
  };

  return (
    <section>
      <span className="block text-sm font-semibold text-neutral-900 mb-3">
        Timeline Scale
      </span>

      <div className="space-y-2">
        {/* Use Current View */}
        <label
          className={`flex items-center gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50 ${
            options.zoomMode === "currentView"
              ? "border-neutral-300 border-l-[3px] border-l-brand-600"
              : "border-neutral-200 hover:border-neutral-300"
          }`}
        >
          <input
            type="radio"
            name="zoomMode"
            checked={options.zoomMode === "currentView"}
            onChange={() => onChange({ zoomMode: "currentView" })}
            className="size-4"
            style={{ accentColor: "var(--color-brand-600)" }}
            aria-label="Use current view"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-900">
                Use current view
              </span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-600">
                {Math.round(currentAppZoom * 100)}%
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Export at your current zoom level
            </p>
          </div>
        </label>

        {/* Fit to Width */}
        <label
          className={`flex items-start gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50 ${
            options.zoomMode === "fitToWidth"
              ? "border-neutral-300 border-l-[3px] border-l-brand-600"
              : "border-neutral-200 hover:border-neutral-300"
          }`}
        >
          <input
            type="radio"
            name="zoomMode"
            checked={options.zoomMode === "fitToWidth"}
            onChange={() => onChange({ zoomMode: "fitToWidth" })}
            className="size-4 mt-0.5"
            style={{ accentColor: "var(--color-brand-600)" }}
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-neutral-900">
              Fit to width
            </span>

            {options.zoomMode === "fitToWidth" && (
              <div className="mt-4 space-y-3">
                {/* Select Dropdown */}
                <select
                  value={isCustomWidth ? "custom" : options.fitToWidth.toString()}
                  onChange={(e) => handleSelectChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 hover:border-neutral-400 cursor-pointer"
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
                </select>

                {/* Custom Width Input - shown when "Custom width..." selected */}
                {isCustomWidth && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={options.fitToWidth}
                      onChange={(e) =>
                        onChange({
                          fitToWidth: Math.max(
                            100,
                            Math.min(20000, parseInt(e.target.value) || 1920)
                          ),
                        })
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
          </div>
        </label>

        {/* Custom Zoom */}
        <label
          className={`flex items-start gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50 ${
            options.zoomMode === "custom"
              ? "border-neutral-300 border-l-[3px] border-l-brand-600"
              : "border-neutral-200 hover:border-neutral-300"
          }`}
        >
          <input
            type="radio"
            name="zoomMode"
            checked={options.zoomMode === "custom"}
            onChange={() => onChange({ zoomMode: "custom" })}
            className="size-4 mt-0.5"
            style={{ accentColor: "var(--color-brand-600)" }}
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-neutral-900">
              Custom zoom
            </span>
            <p className="text-xs text-neutral-500 mt-0.5">
              Set a specific zoom percentage
            </p>

            {options.zoomMode === "custom" && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={EXPORT_ZOOM_MIN * 100}
                    max={EXPORT_ZOOM_MAX * 100}
                    step={1}
                    value={options.timelineZoom * 100}
                    onChange={(e) =>
                      onChange({ timelineZoom: parseInt(e.target.value) / 100 })
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded px-3 py-1.5">
                    <input
                      type="number"
                      value={Math.round(options.timelineZoom * 100)}
                      onChange={(e) =>
                        onChange({
                          timelineZoom: Math.max(
                            EXPORT_ZOOM_MIN,
                            Math.min(
                              EXPORT_ZOOM_MAX,
                              parseInt(e.target.value) / 100 || 1
                            )
                          ),
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 text-sm text-center font-mono bg-transparent border-none focus:outline-none text-neutral-900"
                      min={EXPORT_ZOOM_MIN * 100}
                      max={EXPORT_ZOOM_MAX * 100}
                    />
                    <span className="text-xs text-neutral-500">%</span>
                  </div>
                </div>

                {/* Zoom presets including lower values (10%, 25%) */}
                <div className="flex flex-wrap gap-1.5">
                  {CUSTOM_ZOOM_PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange({ timelineZoom: value });
                      }}
                      className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors duration-150 ${
                        options.timelineZoom === value
                          ? "bg-brand-600 text-white"
                          : "bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                      }`}
                    >
                      {Math.round(value * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </label>
      </div>
    </section>
  );
}
