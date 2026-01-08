/**
 * Export options form component with advanced timeline scale controls.
 */

import { useMemo } from "react";
import {
  MonitorPlay,
  SlidersHorizontal,
  ArrowsOutLineHorizontal,
  CalendarBlank,
  Warning,
  CheckCircle,
  Info,
} from "@phosphor-icons/react";
import type { ExportOptions, ExportColumnKey } from "../../utils/export/types";
import {
  EXPORT_ZOOM_PRESETS,
  EXPORT_QUICK_PRESETS,
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
  EXPORT_ZOOM_READABLE_THRESHOLD,
  EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD,
  EXPORT_MAX_SAFE_WIDTH,
} from "../../utils/export/types";
import {
  calculateTaskTableWidth,
  calculateEffectiveZoom,
  calculateDurationDays,
} from "../../utils/export";
import type { UiDensity, TaskLabelPosition } from "../../types/preferences.types";

/** Density options for the export */
const DENSITY_OPTIONS: {
  key: UiDensity;
  label: string;
  description: string;
}[] = [
  {
    key: "compact",
    label: "Compact",
    description: "28px rows, fits more tasks",
  },
  { key: "normal", label: "Normal", description: "36px rows, balanced view" },
  {
    key: "comfortable",
    label: "Comfortable",
    description: "44px rows, easier to read",
  },
];

/** Task label position options for the export */
const LABEL_POSITION_OPTIONS: {
  key: TaskLabelPosition;
  label: string;
  description: string;
}[] = [
  { key: "before", label: "Before bar", description: "Label to the left" },
  { key: "inside", label: "Inside bar", description: "Label inside the bar" },
  { key: "after", label: "After bar", description: "Label to the right" },
  { key: "none", label: "None", description: "No labels on timeline" },
];

/** Column definitions for the export options UI */
const COLUMN_OPTIONS: { key: ExportColumnKey; label: string }[] = [
  { key: "color", label: "Color" },
  { key: "name", label: "Name" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End" },
  { key: "duration", label: "Duration" },
  { key: "progress", label: "%" },
];

export interface ExportOptionsFormProps {
  options: ExportOptions;
  onChange: (options: Partial<ExportOptions>) => void;
  estimatedDimensions?: { width: number; height: number };
  currentAppZoom?: number;
  projectDateRange?: { start: Date; end: Date };
  visibleDateRange?: { start: Date; end: Date };
  columnWidths?: Record<string, number>;
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

export function ExportOptionsForm({
  options,
  onChange,
  estimatedDimensions,
  currentAppZoom = 1,
  projectDateRange,
  visibleDateRange,
  columnWidths = {},
}: ExportOptionsFormProps): JSX.Element {
  // Calculate project duration in days
  const projectDurationDays = useMemo(() => {
    if (!projectDateRange) return 365;
    return calculateDurationDays({
      min: projectDateRange.start.toISOString().split("T")[0],
      max: projectDateRange.end.toISOString().split("T")[0],
    });
  }, [projectDateRange]);

  // Calculate task table width from selected columns (using export density)
  const taskTableWidth = useMemo(
    () => calculateTaskTableWidth(options.selectedColumns, columnWidths, options.density),
    [options.selectedColumns, columnWidths, options.density]
  );

  // Calculate effective zoom for readability indicator
  const effectiveZoom = useMemo(
    () => calculateEffectiveZoom(options, currentAppZoom, projectDurationDays, taskTableWidth),
    [options, currentAppZoom, projectDurationDays, taskTableWidth]
  );

  const readabilityStatus = useMemo(
    () => getReadabilityStatus(effectiveZoom),
    [effectiveZoom]
  );

  // Format date for input
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6">
      {/* Timeline Scale Section - Redesigned */}
      <div>
        <h3 className="text-sm font-medium text-slate-800 mb-3">
          Timeline Scale
        </h3>

        {/* Zoom Mode Selection */}
        <div className="space-y-2 mb-4">
          {/* Use Current View */}
          <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <input
              type="radio"
              name="zoomMode"
              value="currentView"
              checked={options.zoomMode === "currentView"}
              onChange={() => onChange({ zoomMode: "currentView" })}
              className="mt-0.5"
              aria-label="Use current view zoom level"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <MonitorPlay size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Use current view
                </span>
                <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {Math.round(currentAppZoom * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Export at the same zoom level as your current app view
              </p>
            </div>
          </label>

          {/* Fit to Width */}
          <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <input
              type="radio"
              name="zoomMode"
              value="fitToWidth"
              checked={options.zoomMode === "fitToWidth"}
              onChange={() => onChange({ zoomMode: "fitToWidth" })}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <ArrowsOutLineHorizontal size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Fit to width
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Scale timeline to fit a specific pixel width
              </p>

              {options.zoomMode === "fitToWidth" && (
                <div className="mt-3 space-y-3">
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
                      className="w-24 px-2 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={100}
                      max={20000}
                    />
                    <span className="text-xs text-slate-500">px</span>
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
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          options.fitToWidth === preset.targetWidth
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
          <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <input
              type="radio"
              name="zoomMode"
              value="custom"
              checked={options.zoomMode === "custom"}
              onChange={() => onChange({ zoomMode: "custom" })}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Custom zoom
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Set a specific zoom percentage (5% - 300%)
              </p>

              {options.zoomMode === "custom" && (
                <div className="mt-3 space-y-2">
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
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex items-center gap-1">
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
                        className="w-16 px-2 py-1 text-sm text-center border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          options.timelineZoom === value
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
          className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
            readabilityStatus.level === "good"
              ? "bg-green-50 text-green-700"
              : readabilityStatus.level === "warning"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
          }`}
        >
          <readabilityStatus.icon size={14} weight="bold" />
          <span>
            {readabilityStatus.message} ({Math.round(effectiveZoom * 100)}%
            effective zoom)
          </span>
        </div>
      </div>

      {/* Date Range Section */}
      <div>
        <h3 className="text-sm font-medium text-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <CalendarBlank size={16} className="text-slate-500" />
            Date Range
          </div>
        </h3>

        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="dateRangeMode"
              value="all"
              checked={options.dateRangeMode === "all"}
              onChange={() => onChange({ dateRangeMode: "all" })}
            />
            <span className="text-sm text-slate-700">
              Entire project
              {projectDateRange && (
                <span className="text-slate-500 ml-1">
                  ({formatDateForInput(projectDateRange.start)} -{" "}
                  {formatDateForInput(projectDateRange.end)})
                </span>
              )}
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="dateRangeMode"
              value="visible"
              checked={options.dateRangeMode === "visible"}
              onChange={() => onChange({ dateRangeMode: "visible" })}
            />
            <span className="text-sm text-slate-700">
              Visible range only
              {visibleDateRange && (
                <span className="text-slate-500 ml-1">
                  ({formatDateForInput(visibleDateRange.start)} -{" "}
                  {formatDateForInput(visibleDateRange.end)})
                </span>
              )}
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="dateRangeMode"
              value="custom"
              checked={options.dateRangeMode === "custom"}
              onChange={() => onChange({ dateRangeMode: "custom" })}
              className="mt-0.5"
            />
            <div className="flex-1">
              <span className="text-sm text-slate-700">Custom range</span>

              {options.dateRangeMode === "custom" && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="date"
                    value={options.customDateStart || ""}
                    onChange={(e) =>
                      onChange({ customDateStart: e.target.value })
                    }
                    className="px-2 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-slate-400">→</span>
                  <input
                    type="date"
                    value={options.customDateEnd || ""}
                    onChange={(e) =>
                      onChange({ customDateEnd: e.target.value })
                    }
                    className="px-2 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Row Density Options */}
      <div>
        <h3 className="text-sm font-medium text-slate-800 mb-3">Row Density</h3>
        <div className="space-y-2">
          {DENSITY_OPTIONS.map((densityOpt) => (
            <label
              key={densityOpt.key}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="radio"
                name="density"
                value={densityOpt.key}
                checked={options.density === densityOpt.key}
                onChange={() => onChange({ density: densityOpt.key })}
                className=""
              />
              <span className="text-sm text-slate-700">
                {densityOpt.label} — {densityOpt.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Column Selection */}
      <div>
        <h3 className="text-sm font-medium text-slate-800 mb-3">
          List Columns
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Select columns to include. Leave all unchecked for timeline only.
        </p>
        <div className="space-y-2">
          {COLUMN_OPTIONS.map((col) => {
            const isSelected = options.selectedColumns.includes(col.key);
            return (
              <label
                key={col.key}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const newColumns = e.target.checked
                      ? [...options.selectedColumns, col.key]
                      : options.selectedColumns.filter((k) => k !== col.key);
                    // Maintain original order
                    const orderedColumns = COLUMN_OPTIONS.filter((c) =>
                      newColumns.includes(c.key)
                    ).map((c) => c.key);
                    onChange({ selectedColumns: orderedColumns });
                  }}
                  className=""
                />
                <span className="text-sm text-slate-700">{col.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Timeline Options */}
      <div>
        <h3 className="text-sm font-medium text-slate-800 mb-3">Timeline</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeGridLines}
              onChange={(e) => onChange({ includeGridLines: e.target.checked })}
              className=""
            />
            <span className="text-sm text-slate-700">Include grid lines</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeWeekends}
              onChange={(e) => onChange({ includeWeekends: e.target.checked })}
              className=""
            />
            <span className="text-sm text-slate-700">Include weekends</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeTodayMarker}
              onChange={(e) =>
                onChange({ includeTodayMarker: e.target.checked })
              }
              className=""
            />
            <span className="text-sm text-slate-700">Include today marker</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeDependencies}
              onChange={(e) =>
                onChange({ includeDependencies: e.target.checked })
              }
              className=""
            />
            <span className="text-sm text-slate-700">Include dependencies</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeHolidays}
              onChange={(e) => onChange({ includeHolidays: e.target.checked })}
              className=""
            />
            <span className="text-sm text-slate-700">Include holidays</span>
          </label>
        </div>
      </div>

      {/* Task Label Position */}
      <div>
        <h3 className="text-sm font-medium text-slate-800 mb-3">Task Labels</h3>
        <p className="text-xs text-slate-500 mb-3">
          Position of task names on the timeline bars
        </p>
        <div className="space-y-2">
          {LABEL_POSITION_OPTIONS.map((posOpt) => (
            <label
              key={posOpt.key}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="radio"
                name="labelPosition"
                value={posOpt.key}
                checked={options.taskLabelPosition === posOpt.key}
                onChange={() => onChange({ taskLabelPosition: posOpt.key })}
                className=""
              />
              <span className="text-sm text-slate-700">
                {posOpt.label} — {posOpt.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* General Options */}
      <div>
        <h3 className="text-sm font-medium text-slate-800 mb-3">Options</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeHeader}
              onChange={(e) => onChange({ includeHeader: e.target.checked })}
              className=""
            />
            <span className="text-sm text-slate-700">Include header row</span>
          </label>
        </div>
      </div>

      {/* Background Options */}
      <div>
        <h3 className="text-sm font-medium text-slate-800 mb-3">Background</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="background"
              value="white"
              checked={options.background === "white"}
              onChange={() => onChange({ background: "white" })}
              className=""
            />
            <span className="text-sm text-slate-700">White</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="background"
              value="transparent"
              checked={options.background === "transparent"}
              onChange={() => onChange({ background: "transparent" })}
              className=""
            />
            <span className="text-sm text-slate-700">Transparent</span>
          </label>
        </div>
      </div>

      {/* Estimated Dimensions & Warnings */}
      {estimatedDimensions && (
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <p className="text-xs text-slate-500">
            Estimated export size:{" "}
            <span className="font-medium text-slate-700 font-mono">
              {estimatedDimensions.width.toLocaleString()} ×{" "}
              {estimatedDimensions.height.toLocaleString()} px
            </span>
          </p>

          {/* Width Warning */}
          {estimatedDimensions.width > EXPORT_MAX_SAFE_WIDTH && (
            <div className="flex items-start gap-2 p-2 bg-amber-50 text-amber-700 rounded-lg text-xs">
              <Warning size={14} weight="bold" className="mt-0.5 flex-shrink-0" />
              <span>
                Export width exceeds {EXPORT_MAX_SAFE_WIDTH.toLocaleString()}px.
                Some browsers may have trouble rendering large images. Consider
                using &quot;Fit to width&quot; or a higher zoom.
              </span>
            </div>
          )}

          {/* Info about image size */}
          {estimatedDimensions.width > 4000 && estimatedDimensions.width <= EXPORT_MAX_SAFE_WIDTH && (
            <div className="flex items-start gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-xs">
              <Info size={14} weight="bold" className="mt-0.5 flex-shrink-0" />
              <span>
                Large export size. The image will work but may take a moment to
                generate.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
