/**
 * Shared export options component.
 * Contains settings common to all export formats: Date Range, Layout, Display Options.
 */

import type {
  ExportOptions,
  ExportColumnKey,
  ExportFormat,
} from "../../utils/export/types";
import type {
  UiDensity,
  TaskLabelPosition,
} from "../../types/preferences.types";

/** Density options for the export */
const DENSITY_OPTIONS: {
  key: UiDensity;
  label: string;
  description: string;
}[] = [
  { key: "compact", label: "Compact", description: "28px" },
  { key: "normal", label: "Normal", description: "36px" },
  { key: "comfortable", label: "Comfortable", description: "44px" },
];

/** Task label position options for the export */
const LABEL_POSITION_OPTIONS: {
  key: TaskLabelPosition;
  label: string;
}[] = [
  { key: "before", label: "Before" },
  { key: "inside", label: "Inside" },
  { key: "after", label: "After" },
  { key: "none", label: "None" },
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
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const showBackground = format === "png" || format === "svg";

  return (
    <div className="space-y-16">
      {/* ============ DATE RANGE ============ */}
      <section>
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-0.5 mb-3 border-b border-slate-200">
          Date Range
        </h3>

        <div className="space-y-2">
          {/* Entire project */}
          <label
            className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
              options.dateRangeMode === "all"
                ? "bg-teal-50 border-[var(--color-teal-gray-400)]"
                : "border-slate-200 hover:border-[var(--color-teal-gray-400)]"
            }`}
          >
            <input
              type="radio"
              name="dateRangeMode"
              checked={options.dateRangeMode === "all"}
              onChange={() => onChange({ dateRangeMode: "all" })}
              className="w-4 h-4"
            />
            <div className="flex-1 flex items-center justify-between">
              <span className={`text-sm font-medium ${options.dateRangeMode === "all" ? "text-[var(--color-teal-gray-900)]" : "text-slate-800"}`}>Entire project</span>
              {projectDateRange && (
                <span className={`text-xs font-mono ${options.dateRangeMode === "all" ? "text-[var(--color-teal-gray-700)]" : "text-slate-400"}`}>
                  {formatDate(projectDateRange.start)} – {formatDate(projectDateRange.end)}
                </span>
              )}
            </div>
          </label>

          {/* Visible range */}
          <label
            className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
              options.dateRangeMode === "visible"
                ? "bg-teal-50 border-[var(--color-teal-gray-400)]"
                : "border-slate-200 hover:border-[var(--color-teal-gray-400)]"
            }`}
          >
            <input
              type="radio"
              name="dateRangeMode"
              checked={options.dateRangeMode === "visible"}
              onChange={() => onChange({ dateRangeMode: "visible" })}
              className="w-4 h-4"
            />
            <div className="flex-1 flex items-center justify-between">
              <span className={`text-sm font-medium ${options.dateRangeMode === "visible" ? "text-[var(--color-teal-gray-900)]" : "text-slate-800"}`}>Visible range</span>
              {visibleDateRange && (
                <span className={`text-xs font-mono ${options.dateRangeMode === "visible" ? "text-[var(--color-teal-gray-700)]" : "text-slate-400"}`}>
                  {formatDate(visibleDateRange.start)} – {formatDate(visibleDateRange.end)}
                </span>
              )}
            </div>
          </label>

          {/* Custom range */}
          <label
            className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
              options.dateRangeMode === "custom"
                ? "bg-teal-50 border-[var(--color-teal-gray-400)]"
                : "border-slate-200 hover:border-[var(--color-teal-gray-400)]"
            }`}
          >
            <input
              type="radio"
              name="dateRangeMode"
              checked={options.dateRangeMode === "custom"}
              onChange={() => onChange({ dateRangeMode: "custom" })}
              className="mt-0.5 w-4 h-4"
            />
            <div className="flex-1">
              <span className={`text-sm font-medium ${options.dateRangeMode === "custom" ? "text-[var(--color-teal-gray-900)]" : "text-slate-800"}`}>Custom range</span>

              {options.dateRangeMode === "custom" && (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="date"
                    value={options.customDateStart || ""}
                    onChange={(e) => onChange({ customDateStart: e.target.value })}
                    className="px-2.5 py-1.5 text-sm font-mono bg-white border border-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <span className="text-[var(--color-teal-gray-500)]">–</span>
                  <input
                    type="date"
                    value={options.customDateEnd || ""}
                    onChange={(e) => onChange({ customDateEnd: e.target.value })}
                    className="px-2.5 py-1.5 text-sm font-mono bg-white border border-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </label>
        </div>
      </section>

      {/* ============ LAYOUT ============ */}
      <section>
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-0.5 mb-3 border-b border-slate-200">
          Layout
        </h3>

        <div className="grid grid-cols-2 gap-8">
          {/* Row Density */}
          <div>
            <span className="text-xs font-medium text-slate-500 mb-2.5 block">
              Row density
            </span>
            <div className="space-y-1.5">
              {DENSITY_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="density"
                    checked={options.density === opt.key}
                    onChange={() => onChange({ density: opt.key })}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-400">{opt.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div>
            <span className="text-xs font-medium text-slate-500 mb-2.5 block">
              Table columns
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {COLUMN_OPTIONS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={options.selectedColumns.includes(col.key)}
                    onChange={(e) => {
                      const newColumns = e.target.checked
                        ? [...options.selectedColumns, col.key]
                        : options.selectedColumns.filter((k) => k !== col.key);
                      const orderedColumns = COLUMN_OPTIONS.filter((c) =>
                        newColumns.includes(c.key)
                      ).map((c) => c.key);
                      onChange({ selectedColumns: orderedColumns });
                    }}
                    className="w-3.5 h-3.5 rounded"
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {col.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5">
              Uncheck all for timeline only
            </p>
          </div>
        </div>
      </section>

      {/* ============ DISPLAY ============ */}
      <section>
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-0.5 mb-3 border-b border-slate-200">
          Display
        </h3>

        <div className="grid grid-cols-2 gap-8">
          {/* Timeline elements */}
          <div>
            <span className="text-xs font-medium text-slate-500 mb-2.5 block">
              Show in timeline
            </span>
            <div className="space-y-1.5">
              {[
                { key: "includeHeader", label: "Header row" },
                { key: "includeGridLines", label: "Grid lines" },
                { key: "includeWeekends", label: "Weekend shading" },
                { key: "includeTodayMarker", label: "Today marker" },
                { key: "includeDependencies", label: "Dependencies" },
                { key: "includeHolidays", label: "Holidays" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={options[item.key as keyof ExportOptions] as boolean}
                    onChange={(e) => onChange({ [item.key]: e.target.checked })}
                    className="w-3.5 h-3.5 rounded"
                  />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Task labels & Background */}
          <div className="space-y-6">
            {/* Task labels */}
            <div>
              <span className="text-xs font-medium text-slate-500 mb-2.5 block">
                Task labels
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LABEL_POSITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => onChange({ taskLabelPosition: opt.key })}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      options.taskLabelPosition === opt.key
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-[var(--color-teal-gray-100)] hover:text-[var(--color-teal-gray-700)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background */}
            {showBackground && (
              <div>
                <span className="text-xs font-medium text-slate-500 mb-2.5 block">
                  Background
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ background: "white" })}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${
                      options.background === "white"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-[var(--color-teal-gray-100)] hover:text-[var(--color-teal-gray-700)]"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-sm bg-white border border-slate-300" />
                    White
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ background: "transparent" })}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${
                      options.background === "transparent"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-[var(--color-teal-gray-100)] hover:text-[var(--color-teal-gray-700)]"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-sm border border-slate-300"
                      style={{
                        backgroundImage: `linear-gradient(45deg, #cbd5e1 25%, transparent 25%),
                          linear-gradient(-45deg, #cbd5e1 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #cbd5e1 75%),
                          linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`,
                        backgroundSize: "4px 4px",
                        backgroundPosition: "0 0, 0 2px, 2px -2px, -2px 0px",
                      }}
                    />
                    Transparent
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
