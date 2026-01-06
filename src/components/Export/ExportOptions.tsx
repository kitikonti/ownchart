/**
 * Export options form component.
 */

import type { ExportOptions, ExportColumnKey } from "../../utils/export/types";
import { EXPORT_ZOOM_PRESETS } from "../../utils/export/types";
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
}

export function ExportOptionsForm({
  options,
  onChange,
  estimatedDimensions,
}: ExportOptionsFormProps): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Timeline Scale Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Timeline Scale
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Controls how spread out the timeline appears horizontally
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="zoom"
              value="COMPACT"
              checked={options.timelineZoom === EXPORT_ZOOM_PRESETS.COMPACT}
              onChange={() =>
                onChange({ timelineZoom: EXPORT_ZOOM_PRESETS.COMPACT })
              }
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Compact (50%) — fits more time in less space
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="zoom"
              value="STANDARD"
              checked={options.timelineZoom === EXPORT_ZOOM_PRESETS.STANDARD}
              onChange={() =>
                onChange({ timelineZoom: EXPORT_ZOOM_PRESETS.STANDARD })
              }
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Standard (100%) —{" "}
              <span className="text-blue-600">Recommended</span>
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="zoom"
              value="DETAILED"
              checked={options.timelineZoom === EXPORT_ZOOM_PRESETS.DETAILED}
              onChange={() =>
                onChange({ timelineZoom: EXPORT_ZOOM_PRESETS.DETAILED })
              }
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Detailed (150%) — more space per day
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="zoom"
              value="EXPANDED"
              checked={options.timelineZoom === EXPORT_ZOOM_PRESETS.EXPANDED}
              onChange={() =>
                onChange({ timelineZoom: EXPORT_ZOOM_PRESETS.EXPANDED })
              }
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Expanded (200%) — maximum detail
            </span>
          </label>
        </div>
      </div>

      {/* Row Density Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Row Density</h3>
        <p className="text-xs text-gray-500 mb-3">
          Controls the vertical spacing of rows
        </p>
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
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                {densityOpt.label} — {densityOpt.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Column Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">List Columns</h3>
        <p className="text-xs text-gray-500 mb-3">
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
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{col.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Timeline Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Timeline</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeGridLines}
              onChange={(e) => onChange({ includeGridLines: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Include grid lines</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeWeekends}
              onChange={(e) => onChange({ includeWeekends: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Include weekends</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeTodayMarker}
              onChange={(e) =>
                onChange({ includeTodayMarker: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Include today marker</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeDependencies}
              onChange={(e) =>
                onChange({ includeDependencies: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Include dependencies</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeHolidays}
              onChange={(e) => onChange({ includeHolidays: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Include holidays</span>
          </label>
        </div>
      </div>

      {/* Task Label Position */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Task Labels
        </h3>
        <p className="text-xs text-gray-500 mb-3">
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
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                {posOpt.label} — {posOpt.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* General Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Options</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeHeader}
              onChange={(e) => onChange({ includeHeader: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Include header row</span>
          </label>
        </div>
      </div>

      {/* Background Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Background</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="background"
              value="white"
              checked={options.background === "white"}
              onChange={() => onChange({ background: "white" })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">White</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="background"
              value="transparent"
              checked={options.background === "transparent"}
              onChange={() => onChange({ background: "transparent" })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">Transparent</span>
          </label>
        </div>
      </div>

      {/* Estimated Dimensions */}
      {estimatedDimensions && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Estimated export size:{" "}
            <span className="font-medium text-gray-700">
              {estimatedDimensions.width} × {estimatedDimensions.height} px
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
