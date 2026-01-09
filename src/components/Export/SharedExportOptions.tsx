/**
 * Shared export options component.
 * Contains settings common to all export formats: Date Range, Layout, Display Options.
 */

import {
  CalendarBlank,
  Rows,
  Columns,
  GridNine,
  Tag,
  Palette,
} from "@phosphor-icons/react";
import type {
  ExportOptions,
  ExportColumnKey,
  ExportFormat,
} from "../../utils/export/types";
import type {
  UiDensity,
  TaskLabelPosition,
} from "../../types/preferences.types";

/**
 * Section header with icon.
 */
export function SectionHeader({
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

export interface SharedExportOptionsProps {
  options: ExportOptions;
  onChange: (options: Partial<ExportOptions>) => void;
  format: ExportFormat;
  projectDateRange?: { start: Date; end: Date };
  visibleDateRange?: { start: Date; end: Date };
}

export function SharedExportOptions({
  options,
  onChange,
  format,
  projectDateRange,
  visibleDateRange,
}: SharedExportOptionsProps): JSX.Element {
  // Format date for input
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  // Show background option for PNG and SVG only
  const showBackground = format === "png" || format === "svg";

  return (
    <div className="space-y-5">
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
                ? "bg-slate-50 border-slate-400"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="dateRangeMode"
              value="all"
              checked={options.dateRangeMode === "all"}
              onChange={() => onChange({ dateRangeMode: "all" })}
              className="accent-slate-700"
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
                ? "bg-slate-50 border-slate-400"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="dateRangeMode"
              value="visible"
              checked={options.dateRangeMode === "visible"}
              onChange={() => onChange({ dateRangeMode: "visible" })}
              className="accent-slate-700"
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
                ? "bg-slate-50 border-slate-400"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="dateRangeMode"
              value="custom"
              checked={options.dateRangeMode === "custom"}
              onChange={() => onChange({ dateRangeMode: "custom" })}
              className="mt-0.5 accent-slate-700"
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
                  className="accent-slate-700"
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
                    className="accent-slate-700 rounded"
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
                    className="accent-slate-700 rounded"
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
                        ? "bg-slate-700 border-slate-700 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    title={posOpt.description}
                  >
                    {posOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background (PNG/SVG only) */}
            {showBackground && (
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
                        ? "bg-slate-50 border-slate-400 text-slate-800"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
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
                        ? "bg-slate-50 border-slate-400 text-slate-800"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
