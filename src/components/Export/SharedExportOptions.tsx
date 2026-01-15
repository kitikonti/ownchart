/**
 * Shared export options component.
 * Contains settings common to all export formats: Date Range, Layout, Display Options.
 * Uses Figma-style collapsible sections and form elements.
 */

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import type {
  ExportOptions,
  ExportColumnKey,
  ExportFormat,
} from "../../utils/export/types";
import type {
  UiDensity,
  TaskLabelPosition,
} from "../../types/preferences.types";
import { Checkbox } from "../common/Checkbox";
import { Radio } from "../common/Radio";

/** Density options for the export */
const DENSITY_OPTIONS: {
  key: UiDensity;
  label: string;
}[] = [
  { key: "compact", label: "Compact" },
  { key: "normal", label: "Normal" },
  { key: "comfortable", label: "Comfortable" },
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
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "duration", label: "Duration" },
  { key: "progress", label: "Progress" },
];

/** Timeline display options */
const TIMELINE_OPTIONS: { key: keyof ExportOptions; label: string }[] = [
  { key: "includeHeader", label: "Header row" },
  { key: "includeGridLines", label: "Grid lines" },
  { key: "includeWeekends", label: "Weekend shading" },
  { key: "includeTodayMarker", label: "Today marker" },
  { key: "includeDependencies", label: "Dependencies" },
  { key: "includeHolidays", label: "Holidays" },
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
  const [showLayout, setShowLayout] = useState(false);
  const [showDisplay, setShowDisplay] = useState(false);

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const showBackground = format === "png" || format === "svg";

  return (
    <div className="space-y-6">
      {/* ============ DATE RANGE ============ */}
      <section>
        <span className="block text-sm font-semibold text-neutral-900 mb-3">
          Date Range
        </span>

        <div className="space-y-2">
          {/* Entire project */}
          <label
            className={`flex items-center gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50 ${
              options.dateRangeMode === "all"
                ? "border-neutral-300 border-l-[3px] border-l-brand-600"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <Radio
              checked={options.dateRangeMode === "all"}
              onChange={() => onChange({ dateRangeMode: "all" })}
              name="dateRangeMode"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-900">
                Entire project
              </div>
              {projectDateRange && (
                <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                  {formatDate(projectDateRange.start)} –{" "}
                  {formatDate(projectDateRange.end)}
                </div>
              )}
            </div>
          </label>

          {/* Visible range */}
          <label
            className={`flex items-center gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50 ${
              options.dateRangeMode === "visible"
                ? "border-neutral-300 border-l-[3px] border-l-brand-600"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <Radio
              checked={options.dateRangeMode === "visible"}
              onChange={() => onChange({ dateRangeMode: "visible" })}
              name="dateRangeMode"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-900">
                Visible range
              </div>
              {visibleDateRange && (
                <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                  {formatDate(visibleDateRange.start)} –{" "}
                  {formatDate(visibleDateRange.end)}
                </div>
              )}
            </div>
          </label>

          {/* Custom range */}
          <label
            className={`flex items-start gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50 ${
              options.dateRangeMode === "custom"
                ? "border-neutral-300 border-l-[3px] border-l-brand-600"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div className="mt-0.5">
              <Radio
                checked={options.dateRangeMode === "custom"}
                onChange={() => onChange({ dateRangeMode: "custom" })}
                name="dateRangeMode"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-900 mb-2">
                Custom range
              </div>
              {options.dateRangeMode === "custom" && (
                <div className="space-y-2">
                  <input
                    type="date"
                    value={options.customDateStart || ""}
                    onChange={(e) =>
                      onChange({ customDateStart: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 hover:border-neutral-400"
                    aria-label="Custom start date"
                  />
                  <input
                    type="date"
                    value={options.customDateEnd || ""}
                    onChange={(e) =>
                      onChange({ customDateEnd: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 hover:border-neutral-400"
                    aria-label="Custom end date"
                  />
                </div>
              )}
            </div>
          </label>
        </div>
      </section>

      {/* ============ BACKGROUND (PNG/SVG only) ============ */}
      {showBackground && (
        <section>
          <label className="flex items-center gap-3.5 p-4 rounded border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors duration-150 min-h-[44px]">
            <Checkbox
              checked={options.background === "transparent"}
              onChange={(checked) =>
                onChange({ background: checked ? "transparent" : "white" })
              }
              aria-label="Transparent background"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-neutral-900">
                Transparent background
              </span>
              <span className="block text-xs text-neutral-500 mt-0.5">
                Remove white background for overlay use
              </span>
            </div>
          </label>
        </section>
      )}

      <div className="divider-h" />

      {/* ============ LAYOUT OPTIONS (Collapsible) ============ */}
      <section>
        <button
          onClick={() => setShowLayout(!showLayout)}
          aria-expanded={showLayout}
          className="w-full flex items-center justify-between p-4 rounded hover:bg-neutral-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:ring-offset-2"
        >
          <span className="text-sm font-semibold text-neutral-900">
            Layout Options
          </span>
          <CaretDown
            className={`size-4 text-neutral-500 transition-transform duration-200 ${
              showLayout ? "rotate-180" : ""
            }`}
            weight="bold"
          />
        </button>

        {showLayout && (
          <div className="mt-3 bg-neutral-50 rounded px-6 py-4 space-y-5">
            {/* Row Density - Segmented Control */}
            <div>
              <span className="block text-sm font-medium text-neutral-700 mb-2">
                Row Density
              </span>
              <div className="inline-flex rounded border border-neutral-300 overflow-hidden w-full">
                {DENSITY_OPTIONS.map((opt, index) => (
                  <button
                    key={opt.key}
                    onClick={() => onChange({ density: opt.key })}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 ${
                      index > 0 ? "border-l border-neutral-300" : ""
                    } ${
                      options.density === opt.key
                        ? "bg-brand-600 text-white"
                        : "bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Columns - Checkbox Group in Card */}
            <div>
              <span className="block text-sm font-medium text-neutral-700 mb-3">
                Columns to Include
              </span>
              <div className="bg-white border border-neutral-200 rounded p-3">
                <div className="space-y-2.5">
                  {COLUMN_OPTIONS.map((col, idx, arr) => (
                    <div key={col.key}>
                      <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
                        <Checkbox
                          checked={options.selectedColumns.includes(col.key)}
                          onChange={(checked) => {
                            const newColumns = checked
                              ? [...options.selectedColumns, col.key]
                              : options.selectedColumns.filter(
                                  (k) => k !== col.key
                                );
                            const orderedColumns = COLUMN_OPTIONS.filter((c) =>
                              newColumns.includes(c.key)
                            ).map((c) => c.key);
                            onChange({ selectedColumns: orderedColumns });
                          }}
                        />
                        <span className="text-sm text-neutral-900">
                          {col.label}
                        </span>
                      </label>
                      {idx < arr.length - 1 && (
                        <div className="divider-h-light mt-2.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Uncheck all for timeline-only export
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="divider-h" />

      {/* ============ DISPLAY OPTIONS (Collapsible) ============ */}
      <section>
        <button
          onClick={() => setShowDisplay(!showDisplay)}
          aria-expanded={showDisplay}
          className="w-full flex items-center justify-between p-4 rounded hover:bg-neutral-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:ring-offset-2"
        >
          <span className="text-sm font-semibold text-neutral-900">
            Display Options
          </span>
          <CaretDown
            className={`size-4 text-neutral-500 transition-transform duration-200 ${
              showDisplay ? "rotate-180" : ""
            }`}
            weight="bold"
          />
        </button>

        {showDisplay && (
          <div className="mt-3 bg-neutral-50 rounded px-6 py-4 space-y-5">
            {/* Timeline Elements - Checkbox Group in Card */}
            <div>
              <span className="block text-sm font-medium text-neutral-700 mb-3">
                Show in Timeline
              </span>
              <div className="bg-white border border-neutral-200 rounded p-3">
                <div className="space-y-2.5">
                  {TIMELINE_OPTIONS.map((item, idx, arr) => (
                    <div key={item.key}>
                      <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
                        <Checkbox
                          checked={options[item.key] as boolean}
                          onChange={(checked) =>
                            onChange({ [item.key]: checked })
                          }
                        />
                        <span className="text-sm text-neutral-900">
                          {item.label}
                        </span>
                      </label>
                      {idx < arr.length - 1 && (
                        <div className="divider-h-light mt-2.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Label Position - 2x2 Grid Buttons */}
            <div>
              <span className="block text-sm font-medium text-neutral-700 mb-2">
                Label Position
              </span>
              <div className="grid grid-cols-2 gap-2">
                {LABEL_POSITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => onChange({ taskLabelPosition: opt.key })}
                    className={`px-4 py-2 text-sm font-medium rounded border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:ring-offset-2 ${
                      options.taskLabelPosition === opt.key
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {options.taskLabelPosition === "inside" && (
                <div className="mt-3 text-xs text-neutral-600 bg-white rounded px-3 py-2.5 border border-neutral-200">
                  Note: Milestones and summary tasks default to &quot;After&quot;
                  positioning
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
