/**
 * PDF export options component.
 * Provides controls for page size, orientation, scale, margins, and more.
 */

import { useState } from "react";
import {
  File,
  ArrowsOutLineHorizontal,
  Rows,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";
import type {
  PdfExportOptions as PdfOptions,
  PdfPageSize,
  PdfMarginPreset,
} from "../../utils/export/types";
import { PDF_PAGE_SIZES, PDF_MARGIN_PRESETS } from "../../utils/export/types";

// Page size display labels
const PAGE_SIZE_LABELS: Record<PdfPageSize, { label: string; size: string }> = {
  a4: { label: "A4", size: "297 × 210 mm" },
  a3: { label: "A3", size: "420 × 297 mm" },
  letter: { label: "Letter", size: "11 × 8.5 in" },
  legal: { label: "Legal", size: "14 × 8.5 in" },
  tabloid: { label: "Tabloid", size: "17 × 11 in" },
};

// Margin preset labels
const MARGIN_LABELS: Record<PdfMarginPreset, string> = {
  normal: "Normal",
  narrow: "Narrow",
  wide: "Wide",
  none: "None",
  custom: "Custom",
};

interface PdfExportOptionsProps {
  options: PdfOptions;
  onChange: (options: Partial<PdfOptions>) => void;
  projectName?: string;
}

export function PdfExportOptions({
  options,
  onChange,
  projectName,
}: PdfExportOptionsProps): JSX.Element {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get current page dimensions for display
  const pageDims = PDF_PAGE_SIZES[options.pageSize];
  const displayWidth =
    options.orientation === "landscape" ? pageDims.width : pageDims.height;
  const displayHeight =
    options.orientation === "landscape" ? pageDims.height : pageDims.width;

  return (
    <div className="space-y-5">
      {/* Page Setup Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <File size={16} weight="duotone" className="text-slate-500" />
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Page Setup
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Page Size */}
          <div>
            <label
              htmlFor="pdf-page-size"
              className="block text-xs text-slate-500 mb-1.5"
            >
              Size
            </label>
            <select
              id="pdf-page-size"
              value={options.pageSize}
              onChange={(e) =>
                onChange({ pageSize: e.target.value as PdfPageSize })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-shadow"
            >
              {Object.entries(PAGE_SIZE_LABELS).map(([key, { label, size }]) => (
                <option key={key} value={key}>
                  {label} ({size})
                </option>
              ))}
            </select>
          </div>

          {/* Orientation */}
          <div>
            <span className="block text-xs text-slate-500 mb-1.5">
              Orientation
            </span>
            <div className="flex gap-2" role="radiogroup" aria-label="Page orientation">
              <button
                type="button"
                onClick={() => onChange({ orientation: "landscape" })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                  options.orientation === "landscape"
                    ? "bg-slate-700 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-3 border-2 border-current rounded-sm" />
                  Landscape
                </span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ orientation: "portrait" })}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                  options.orientation === "portrait"
                    ? "bg-slate-700 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-5 border-2 border-current rounded-sm" />
                  Portrait
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Page dimensions display */}
        <div className="mt-2 text-xs text-slate-400 text-center">
          {displayWidth} × {displayHeight} mm
        </div>
      </div>

      {/* Scale Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowsOutLineHorizontal
            size={16}
            weight="duotone"
            className="text-slate-500"
          />
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Scale
          </h4>
        </div>

        <div className="space-y-2">
          <label
            className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
              options.scaleMode === "fitToPage"
                ? "bg-slate-50 border-slate-400"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="scaleMode"
              value="fitToPage"
              checked={options.scaleMode === "fitToPage"}
              onChange={() => onChange({ scaleMode: "fitToPage" })}
              className="accent-slate-700"
              aria-label="Fit to page"
            />
            <div>
              <span className="text-sm font-medium text-slate-800">
                Fit entire chart to page
              </span>
              <p className="text-xs text-slate-500">
                Scale chart to fit on single page
              </p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
              options.scaleMode === "custom"
                ? "bg-slate-50 border-slate-400"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="scaleMode"
              value="custom"
              checked={options.scaleMode === "custom"}
              onChange={() => onChange({ scaleMode: "custom", customScale: 100 })}
              className="mt-0.5 accent-slate-700"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-800">
                Custom zoom
              </span>
              {options.scaleMode === "custom" && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="range"
                    min={25}
                    max={200}
                    step={5}
                    value={options.customScale || 100}
                    onChange={(e) =>
                      onChange({ customScale: parseInt(e.target.value) })
                    }
                    className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-700"
                  />
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                    <input
                      type="number"
                      value={options.customScale || 100}
                      onChange={(e) =>
                        onChange({
                          customScale: Math.max(
                            25,
                            Math.min(200, parseInt(e.target.value) || 100)
                          ),
                        })
                      }
                      className="w-10 px-1 py-0.5 text-sm text-center font-mono bg-transparent border-none focus:ring-0 focus:outline-none"
                      min={25}
                      max={200}
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Vector hint */}
        <div className="mt-3 p-2 bg-teal-50 border border-teal-200 rounded-lg">
          <p className="text-xs text-teal-700">
            Vector PDF scales perfectly for large format printing (A0, poster, etc.)
          </p>
        </div>
      </div>

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
          {/* Margins */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Rows size={16} weight="duotone" className="text-slate-500" />
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Margins
              </h4>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(MARGIN_LABELS) as PdfMarginPreset[])
                .filter((key) => key !== "custom")
                .map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChange({ marginPreset: preset })}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                      options.marginPreset === preset
                        ? "bg-slate-700 border-slate-700 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {MARGIN_LABELS[preset]}
                  </button>
                ))}
            </div>

            {options.marginPreset !== "none" && (
              <div className="mt-2 text-xs text-slate-400">
                {PDF_MARGIN_PRESETS[options.marginPreset].top}mm top/bottom,{" "}
                {PDF_MARGIN_PRESETS[options.marginPreset].left}mm left/right
              </div>
            )}
          </div>

          {/* Header/Footer */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Header / Footer
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Header */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500">Header</span>
                <label
                  htmlFor="pdf-header-project"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    id="pdf-header-project"
                    type="checkbox"
                    checked={options.header.showProjectName}
                    onChange={(e) =>
                      onChange({
                        header: {
                          ...options.header,
                          showProjectName: e.target.checked,
                        },
                      })
                    }
                    className="accent-slate-700 rounded"
                  />
                  <span className="text-sm text-slate-700">Project name</span>
                </label>
                <label
                  htmlFor="pdf-header-date"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    id="pdf-header-date"
                    type="checkbox"
                    checked={options.header.showExportDate}
                    onChange={(e) =>
                      onChange({
                        header: {
                          ...options.header,
                          showExportDate: e.target.checked,
                        },
                      })
                    }
                    className="accent-slate-700 rounded"
                  />
                  <span className="text-sm text-slate-700">Export date</span>
                </label>
              </div>

              {/* Footer */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500">Footer</span>
                <label
                  htmlFor="pdf-footer-project"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    id="pdf-footer-project"
                    type="checkbox"
                    checked={options.footer.showProjectName}
                    onChange={(e) =>
                      onChange({
                        footer: {
                          ...options.footer,
                          showProjectName: e.target.checked,
                        },
                      })
                    }
                    className="accent-slate-700 rounded"
                  />
                  <span className="text-sm text-slate-700">Project name</span>
                </label>
                <label
                  htmlFor="pdf-footer-date"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    id="pdf-footer-date"
                    type="checkbox"
                    checked={options.footer.showExportDate}
                    onChange={(e) =>
                      onChange({
                        footer: {
                          ...options.footer,
                          showExportDate: e.target.checked,
                        },
                      })
                    }
                    className="accent-slate-700 rounded"
                  />
                  <span className="text-sm text-slate-700">Export date</span>
                </label>
              </div>
            </div>
          </div>

          {/* Grayscale */}
          <div>
            <label
              htmlFor="pdf-grayscale"
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                id="pdf-grayscale"
                type="checkbox"
                checked={options.grayscale}
                onChange={(e) => onChange({ grayscale: e.target.checked })}
                className="accent-slate-700 rounded"
              />
              <div>
                <span className="text-sm font-medium text-slate-800">
                  Grayscale
                </span>
                <p className="text-xs text-slate-500">
                  Export in black & white (saves ink)
                </p>
              </div>
            </label>
          </div>

          {/* Metadata */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              PDF Metadata
            </h4>

            <div className="space-y-2">
              <div>
                <label
                  htmlFor="pdf-meta-title"
                  className="block text-xs text-slate-500 mb-1"
                >
                  Title
                </label>
                <input
                  id="pdf-meta-title"
                  type="text"
                  value={options.metadata.title || projectName || ""}
                  onChange={(e) =>
                    onChange({
                      metadata: { ...options.metadata, title: e.target.value },
                    })
                  }
                  placeholder={projectName || "Project Timeline"}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-shadow"
                />
              </div>
              <div>
                <label
                  htmlFor="pdf-meta-author"
                  className="block text-xs text-slate-500 mb-1"
                >
                  Author
                </label>
                <input
                  id="pdf-meta-author"
                  type="text"
                  value={options.metadata.author || ""}
                  onChange={(e) =>
                    onChange({
                      metadata: { ...options.metadata, author: e.target.value },
                    })
                  }
                  placeholder="Your name"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-shadow"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
