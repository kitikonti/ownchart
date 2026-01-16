/**
 * PDF export options component.
 * Provides controls for page size, orientation, scale, margins, and more.
 */

import type {
  PdfExportOptions as PdfOptions,
  PdfPageSize,
  PdfMarginPreset,
  ExportOptions,
  ExportZoomMode,
} from "../../utils/export/types";
import { Checkbox } from "../common/Checkbox";
import { PDF_PAGE_SIZES, PDF_MARGIN_PRESETS } from "../../utils/export/types";
import { ZoomModeSelector } from "./ZoomModeSelector";

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

const MARGIN_LABELS: Record<PdfMarginPreset, string> = {
  normal: "Normal",
  narrow: "Narrow",
  wide: "Wide",
  none: "None",
  custom: "Custom",
};

/** Header/Footer checkbox options */
const HEADER_FOOTER_OPTIONS = [
  { key: "showProjectName", label: "Project title" },
  { key: "showAuthor", label: "Author" },
  { key: "showExportDate", label: "Export date" },
] as const;

interface PdfExportOptionsProps {
  options: PdfOptions;
  onChange: (options: Partial<PdfOptions>) => void;
  exportOptions: ExportOptions;
  onExportOptionsChange: (options: Partial<ExportOptions>) => void;
  currentAppZoom: number;
}

export function PdfExportOptions({
  options,
  onChange,
  exportOptions,
  onExportOptionsChange,
  currentAppZoom,
}: PdfExportOptionsProps): JSX.Element {
  const pageDims =
    options.pageSize === "custom"
      ? options.customPageSize || { width: 500, height: 300 }
      : PDF_PAGE_SIZES[options.pageSize];
  const displayWidth =
    options.orientation === "landscape" ? pageDims.width : pageDims.height;
  const displayHeight =
    options.orientation === "landscape" ? pageDims.height : pageDims.width;

  return (
    <div className="space-y-8">
      {/* ============ TIMELINE SCALE ============ */}
      <ZoomModeSelector
        zoomMode={exportOptions.zoomMode}
        onZoomModeChange={(mode: ExportZoomMode) =>
          onExportOptionsChange({ zoomMode: mode })
        }
        timelineZoom={exportOptions.timelineZoom}
        onTimelineZoomChange={(zoom: number) =>
          onExportOptionsChange({ timelineZoom: zoom })
        }
        currentAppZoom={currentAppZoom}
        format="pdf"
      />

      <div className="divider-h" />

      {/* ============ PAGE SETUP ============ */}
      <section>
        <span className="block text-sm font-semibold text-neutral-900 mb-3">
          Page Setup
        </span>

        <div className="space-y-5">
          {/* Page Size */}
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-2">
              Page Size
            </span>
            <select
              value={options.pageSize}
              onChange={(e) =>
                onChange({ pageSize: e.target.value as PdfPageSize })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 hover:border-neutral-400"
            >
              {Object.entries(PAGE_SIZE_LABELS).map(
                ([key, { label, size }]) => (
                  <option key={key} value={key}>
                    {size ? `${label} (${size})` : label}
                  </option>
                )
              )}
            </select>
            {options.pageSize !== "custom" && (
              <p className="text-xs text-neutral-500 mt-2">
                {displayWidth} × {displayHeight} mm
              </p>
            )}
          </div>

          {/* Orientation - Segmented Control */}
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-2">
              Orientation
            </span>
            <div className="inline-flex rounded border border-neutral-300 overflow-hidden">
              <button
                type="button"
                onClick={() => onChange({ orientation: "landscape" })}
                className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  options.orientation === "landscape"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span className="w-4 h-2.5 border-2 border-current rounded-sm" />
                Landscape
              </button>
              <button
                type="button"
                onClick={() => onChange({ orientation: "portrait" })}
                className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-l border-neutral-300 transition-colors duration-150 ${
                  options.orientation === "portrait"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span className="w-2.5 h-4 border-2 border-current rounded-sm" />
                Portrait
              </button>
            </div>
          </div>
        </div>

        {/* Custom page size */}
        {options.pageSize === "custom" && (
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium text-neutral-700 mb-2"
                htmlFor="pdf-custom-width"
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
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 hover:border-neutral-400"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-neutral-700 mb-2"
                htmlFor="pdf-custom-height"
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
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors duration-150 hover:border-neutral-400"
              />
            </div>
          </div>
        )}

        {/* Margins */}
        <div className="mt-6">
          <span className="block text-sm font-medium text-neutral-700 mb-2">
            Margins
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MARGIN_LABELS) as PdfMarginPreset[])
              .filter((key) => key !== "custom")
              .map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ marginPreset: preset })}
                  className={`px-4 py-2 text-sm font-medium rounded border transition-colors duration-150 ${
                    options.marginPreset === preset
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  {MARGIN_LABELS[preset]}
                </button>
              ))}
          </div>
          {options.marginPreset !== "none" && (
            <p className="text-xs text-neutral-500 mt-2">
              {PDF_MARGIN_PRESETS[options.marginPreset].top}mm top/bottom,{" "}
              {PDF_MARGIN_PRESETS[options.marginPreset].left}mm left/right
            </p>
          )}
        </div>
      </section>

      <div className="divider-h" />

      {/* ============ HEADER / FOOTER ============ */}
      <section>
        <span className="block text-sm font-semibold text-neutral-900 mb-3">
          Header / Footer
        </span>

        <div className="grid grid-cols-2 gap-6">
          {/* Header */}
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-3">
              Header
            </span>
            <div className="bg-white border border-neutral-200 rounded p-3">
              <div className="space-y-2.5">
                {HEADER_FOOTER_OPTIONS.map((opt, idx, arr) => (
                  <div key={opt.key}>
                    <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
                      <Checkbox
                        checked={options.header[opt.key]}
                        onChange={(checked) =>
                          onChange({
                            header: { ...options.header, [opt.key]: checked },
                          })
                        }
                      />
                      <span className="text-sm text-neutral-900">
                        {opt.label}
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

          {/* Footer */}
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-3">
              Footer
            </span>
            <div className="bg-white border border-neutral-200 rounded p-3">
              <div className="space-y-2.5">
                {HEADER_FOOTER_OPTIONS.map((opt, idx, arr) => (
                  <div key={opt.key}>
                    <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
                      <Checkbox
                        checked={options.footer[opt.key]}
                        onChange={(checked) =>
                          onChange({
                            footer: { ...options.footer, [opt.key]: checked },
                          })
                        }
                      />
                      <span className="text-sm text-neutral-900">
                        {opt.label}
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
        </div>

        <p className="text-xs text-neutral-500 mt-4">
          Set project title and author in Chart Settings
        </p>
      </section>
    </div>
  );
}
