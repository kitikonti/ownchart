/**
 * PDF export options component.
 * Provides controls for page size, orientation, scale, margins, and more.
 */

import { useState } from "react";
import { File, Rows, CaretDown, CaretUp } from "@phosphor-icons/react";
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
  a2: { label: "A2", size: "594 × 420 mm" },
  a1: { label: "A1", size: "841 × 594 mm" },
  a0: { label: "A0", size: "1189 × 841 mm" },
  letter: { label: "Letter", size: "11 × 8.5 in" },
  legal: { label: "Legal", size: "14 × 8.5 in" },
  tabloid: { label: "Tabloid", size: "17 × 11 in" },
  custom: { label: "Custom", size: "" },
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
  const pageDims =
    options.pageSize === "custom"
      ? options.customPageSize || { width: 500, height: 300 }
      : PDF_PAGE_SIZES[options.pageSize];
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
                  {size ? `${label} (${size})` : label}
                </option>
              ))}
            </select>
          </div>

          {/* Orientation */}
          <div>
            <span className="block text-xs text-slate-500 mb-1.5">
              Orientation
            </span>
            <div
              className="flex gap-2"
              role="radiogroup"
              aria-label="Page orientation"
            >
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

        {/* Custom page size inputs */}
        {options.pageSize === "custom" ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="pdf-custom-width"
                className="block text-xs text-slate-500 mb-1"
              >
                Width (mm)
              </label>
              <input
                id="pdf-custom-width"
                type="number"
                value={options.customPageSize?.width || 500}
                onChange={(e) =>
                  onChange({
                    customPageSize: {
                      width: Math.max(100, parseInt(e.target.value) || 500),
                      height: options.customPageSize?.height || 300,
                    },
                  })
                }
                min={100}
                max={5000}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-shadow"
              />
            </div>
            <div>
              <label
                htmlFor="pdf-custom-height"
                className="block text-xs text-slate-500 mb-1"
              >
                Height (mm)
              </label>
              <input
                id="pdf-custom-height"
                type="number"
                value={options.customPageSize?.height || 300}
                onChange={(e) =>
                  onChange({
                    customPageSize: {
                      width: options.customPageSize?.width || 500,
                      height: Math.max(100, parseInt(e.target.value) || 300),
                    },
                  })
                }
                min={100}
                max={5000}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-shadow"
              />
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-400 text-center">
            {displayWidth} × {displayHeight} mm
          </div>
        )}

        {/* Vector hint */}
        <div className="mt-3 p-2 bg-teal-50 border border-teal-200 rounded-lg">
          <p className="text-xs text-teal-700">
            Vector PDF scales perfectly for large format printing (A0, poster,
            etc.)
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
              aria-label="Grayscale mode"
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
