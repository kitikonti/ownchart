/**
 * Shared export options component.
 * Contains settings common to all export formats: Date Range, Layout, Display Options.
 * Uses extracted common components for consistent styling.
 */

import type {
  ExportOptions,
  ExportColumnKey,
  ExportFormat,
  ExportBooleanKey,
} from "../../utils/export/types";
import type {
  UiDensity,
  TaskLabelPosition,
} from "../../types/preferences.types";
import { LabeledCheckbox } from "../common/LabeledCheckbox";
import { RadioOptionCard } from "../common/RadioOptionCard";
import { CollapsibleSection } from "../common/CollapsibleSection";
import { CheckboxGroup } from "../common/CheckboxGroup";
import { Input } from "../common/Input";
import { SectionHeader } from "../common/SectionHeader";
import { SegmentedControl } from "../common/SegmentedControl";
import type { SegmentedControlOption } from "../common/SegmentedControl";

// =============================================================================
// Constants
// =============================================================================

/** Density options for the export */
const DENSITY_OPTIONS: SegmentedControlOption[] = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "comfortable", label: "Comfortable" },
];

/** Task label position options for the export */
const LABEL_POSITION_OPTIONS: SegmentedControlOption[] = [
  { value: "before", label: "Before" },
  { value: "inside", label: "Inside" },
  { value: "after", label: "After" },
  { value: "none", label: "None" },
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

/** Timeline display options (using ExportBooleanKey for type safety) */
const TIMELINE_OPTIONS: { key: ExportBooleanKey; label: string }[] = [
  { key: "includeHeader", label: "Header row" },
  { key: "includeGridLines", label: "Grid lines" },
  { key: "includeWeekends", label: "Weekend shading" },
  { key: "includeTodayMarker", label: "Today marker" },
  { key: "includeDependencies", label: "Dependencies" },
  { key: "includeHolidays", label: "Holidays" },
];

// =============================================================================
// Helpers
// =============================================================================

/** Format a Date as ISO date string (YYYY-MM-DD) */
function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

// =============================================================================
// Component
// =============================================================================

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
  const showBackground = format === "png" || format === "svg";

  // Build checkbox items for columns
  const columnItems = COLUMN_OPTIONS.map((col) => ({
    key: col.key,
    label: col.label,
    checked: options.selectedColumns.includes(col.key),
  }));

  // Build checkbox items for timeline options (type-safe via ExportBooleanKey)
  const timelineItems = TIMELINE_OPTIONS.map((item) => ({
    key: item.key,
    label: item.label,
    checked: options[item.key],
  }));

  const handleColumnChange = (key: string, checked: boolean): void => {
    if (!COLUMN_OPTIONS.some((c) => c.key === key)) return;
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
    if (!TIMELINE_OPTIONS.some((item) => item.key === key)) return;
    onChange({ [key]: checked });
  };

  return (
    <div className="space-y-6">
      {/* ============ DATE RANGE ============ */}
      <section>
        <SectionHeader title="Date Range" variant="simple" />

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
              <Input
                type="date"
                value={options.customDateStart || ""}
                onChange={(e) => onChange({ customDateStart: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                aria-label="Custom start date"
              />
              <Input
                type="date"
                value={options.customDateEnd || ""}
                onChange={(e) => onChange({ customDateEnd: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                aria-label="Custom end date"
              />
            </div>
          </RadioOptionCard>
        </div>
      </section>

      {/* ============ BACKGROUND (PNG/SVG only) ============ */}
      {showBackground && (
        <section>
          <LabeledCheckbox
            id="export-transparent-bg"
            checked={options.background === "transparent"}
            onChange={(checked) =>
              onChange({ background: checked ? "transparent" : "white" })
            }
            title="Transparent background"
            description="Remove white background for overlay use"
          />
        </section>
      )}

      <div className="divider-h" />

      {/* ============ LAYOUT OPTIONS (Collapsible) ============ */}
      <CollapsibleSection title="Layout Options">
        {/* Row Density */}
        <div>
          <span className="block text-sm font-medium text-neutral-700 mb-2">
            Row Density
          </span>
          <SegmentedControl
            options={DENSITY_OPTIONS}
            value={options.density}
            onChange={(value) => onChange({ density: value as UiDensity })}
            ariaLabel="Row density"
            fullWidth
          />
        </div>

        {/* Columns */}
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
        {/* Timeline Elements */}
        <div>
          <span className="block text-sm font-medium text-neutral-700 mb-3">
            Show in Timeline
          </span>
          <CheckboxGroup
            items={timelineItems}
            onChange={handleTimelineChange}
          />
        </div>

        {/* Label Position */}
        <div>
          <span className="block text-sm font-medium text-neutral-700 mb-2">
            Label Position
          </span>
          <SegmentedControl
            options={LABEL_POSITION_OPTIONS}
            value={options.taskLabelPosition}
            onChange={(value) =>
              onChange({ taskLabelPosition: value as TaskLabelPosition })
            }
            layout="grid"
            ariaLabel="Task label position"
          />
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
