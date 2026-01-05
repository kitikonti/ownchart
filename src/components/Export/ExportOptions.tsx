/**
 * Export options form component.
 */

import type { ExportOptions } from "../../utils/export/types";
import { EXPORT_WIDTH_PRESETS } from "../../utils/export/types";

export interface ExportOptionsFormProps {
  options: ExportOptions;
  onChange: (options: Partial<ExportOptions>) => void;
  customWidth: string;
  onCustomWidthChange: (value: string) => void;
  selectedPreset: string | "custom";
  onPresetChange: (preset: string | "custom") => void;
}

export function ExportOptionsForm({
  options,
  onChange,
  customWidth,
  onCustomWidthChange,
  selectedPreset,
  onPresetChange,
}: ExportOptionsFormProps): JSX.Element {
  const handlePresetChange = (value: string) => {
    onPresetChange(value);
    if (value !== "custom") {
      const width = EXPORT_WIDTH_PRESETS[value as keyof typeof EXPORT_WIDTH_PRESETS];
      onChange({ width });
    }
  };

  const handleCustomWidthChange = (value: string) => {
    onCustomWidthChange(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      onChange({ width: Math.min(numValue, 7680) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Width Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Width</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="width"
              value="HD"
              checked={selectedPreset === "HD"}
              onChange={() => handlePresetChange("HD")}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">1280px (HD)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="width"
              value="FULL_HD"
              checked={selectedPreset === "FULL_HD"}
              onChange={() => handlePresetChange("FULL_HD")}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              1920px (Full HD) - <span className="text-blue-600">Recommended</span>
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="width"
              value="QHD"
              checked={selectedPreset === "QHD"}
              onChange={() => handlePresetChange("QHD")}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">2560px (QHD)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="width"
              value="4K"
              checked={selectedPreset === "4K"}
              onChange={() => handlePresetChange("4K")}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">3840px (4K)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="width"
              value="custom"
              checked={selectedPreset === "custom"}
              onChange={() => handlePresetChange("custom")}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">Custom:</span>
            <input
              type="number"
              min="320"
              max="7680"
              value={customWidth}
              onChange={(e) => handleCustomWidthChange(e.target.value)}
              disabled={selectedPreset !== "custom"}
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:bg-gray-100"
              placeholder="Width"
            />
            <span className="text-sm text-gray-500">px</span>
          </label>
        </div>
      </div>

      {/* Include Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Include</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeTaskList}
              onChange={(e) => onChange({ includeTaskList: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Task list (left panel)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeHeader}
              onChange={(e) => onChange({ includeHeader: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Timeline header</span>
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
    </div>
  );
}
