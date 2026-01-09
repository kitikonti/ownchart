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
  Rows,
  Columns,
  GridNine,
  Tag,
  Palette,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react";
import type { ExportOptions, ExportColumnKey } from "../../utils/export/types";
import {
  EXPORT_ZOOM_PRESETS,
  EXPORT_QUICK_PRESETS,
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
  EXPORT_ZOOM_READABLE_THRESHOLD,
  EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD,
} from "../../utils/export/types";
import {
  calculateTaskTableWidth,
  calculateEffectiveZoom,
  calculateDurationDays,
} from "../../utils/export";
import type {
  UiDensity,
  TaskLabelPosition,
} from "../../types/preferences.types";

/**
 * Section header with icon.
 */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}): JSX.Element {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
        <Icon size={16} weight="duotone" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/** Density options for the export */
const DENSITY_OPTIONS: {
  key: UiDensity;
  label: string;
  description: string;
}[] = [
  {
    key: "compact",
    label: "Compact",
    description: "28px rows",
  },
  { key: "normal", label: "Normal", description: "36px rows" },
  {
    key: "comfortable",
    label: "Comfortable",
    description: "44px rows",
  },
];

/** Task label position options for the export */
const LABEL_POSITION_OPTIONS: {
  key: TaskLabelPosition;
  label: string;
  description: string;
}[] = [
  { key: "before", label: "Before", description: "Label to the left" },
  { key: "inside", label: "Inside", description: "Label inside the bar" },
  { key: "after", label: "After", description: "Label to the right" },
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
    () =>
      calculateTaskTableWidth(
        options.selectedColumns,
        columnWidths,
        options.density
      ),
    [options.selectedColumns, columnWidths, options.density]
  );

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

  // Format date for input
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-5">
      {/* Timeline Scale Section */}
      <div>
        <SectionHeader
          icon={MagnifyingGlassPlus}
          title="Timeline Scale"
          subtitle="Control the horizontal spread of the timeline"
        />

        {/* Zoom Mode Selection */}
        <div className="space-y-1.5 mb-4">
          {/* Use Current View */}
          <label
            className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-150 ${
              options.zoomMode === "currentView"
                ? "bg-teal-50 border-[var(--color-teal-gray-400)]"
                : "border-slate-200 hover:border-[var(--color-teal-gray-400)] hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="zoomMode"
              value="currentView"
              checked={options.zoomMode === "currentView"}
              onChange={() => onChange({ zoomMode: "currentView" })}
              className="mt-0.5"
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
                ? "bg-teal-50 border-[var(--color-teal-gray-400)]"
                : "border-slate-200 hover:border-[var(--color-teal-gray-400)] hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="zoomMode"
              value="fitToWidth"
              checked={options.zoomMode === "fitToWidth"}
              onChange={() => onChange({ zoomMode: "fitToWidth" })}
              className="mt-0.5"
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
                    <span className="text-xs text-slate-400 font-medium">
                      px
                    </span>
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
                            ? "bg-teal-600 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-[var(--color-teal-gray-400)] hover:bg-slate-50"
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
                ? "bg-teal-50 border-[var(--color-teal-gray-400)]"
                : "border-slate-200 hover:border-[var(--color-teal-gray-400)] hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="zoomMode"
              value="custom"
              checked={options.zoomMode === "custom"}
              onChange={() => onChange({ zoomMode: "custom" })}
              className="mt-0.5"
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
                      className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer"
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
                            ? "bg-teal-600 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-[var(--color-teal-gray-400)] hover:bg-slate-50"
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

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* Date Range Section */}
      <div>
        <SectionHeader
          icon={CalendarBlank}
          title="Date Range"
          subtitle="Select which time period to export"
        />

        <div className="space-y-1.5">
          <label
            className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border transition-all duration-150 ${
              options.dateRangeMode === "all"
                ? "bg-teal-50 border-[var(--color-teal-gray-400)]"
                : "border-slate-200 hover:border-[var(--color-teal-gray-400)] hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="dateRangeMode"
              value="all"
              checked={options.dateRangeMode === "all"}
              onChange={() => onChange({ dateRangeMode: "all" })}
              className=""
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-800">
                Entire project
              </span>
              {projectDateRange && (
                <span className="text-xs text-slate-500 ml-2 font-mono">
                  {formatDateForInput(projectDateRange.start)} →{" "}
                  {formatDateForInput(projectDateRange.end)}
                </span>
              )}
            </div>
          </label>

          <label
            className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border transition-all duration-150 ${
              options.dateRangeMode === "visible"
                ? "bg-teal-50 border-[var(--color-teal-gray-400)]"
                : "border-slate-200 hover:border-[var(--color-teal-gray-400)] hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="dateRangeMode"
              value="visible"
              checked={options.dateRangeMode === "visible"}
              onChange={() => onChange({ dateRangeMode: "visible" })}
              className=""
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-800">
                Visible range only
              </span>
              {visibleDateRange && (
                <span className="text-xs text-slate-500 ml-2 font-mono">
                  {formatDateForInput(visibleDateRange.start)} →{" "}
                  {formatDateForInput(visibleDateRange.end)}
                </span>
              )}
            </div>
          </label>

          <label
            className={`flex items-start gap-3 cursor-pointer p-2.5 rounded-lg border transition-all duration-150 ${
              options.dateRangeMode === "custom"
                ? "bg-teal-50 border-[var(--color-teal-gray-400)]"
                : "border-slate-200 hover:border-[var(--color-teal-gray-400)] hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="dateRangeMode"
              value="custom"
              checked={options.dateRangeMode === "custom"}
              onChange={() => onChange({ dateRangeMode: "custom" })}
              className="mt-0.5"
              aria-label="Custom date range"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-800">
                Custom range
              </span>

              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  options.dateRangeMode === "custom"
                    ? "max-h-16 opacity-100 mt-2"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={options.customDateStart || ""}
                    onChange={(e) =>
                      onChange({ customDateStart: e.target.value })
                    }
                    className="px-2 py-1.5 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-shadow"
                  />
                  <span className="text-slate-400">→</span>
                  <input
                    type="date"
                    value={options.customDateEnd || ""}
                    onChange={(e) =>
                      onChange({ customDateEnd: e.target.value })
                    }
                    className="px-2 py-1.5 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-shadow"
                  />
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* Layout Section - Row Density + Columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Row Density */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Rows size={14} weight="duotone" className="text-slate-500" />
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Row Density
            </h4>
          </div>
          <div className="space-y-0.5">
            {DENSITY_OPTIONS.map((densityOpt) => (
              <label
                key={densityOpt.key}
                className="flex items-center gap-2 cursor-pointer py-1 rounded hover:bg-slate-50 transition-colors"
              >
                <input
                  type="radio"
                  name="density"
                  value={densityOpt.key}
                  checked={options.density === densityOpt.key}
                  onChange={() => onChange({ density: densityOpt.key })}
                  className=""
                  aria-label={`${densityOpt.label} density`}
                />
                <span className="text-sm text-slate-700">
                  {densityOpt.label}
                </span>
                <span className="text-xs text-slate-400">
                  {densityOpt.description}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Column Selection */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Columns size={14} weight="duotone" className="text-slate-500" />
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              List Columns
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {COLUMN_OPTIONS.map((col) => {
              const isSelected = options.selectedColumns.includes(col.key);
              return (
                <label
                  key={col.key}
                  className="flex items-center gap-2 cursor-pointer py-1 rounded hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newColumns = e.target.checked
                        ? [...options.selectedColumns, col.key]
                        : options.selectedColumns.filter((k) => k !== col.key);
                      const orderedColumns = COLUMN_OPTIONS.filter((c) =>
                        newColumns.includes(c.key)
                      ).map((c) => c.key);
                      onChange({ selectedColumns: orderedColumns });
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">{col.label}</span>
                </label>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Leave all unchecked for timeline only
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* Display Options */}
      <div>
        <SectionHeader
          icon={GridNine}
          title="Display Options"
          subtitle="Configure what elements appear in the export"
        />

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {/* Timeline Toggles */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Timeline Elements
            </h4>
            <div className="space-y-0.5">
              {[
                { key: "includeGridLines", label: "Grid lines" },
                { key: "includeWeekends", label: "Weekend shading" },
                { key: "includeTodayMarker", label: "Today marker" },
                { key: "includeDependencies", label: "Dependencies" },
                { key: "includeHolidays", label: "Holidays" },
                { key: "includeHeader", label: "Header row" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 cursor-pointer py-1 rounded hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={
                      options[item.key as keyof ExportOptions] as boolean
                    }
                    onChange={(e) => onChange({ [item.key]: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Task Labels & Background */}
          <div className="space-y-4">
            {/* Task Label Position */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag size={14} weight="duotone" className="text-slate-500" />
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Task Labels
                </h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {LABEL_POSITION_OPTIONS.map((posOpt) => (
                  <button
                    key={posOpt.key}
                    type="button"
                    onClick={() => onChange({ taskLabelPosition: posOpt.key })}
                    className={`px-2 py-1.5 text-xs rounded-md border transition-all duration-150 ${
                      options.taskLabelPosition === posOpt.key
                        ? "bg-teal-600 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-[var(--color-teal-gray-400)] hover:bg-slate-50"
                    }`}
                    title={posOpt.description}
                  >
                    {posOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Palette
                  size={14}
                  weight="duotone"
                  className="text-slate-500"
                />
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Background
                </h4>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ background: "white" })}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-all duration-150 ${
                    options.background === "white"
                      ? "bg-teal-50 border-[var(--color-teal-gray-400)] text-slate-800"
                      : "bg-white border-slate-200 text-slate-600 hover:border-[var(--color-teal-gray-400)]"
                  }`}
                >
                  <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
                  White
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ background: "transparent" })}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-all duration-150 ${
                    options.background === "transparent"
                      ? "bg-teal-50 border-[var(--color-teal-gray-400)] text-slate-800"
                      : "bg-white border-slate-200 text-slate-600 hover:border-[var(--color-teal-gray-400)]"
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded border border-slate-300"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                        linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                        linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)`,
                      backgroundSize: "6px 6px",
                      backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
                    }}
                  />
                  Transparent
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
