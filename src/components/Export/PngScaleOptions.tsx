/**
 * PNG-specific scale options component.
 * Contains Timeline Scale settings and readability indicator.
 */

import { useMemo } from "react";
import {
  MonitorPlay,
  SlidersHorizontal,
  ArrowsOutLineHorizontal,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import type { ExportOptions } from "../../utils/export/types";
import {
  EXPORT_ZOOM_PRESETS,
  EXPORT_QUICK_PRESETS,
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
  EXPORT_ZOOM_READABLE_THRESHOLD,
  EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD,
} from "../../utils/export/types";
import { calculateEffectiveZoom } from "../../utils/export";

export interface PngScaleOptionsProps {
  options: ExportOptions;
  onChange: (options: Partial<ExportOptions>) => void;
  currentAppZoom: number;
  projectDurationDays: number;
  taskTableWidth: number;
}

/**
 * Get readability status based on effective zoom level.
 */
function getReadabilityStatus(zoom: number): {
  level: "good" | "warning" | "critical";
  message: string;
  icon: typeof CheckCircle;
} {
  if (zoom >= EXPORT_ZOOM_READABLE_THRESHOLD) {
    return {
      level: "good",
      message: "Labels readable",
      icon: CheckCircle,
    };
  } else if (zoom >= EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD) {
    return {
      level: "warning",
      message: "Labels may be hard to read",
      icon: Warning,
    };
  } else {
    return {
      level: "critical",
      message: "Labels will be hidden or unreadable",
      icon: Warning,
    };
  }
}

export function PngScaleOptions({
  options,
  onChange,
  currentAppZoom,
  projectDurationDays,
  taskTableWidth,
}: PngScaleOptionsProps): JSX.Element {
  // Calculate effective zoom for readability indicator
  const effectiveZoom = useMemo(
    () =>
      calculateEffectiveZoom(
        options,
        currentAppZoom,
        projectDurationDays,
        taskTableWidth
      ),
    [options, currentAppZoom, projectDurationDays, taskTableWidth]
  );

  const readabilityStatus = useMemo(
    () => getReadabilityStatus(effectiveZoom),
    [effectiveZoom]
  );

  return (
    <div>
      {/* Zoom Mode Selection */}
      <div className="space-y-1.5 mb-4">
        {/* Use Current View */}
        <label
          className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-150 ${
            options.zoomMode === "currentView"
              ? "bg-slate-50 border-slate-400"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <input
            type="radio"
            name="zoomMode"
            value="currentView"
            checked={options.zoomMode === "currentView"}
            onChange={() => onChange({ zoomMode: "currentView" })}
            className="mt-0.5 accent-slate-700"
            aria-label="Use current view zoom level"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <MonitorPlay
                size={16}
                weight={
                  options.zoomMode === "currentView" ? "duotone" : "regular"
                }
                className="text-slate-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Use current view
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {Math.round(currentAppZoom * 100)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-6">
              Export at the same zoom level as your current app view
            </p>
          </div>
        </label>

        {/* Fit to Width */}
        <label
          className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-150 ${
            options.zoomMode === "fitToWidth"
              ? "bg-slate-50 border-slate-400"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <input
            type="radio"
            name="zoomMode"
            value="fitToWidth"
            checked={options.zoomMode === "fitToWidth"}
            onChange={() => onChange({ zoomMode: "fitToWidth" })}
            className="mt-0.5 accent-slate-700"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <ArrowsOutLineHorizontal
                size={16}
                weight={
                  options.zoomMode === "fitToWidth" ? "duotone" : "regular"
                }
                className="text-slate-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Fit to width
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-6">
              Scale timeline to fit a specific pixel width
            </p>

            {/* Expanded options with animation */}
            <div
              className={`overflow-hidden transition-all duration-200 ease-out ${
                options.zoomMode === "fitToWidth"
                  ? "max-h-40 opacity-100 mt-3"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="ml-6 space-y-3">
                {/* Width Input */}
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
                    className="w-24 px-2.5 py-1.5 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-shadow"
                    min={100}
                    max={20000}
                  />
                  <span className="text-xs text-slate-400 font-medium">px</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {EXPORT_QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() =>
                        onChange({ fitToWidth: preset.targetWidth })
                      }
                      className={`px-2 py-1 text-xs rounded-md border transition-all duration-150 ${
                        options.fitToWidth === preset.targetWidth
                          ? "bg-slate-700 border-slate-700 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      title={preset.description}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </label>

        {/* Custom Zoom */}
        <label
          className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-150 ${
            options.zoomMode === "custom"
              ? "bg-slate-50 border-slate-400"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <input
            type="radio"
            name="zoomMode"
            value="custom"
            checked={options.zoomMode === "custom"}
            onChange={() => onChange({ zoomMode: "custom" })}
            className="mt-0.5 accent-slate-700"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                size={16}
                weight={options.zoomMode === "custom" ? "duotone" : "regular"}
                className="text-slate-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Custom zoom
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-6">
              Set a specific zoom percentage (5% - 300%)
            </p>

            {/* Expanded options with animation */}
            <div
              className={`overflow-hidden transition-all duration-200 ease-out ${
                options.zoomMode === "custom"
                  ? "max-h-32 opacity-100 mt-3"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="ml-6 space-y-3">
                {/* Slider with value display */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={EXPORT_ZOOM_MIN * 100}
                    max={EXPORT_ZOOM_MAX * 100}
                    step={1}
                    value={options.timelineZoom * 100}
                    onChange={(e) =>
                      onChange({
                        timelineZoom: parseInt(e.target.value) / 100,
                      })
                    }
                    className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-700"
                  />
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
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
                      className="w-10 px-1 py-0.5 text-sm text-center font-mono bg-transparent border-none focus:ring-0 focus:outline-none"
                      min={EXPORT_ZOOM_MIN * 100}
                      max={EXPORT_ZOOM_MAX * 100}
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>

                {/* Quick zoom buttons */}
                <div className="flex gap-1.5">
                  {Object.entries(EXPORT_ZOOM_PRESETS).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange({ timelineZoom: value })}
                      className={`px-2 py-1 text-xs font-mono rounded-md border transition-all duration-150 ${
                        options.timelineZoom === value
                          ? "bg-slate-700 border-slate-700 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {Math.round(value * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </label>
      </div>

      {/* Readability Indicator */}
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
          readabilityStatus.level === "good"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : readabilityStatus.level === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-red-50 border-red-200 text-red-800"
        }`}
      >
        <readabilityStatus.icon size={16} weight="bold" />
        <span className="text-xs font-medium flex-1">
          {readabilityStatus.message}
        </span>
        <span className="text-sm font-semibold font-mono">
          {Math.round(effectiveZoom * 100)}%
        </span>
      </div>
    </div>
  );
}
