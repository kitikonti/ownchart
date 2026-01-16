/**
 * Shared export options component.
 * Contains settings common to all export formats: Date Range, Layout, Display Options.
 * Uses extracted common components for consistent styling.
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
import { Checkbox } from "../common/Checkbox";
import { RadioOptionCard } from "../common/RadioOptionCard";
import { CollapsibleSection } from "../common/CollapsibleSection";
import { CheckboxGroup } from "../common/CheckboxGroup";

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
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const showBackground = format === "png" || format === "svg";

  // Build checkbox items for columns
  const columnItems = COLUMN_OPTIONS.map((col) => ({
    key: col.key,
    label: col.label,
    checked: options.selectedColumns.includes(col.key),
  }));

  // Build checkbox items for timeline options
  const timelineItems = TIMELINE_OPTIONS.map((item) => ({
    key: item.key,
    label: item.label,
    checked: options[item.key] as boolean,
  }));

  const handleColumnChange = (key: string, checked: boolean): void => {
    const columnKey = key as ExportColumnKey;
    const newColumns = checked
      ? [...options.selectedColumns, columnKey]
      : options.selectedColumns.filter((k) => k !== columnKey);
    const orderedColumns = COLUMN_OPTIONS.filter((c) =>
      newColumns.includes(c.key)
    ).map((c) => c.key);
    onChange({ selectedColumns: orderedColumns });
  };

  const handleTimelineChange = (key: string, checked: boolean): void => {
    onChange({ [key]: checked });
  };

  return (
    <div className="space-y-6">
      {/* ============ DATE RANGE ============ */}
      <section>
        <span className="block text-sm font-semibold text-neutral-900 mb-3">
          Date Range
        </span>

        <div className="space-y-2">
          <RadioOptionCard
            name="dateRangeMode"
            selected={options.dateRangeMode === "all"}
            onChange={() => onChange({ dateRangeMode: "all" })}
            title="Entire project"
            description={
              projectDateRange
                ? `${formatDate(projectDateRange.start)} – ${formatDate(projectDateRange.end)}`
                : undefined
            }
          />

          <RadioOptionCard
            name="dateRangeMode"
            selected={options.dateRangeMode === "visible"}
            onChange={() => onChange({ dateRangeMode: "visible" })}
            title="Visible range"
            description={
              visibleDateRange
                ? `${formatDate(visibleDateRange.start)} – ${formatDate(visibleDateRange.end)}`
                : undefined
            }
          />

          <RadioOptionCard
            name="dateRangeMode"
            selected={options.dateRangeMode === "custom"}
            onChange={() => onChange({ dateRangeMode: "custom" })}
            title="Custom range"
          >
            <div className="space-y-2">
              <input
                type="date"
                value={options.customDateStart || ""}
                onChange={(e) => onChange({ customDateStart: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 hover:border-neutral-400"
                aria-label="Custom start date"
              />
              <input
                type="date"
                value={options.customDateEnd || ""}
                onChange={(e) => onChange({ customDateEnd: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 hover:border-neutral-400"
                aria-label="Custom end date"
              />
            </div>
          </RadioOptionCard>
        </div>
      </section>

      {/* ============ BACKGROUND (PNG/SVG only) ============ */}
      {showBackground && (
        <section>
          <label
            htmlFor="export-transparent-bg"
            className="flex items-center gap-3.5 p-4 rounded border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors duration-150 min-h-[44px]"
          >
            <Checkbox
              id="export-transparent-bg"
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
      <CollapsibleSection title="Layout Options">
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

        {/* Columns - Checkbox Group */}
        <div>
          <span className="block text-sm font-medium text-neutral-700 mb-3">
            Columns to Include
          </span>
          <CheckboxGroup items={columnItems} onChange={handleColumnChange} />
          <p className="text-xs text-neutral-500 mt-2">
            Uncheck all for timeline-only export
          </p>
        </div>
      </CollapsibleSection>

      <div className="divider-h" />

      {/* ============ DISPLAY OPTIONS (Collapsible) ============ */}
      <CollapsibleSection title="Display Options">
        {/* Timeline Elements - Checkbox Group */}
        <div>
          <span className="block text-sm font-medium text-neutral-700 mb-3">
            Show in Timeline
          </span>
          <CheckboxGroup
            items={timelineItems}
            onChange={handleTimelineChange}
          />
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
      </CollapsibleSection>
    </div>
  );
}
