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
      <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider pb-0.5 mb-3 border-b border-neutral-200">
        Timeline Scale
      </h3>

      <div className="space-y-2">
        {/* Use Current View */}
        <label
          className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
            options.zoomMode === "currentView"
              ? "bg-brand-50 border-[var(--color-brand-gray-400)]"
              : "border-neutral-200 hover:border-[var(--color-brand-gray-400)]"
          }`}
        >
          <input
            type="radio"
            name="zoomMode"
            checked={options.zoomMode === "currentView"}
            onChange={() => onChange({ zoomMode: "currentView" })}
            className="mt-0.5 w-4 h-4"
            aria-label="Use current view"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${options.zoomMode === "currentView" ? "text-[var(--color-brand-gray-900)]" : "text-neutral-800"}`}
              >
                Use current view
              </span>
              <span
                className={`text-xs font-mono px-1.5 py-0.5 rounded ${options.zoomMode === "currentView" ? "text-[var(--color-brand-gray-700)] bg-[var(--color-brand-gray-100)]" : "text-neutral-500 bg-neutral-100"}`}
              >
                {Math.round(currentAppZoom * 100)}%
              </span>
            </div>
            <p
              className={`text-xs mt-0.5 ${options.zoomMode === "currentView" ? "text-[var(--color-brand-gray-700)]" : "text-neutral-500"}`}
            >
              Export at your current zoom level
            </p>
          </div>
        </label>

        {/* Fit to Width */}
        <label
          className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
            options.zoomMode === "fitToWidth"
              ? "bg-brand-50 border-[var(--color-brand-gray-400)]"
              : "border-neutral-200 hover:border-[var(--color-brand-gray-400)]"
          }`}
        >
          <input
            type="radio"
            name="zoomMode"
            checked={options.zoomMode === "fitToWidth"}
            onChange={() => onChange({ zoomMode: "fitToWidth" })}
            className="mt-0.5 w-4 h-4"
          />
          <div className="flex-1">
            <span
              className={`text-sm font-medium ${options.zoomMode === "fitToWidth" ? "text-[var(--color-brand-gray-900)]" : "text-neutral-800"}`}
            >
              Fit to width
            </span>
            <p
              className={`text-xs mt-0.5 ${options.zoomMode === "fitToWidth" ? "text-[var(--color-brand-gray-700)]" : "text-neutral-500"}`}
            >
              Scale to a specific pixel width
            </p>

            {options.zoomMode === "fitToWidth" && (
              <div className="mt-3 space-y-3">
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
                    className="w-24 px-2.5 py-1.5 text-sm font-mono bg-white border border-brand-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    min={100}
                    max={20000}
                  />
                  <span className="text-xs text-[var(--color-brand-gray-500)]">
                    px
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {EXPORT_QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() =>
                        onChange({ fitToWidth: preset.targetWidth })
                      }
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        options.fitToWidth === preset.targetWidth
                          ? "bg-brand-600 text-white"
                          : "bg-[var(--color-brand-gray-100)] text-[var(--color-brand-gray-700)] hover:bg-[var(--color-brand-gray-200)]"
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
          className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
            options.zoomMode === "custom"
              ? "bg-brand-50 border-[var(--color-brand-gray-400)]"
              : "border-neutral-200 hover:border-[var(--color-brand-gray-400)]"
          }`}
        >
          <input
            type="radio"
            name="zoomMode"
            checked={options.zoomMode === "custom"}
            onChange={() => onChange({ zoomMode: "custom" })}
            className="mt-0.5 w-4 h-4"
          />
          <div className="flex-1">
            <span
              className={`text-sm font-medium ${options.zoomMode === "custom" ? "text-[var(--color-brand-gray-900)]" : "text-neutral-800"}`}
            >
              Custom zoom
            </span>
            <p
              className={`text-xs mt-0.5 ${options.zoomMode === "custom" ? "text-[var(--color-brand-gray-700)]" : "text-neutral-500"}`}
            >
              Set a specific zoom percentage
            </p>

            {options.zoomMode === "custom" && (
              <div className="mt-3 space-y-3">
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
                    className="flex-1 h-1.5 bg-[var(--color-brand-gray-200)] rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex items-center gap-1 bg-[var(--color-brand-gray-100)] rounded-md px-2 py-1">
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
                      className="w-10 text-sm text-center font-mono bg-transparent border-none focus:outline-none text-[var(--color-brand-gray-900)]"
                      min={EXPORT_ZOOM_MIN * 100}
                      max={EXPORT_ZOOM_MAX * 100}
                    />
                    <span className="text-xs text-[var(--color-brand-gray-700)]">
                      %
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {Object.entries(EXPORT_ZOOM_PRESETS).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange({ timelineZoom: value })}
                      className={`px-2 py-1 text-xs font-mono rounded-md transition-colors ${
                        options.timelineZoom === value
                          ? "bg-brand-600 text-white"
                          : "bg-[var(--color-brand-gray-100)] text-[var(--color-brand-gray-700)] hover:bg-[var(--color-brand-gray-200)]"
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

      {/* Readability Indicator */}
      <div
        className={`flex items-center gap-2 mt-4 px-3 py-2 rounded-md text-xs ${
          readabilityStatus.level === "good"
            ? "bg-emerald-50 text-emerald-700"
            : readabilityStatus.level === "warning"
              ? "bg-amber-50 text-amber-700"
              : "bg-red-50 text-red-700"
        }`}
      >
        <StatusIcon size={14} weight="light" />
        <span className="flex-1">{readabilityStatus.message}</span>
        <span className="font-mono font-medium">
          {Math.round(effectiveZoom * 100)}%
        </span>
      </div>
    </section>
  );
}
