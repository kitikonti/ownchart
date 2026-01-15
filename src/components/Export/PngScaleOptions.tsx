/**
 * PNG/SVG scale options component.
 * Contains Timeline Scale settings and readability indicator.
 */

import { useMemo } from "react";
import { CheckCircle, Warning } from "@phosphor-icons/react";
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

function getReadabilityStatus(zoom: number): {
  level: "good" | "warning" | "critical";
  message: string;
  icon: typeof CheckCircle;
} {
  if (zoom >= EXPORT_ZOOM_READABLE_THRESHOLD) {
    return { level: "good", message: "Labels readable", icon: CheckCircle };
  } else if (zoom >= EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD) {
    return {
      level: "warning",
      message: "Labels may be hard to read",
      icon: Warning,
    };
  } else {
    return {
      level: "critical",
      message: "Labels will be hidden",
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
  const StatusIcon = readabilityStatus.icon;

  return (
    <section>
      <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
        Timeline Scale
      </span>

      <div className="space-y-3">
        {/* Use Current View */}
        <label
          className={`flex items-center gap-3.5 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 min-h-[44px] hover:bg-neutral-50 ${
            options.zoomMode === "currentView"
              ? "border-brand-600 bg-brand-50"
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
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                {Math.round(currentAppZoom * 100)}%
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              Export at your current zoom level
            </p>
          </div>
        </label>

        {/* Fit to Width */}
        <label
          className={`flex items-start gap-3.5 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 min-h-[44px] hover:bg-neutral-50 ${
            options.zoomMode === "fitToWidth"
              ? "border-brand-600 bg-brand-50"
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
            <p className="text-xs text-neutral-600 mt-0.5">
              Scale to a specific pixel width
            </p>

            {options.zoomMode === "fitToWidth" && (
              <div className="mt-4 space-y-3">
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
                    className="w-28 px-3 py-2.5 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-all duration-200 hover:border-neutral-400"
                    min={100}
                    max={20000}
                  />
                  <span className="text-xs text-neutral-500">px</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {EXPORT_QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() =>
                        onChange({ fitToWidth: preset.targetWidth })
                      }
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 active:scale-[0.98] ${
                        options.fitToWidth === preset.targetWidth
                          ? "bg-brand-600 text-white shadow-md"
                          : "bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                      }`}
                      title={preset.description}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </label>

        {/* Custom Zoom */}
        <label
          className={`flex items-start gap-3.5 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 min-h-[44px] hover:bg-neutral-50 ${
            options.zoomMode === "custom"
              ? "border-brand-600 bg-brand-50"
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
            <p className="text-xs text-neutral-600 mt-0.5">
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
                    className="flex-1 h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-lg px-3 py-1.5">
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
                      className="w-10 text-sm text-center font-mono bg-transparent border-none focus:outline-none text-neutral-900"
                      min={EXPORT_ZOOM_MIN * 100}
                      max={EXPORT_ZOOM_MAX * 100}
                    />
                    <span className="text-xs text-neutral-500">%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {Object.entries(EXPORT_ZOOM_PRESETS).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange({ timelineZoom: value })}
                      className={`px-3 py-2 text-xs font-mono font-medium rounded-lg transition-all duration-200 active:scale-[0.98] ${
                        options.timelineZoom === value
                          ? "bg-brand-600 text-white shadow-md"
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

      {/* Readability Indicator - Figma-style */}
      <div
        className={`flex items-center gap-2.5 mt-4 px-4 py-3 rounded-lg ${
          readabilityStatus.level === "good"
            ? "bg-green-50 border border-green-200"
            : readabilityStatus.level === "warning"
              ? "bg-amber-50 border border-amber-200"
              : "bg-red-50 border border-red-200"
        }`}
      >
        <StatusIcon
          size={16}
          weight="fill"
          className={
            readabilityStatus.level === "good"
              ? "text-green-600"
              : readabilityStatus.level === "warning"
                ? "text-amber-600"
                : "text-red-600"
          }
        />
        <span
          className={`text-xs font-semibold ${
            readabilityStatus.level === "good"
              ? "text-green-700"
              : readabilityStatus.level === "warning"
                ? "text-amber-700"
                : "text-red-700"
          }`}
        >
          {readabilityStatus.message}
        </span>
        <span
          className={`ml-auto text-xs font-mono font-semibold ${
            readabilityStatus.level === "good"
              ? "text-green-700"
              : readabilityStatus.level === "warning"
                ? "text-amber-700"
                : "text-red-700"
          }`}
        >
          {Math.round(effectiveZoom * 100)}%
        </span>
      </div>
    </section>
  );
}
