/**
 * Shared export options component.
 * Contains settings common to all export formats: Date Range, Layout, Display Options.
 * Uses extracted common components for consistent styling.
 */

import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useId,
  useMemo,
} from "react";
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
import { formatDateRange } from "../../utils/export/dateFormatting";
import { Alert } from "../common/Alert";
import { FieldLabel } from "../common/FieldLabel";
import { LabeledCheckbox } from "../common/LabeledCheckbox";
import { RadioOptionCard } from "../common/RadioOptionCard";
import { CollapsibleSection } from "../common/CollapsibleSection";
import { CheckboxGroup } from "../common/CheckboxGroup";
import { Input } from "../common/Input";
import { SectionHeader } from "../common/SectionHeader";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "../common/SegmentedControl";

// =============================================================================
// Constants
// =============================================================================

/** Density options for the export */
const DENSITY_OPTIONS: SegmentedControlOption<UiDensity>[] = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "comfortable", label: "Comfortable" },
];

/** Task label position options for the export */
const LABEL_POSITION_OPTIONS: SegmentedControlOption<TaskLabelPosition>[] = [
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
  // Stable IDs for aria-labelledby on the Date Range section landmark
  const dateRangeSectionId = useId();

  const showBackground = format === "png" || format === "svg";

  // ISO date strings sort lexicographically, so string comparison is equivalent
  // to chronological comparison — no Date conversion needed.
  const isCustomRangeInvalid =
    options.dateRangeMode === "custom" &&
    !!options.customDateStart &&
    !!options.customDateEnd &&
    options.customDateEnd < options.customDateStart;

  // Build checkbox items for columns — memoised to avoid recomputing when
  // unrelated options (zoom, date range, etc.) change.
  const columnItems = useMemo(
    () =>
      COLUMN_OPTIONS.map((col) => ({
        key: col.key,
        label: col.label,
        checked: options.selectedColumns.includes(col.key),
      })),
    [options.selectedColumns]
  );

  // Build checkbox items for timeline options — memoised independently of
  // column and date-range state.
  const timelineItems = useMemo(
    () =>
      TIMELINE_OPTIONS.map((item) => ({
        key: item.key,
        label: item.label,
        checked: options[item.key],
      })),
    // Depend only on the 6 boolean flags this memo actually reads
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      options.includeHeader,
      options.includeGridLines,
      options.includeWeekends,
      options.includeTodayMarker,
      options.includeDependencies,
      options.includeHolidays,
    ]
  );

  const handleColumnChange = useCallback(
    (key: string, checked: boolean): void => {
      const col = COLUMN_OPTIONS.find((c) => c.key === key);
      if (!col) return;
      const selected = new Set(options.selectedColumns);
      if (checked) selected.add(col.key);
      else selected.delete(col.key);
      // Re-derive in COLUMN_OPTIONS order to keep the output stable regardless
      // of the order in which checkboxes are toggled.
      const orderedColumns = COLUMN_OPTIONS.filter((c) =>
        selected.has(c.key)
      ).map((c) => c.key);
      onChange({ selectedColumns: orderedColumns });
    },
    [options.selectedColumns, onChange]
  );

  const handleTimelineChange = useCallback(
    (key: string, checked: boolean): void => {
      const opt = TIMELINE_OPTIONS.find((item) => item.key === key);
      if (!opt) return;
      // Build update via typed key so TypeScript verifies ExportBooleanKey maps to boolean
      const update: Partial<ExportOptions> = {};
      update[opt.key] = checked;
      onChange(update);
    },
    [onChange]
  );

  // Prevent the RadioOptionCard's label from consuming the click before the
  // native date-picker can receive focus.
  const handleDateInputClick = useCallback((e: ReactMouseEvent): void => {
    e.stopPropagation();
  }, []);

  return (
    <div className="space-y-6">
      {/* ============ DATE RANGE ============ */}
      <section aria-labelledby={dateRangeSectionId}>
        <SectionHeader
          id={dateRangeSectionId}
          title="Date Range"
          variant="simple"
        />

        <div className="space-y-2">
          <RadioOptionCard
            name="dateRangeMode"
            selected={options.dateRangeMode === "all"}
            onChange={() => onChange({ dateRangeMode: "all" })}
            title="Entire project"
            description={
              projectDateRange ? formatDateRange(projectDateRange) : undefined
            }
          />

          <RadioOptionCard
            name="dateRangeMode"
            selected={options.dateRangeMode === "visible"}
            onChange={() => onChange({ dateRangeMode: "visible" })}
            title="Visible range"
            description={
              visibleDateRange ? formatDateRange(visibleDateRange) : undefined
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
                onClick={handleDateInputClick}
                aria-label="Custom start date"
              />
              <Input
                type="date"
                value={options.customDateEnd || ""}
                onChange={(e) => onChange({ customDateEnd: e.target.value })}
                onClick={handleDateInputClick}
                aria-label="Custom end date"
              />
              {isCustomRangeInvalid && (
                <Alert variant="error">End date must be after start date</Alert>
              )}
            </div>
          </RadioOptionCard>
        </div>
      </section>

      {/* ============ BACKGROUND (PNG/SVG only) ============ */}
      {showBackground && (
        <div>
          <LabeledCheckbox
            id="export-transparent-bg"
            checked={options.background === "transparent"}
            onChange={(checked) =>
              onChange({ background: checked ? "transparent" : "white" })
            }
            title="Transparent background"
            description="Remove white background for overlay use"
          />
        </div>
      )}

      <div className="divider-h" />

      {/* ============ LAYOUT OPTIONS (Collapsible) ============ */}
      <CollapsibleSection title="Layout Options">
        {/* Row Density */}
        <div>
          <FieldLabel>Row Density</FieldLabel>
          <SegmentedControl
            options={DENSITY_OPTIONS}
            value={options.density}
            onChange={(value) => onChange({ density: value })}
            ariaLabel="Row density"
            fullWidth
          />
        </div>

        {/* Columns */}
        <div>
          <FieldLabel>Columns to Include</FieldLabel>
          <CheckboxGroup
            items={columnItems}
            onChange={handleColumnChange}
            ariaLabel="Columns to Include"
          />
          <p className="text-xs text-neutral-600 mt-2">
            Uncheck all for timeline-only export
          </p>
        </div>
      </CollapsibleSection>

      <div className="divider-h" />

      {/* ============ DISPLAY OPTIONS (Collapsible) ============ */}
      <CollapsibleSection title="Display Options">
        {/* Timeline Elements */}
        <div>
          <FieldLabel>Show in Timeline</FieldLabel>
          <CheckboxGroup
            items={timelineItems}
            onChange={handleTimelineChange}
            ariaLabel="Show in Timeline"
          />
        </div>

        {/* Label Position */}
        <div>
          <FieldLabel>Label Position</FieldLabel>
          <SegmentedControl
            options={LABEL_POSITION_OPTIONS}
            value={options.taskLabelPosition}
            onChange={(value) => onChange({ taskLabelPosition: value })}
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
