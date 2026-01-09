/**
 * SVG export options component.
 * Provides controls for dimensions, text handling, styling, and optimization.
 */

import { useState } from "react";
import {
  ArrowsOutSimple,
  TextT,
  Code,
  CaretDown,
  CaretUp,
  Copy,
} from "@phosphor-icons/react";
import type { SvgExportOptions as SvgOptions } from "../../utils/export/types";

interface SvgExportOptionsProps {
  options: SvgOptions;
  onChange: (options: Partial<SvgOptions>) => void;
}

export function SvgExportOptions({
  options,
  onChange,
}: SvgExportOptionsProps): JSX.Element {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-5">
      {/* Dimensions Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowsOutSimple
            size={16}
            weight="duotone"
            className="text-slate-500"
          />
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Dimensions
          </h4>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="svg-dim-auto"
            aria-label="Auto dimension mode"
            className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
              options.dimensionMode === "auto"
                ? "bg-slate-50 border-slate-400"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              id="svg-dim-auto"
              type="radio"
              name="dimensionMode"
              value="auto"
              checked={options.dimensionMode === "auto"}
              onChange={() => onChange({ dimensionMode: "auto" })}
              className="accent-slate-700"
            />
            <div>
              <span className="text-sm font-medium text-slate-800">
                Auto (fit content)
              </span>
              <p className="text-xs text-slate-500">
                Size matches chart dimensions
              </p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
              options.dimensionMode === "custom"
                ? "bg-slate-50 border-slate-400"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="dimensionMode"
              value="custom"
              checked={options.dimensionMode === "custom"}
              onChange={() =>
                onChange({ dimensionMode: "custom", customWidth: 1200 })
              }
              className="mt-0.5 accent-slate-700"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-800">
                Custom size
              </span>
              {options.dimensionMode === "custom" && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    value={options.customWidth || 1200}
                    onChange={(e) =>
                      onChange({
                        customWidth: Math.max(
                          100,
                          parseInt(e.target.value) || 1200
                        ),
                      })
                    }
                    className="w-20 px-2 py-1.5 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400"
                    min={100}
                  />
                  <span className="text-slate-400">×</span>
                  <input
                    type="number"
                    value={options.customHeight || ""}
                    onChange={(e) =>
                      onChange({
                        customHeight: e.target.value
                          ? Math.max(100, parseInt(e.target.value))
                          : undefined,
                      })
                    }
                    placeholder="auto"
                    className="w-20 px-2 py-1.5 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400"
                    min={100}
                  />
                  <span className="text-xs text-slate-400">px</span>
                </div>
              )}
              {options.dimensionMode === "custom" && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.preserveAspectRatio}
                    onChange={(e) =>
                      onChange({ preserveAspectRatio: e.target.checked })
                    }
                    className="accent-slate-700 rounded"
                  />
                  <span className="text-xs text-slate-600">
                    Preserve aspect ratio
                  </span>
                </label>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Copy to Clipboard */}
      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
        <Copy size={18} className="text-slate-500" />
        <div className="flex-1">
          <span className="text-sm font-medium text-slate-800">
            Copy to clipboard
          </span>
          <p className="text-xs text-slate-500">
            Paste directly into Figma, Illustrator, etc.
          </p>
        </div>
        <input
          type="checkbox"
          checked={options.copyToClipboard}
          onChange={(e) => onChange({ copyToClipboard: e.target.checked })}
          className="accent-slate-700 rounded"
        />
      </label>

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
      >
        {showAdvanced ? <CaretUp size={14} /> : <CaretDown size={14} />}
        <span className="font-medium">Advanced Options</span>
      </button>

      {/* Advanced Options Panel */}
      {showAdvanced && (
        <div className="space-y-5 pt-2 border-t border-slate-200">
          {/* Text Handling */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TextT size={16} weight="duotone" className="text-slate-500" />
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Text Handling
              </h4>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ textMode: "text" })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                  options.textMode === "text"
                    ? "bg-slate-700 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">Keep as text</div>
                  <div className="text-xs opacity-75">
                    Editable, needs fonts
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onChange({ textMode: "paths" })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                  options.textMode === "paths"
                    ? "bg-slate-700 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">Convert to paths</div>
                  <div className="text-xs opacity-75">Preserves appearance</div>
                </div>
              </button>
            </div>
          </div>

          {/* Styling */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Code size={16} weight="duotone" className="text-slate-500" />
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Styling
              </h4>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ styleMode: "inline" })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                  options.styleMode === "inline"
                    ? "bg-slate-700 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">Inline styles</div>
                  <div className="text-xs opacity-75">Self-contained</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onChange({ styleMode: "classes" })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                  options.styleMode === "classes"
                    ? "bg-slate-700 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">CSS classes</div>
                  <div className="text-xs opacity-75">Customizable</div>
                </div>
              </button>
            </div>
          </div>

          {/* Other Options */}
          <div className="space-y-3">
            <label
              htmlFor="svg-include-bg"
              aria-label="Include background"
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                id="svg-include-bg"
                type="checkbox"
                checked={options.includeBackground}
                onChange={(e) =>
                  onChange({ includeBackground: e.target.checked })
                }
                className="accent-slate-700 rounded"
              />
              <div>
                <span className="text-sm text-slate-700">
                  Include background
                </span>
                <p className="text-xs text-slate-500">
                  Add white rectangle behind chart
                </p>
              </div>
            </label>

            <label
              htmlFor="svg-responsive"
              aria-label="Responsive mode"
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                id="svg-responsive"
                type="checkbox"
                checked={options.responsiveMode}
                onChange={(e) => onChange({ responsiveMode: e.target.checked })}
                className="accent-slate-700 rounded"
              />
              <div>
                <span className="text-sm text-slate-700">Responsive mode</span>
                <p className="text-xs text-slate-500">
                  ViewBox only, no fixed dimensions
                </p>
              </div>
            </label>

            <label
              htmlFor="svg-optimize"
              aria-label="Optimize SVG"
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                id="svg-optimize"
                type="checkbox"
                checked={options.optimize}
                onChange={(e) => onChange({ optimize: e.target.checked })}
                className="accent-slate-700 rounded"
              />
              <div>
                <span className="text-sm text-slate-700">Optimize SVG</span>
                <p className="text-xs text-slate-500">
                  Smaller file, less readable code
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* SVG hint */}
      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          SVG files can be edited in Illustrator, Figma, Inkscape, etc.
        </p>
      </div>
    </div>
  );
}
