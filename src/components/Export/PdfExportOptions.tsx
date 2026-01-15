/**
 * PDF export options component.
 * Provides controls for page size, orientation, scale, margins, and more.
 */

import type {
  PdfExportOptions as PdfOptions,
  PdfPageSize,
  PdfMarginPreset,
  ExportOptions,
} from "../../utils/export/types";
import { Checkbox } from "../common/Checkbox";
import {
  PDF_PAGE_SIZES,
  PDF_MARGIN_PRESETS,
  EXPORT_ZOOM_PRESETS,
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
} from "../../utils/export/types";

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
      <section>
        <span className="block text-sm font-semibold text-neutral-900 mb-3">
          Timeline Scale
        </span>

        <div className="space-y-2">
          {/* Use Current View */}
          <label
            className={`flex items-center gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50 ${
              exportOptions.zoomMode === "currentView"
                ? "border-neutral-300 border-l-[3px] border-l-brand-600"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <input
              type="radio"
              name="pdfZoomMode"
              checked={exportOptions.zoomMode === "currentView"}
              onChange={() =>
                onExportOptionsChange({ zoomMode: "currentView" })
              }
              className="size-4"
              style={{ accentColor: "var(--color-brand-600)" }}
              aria-label="Use current view"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-900">
                  Use current view
                </span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-600">
                  {Math.round(currentAppZoom * 100)}%
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Export at your current zoom level
              </p>
            </div>
          </label>

          {/* Fit to Page */}
          <label
            className={`flex items-center gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50 ${
              exportOptions.zoomMode === "fitToWidth"
                ? "border-neutral-300 border-l-[3px] border-l-brand-600"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <input
              type="radio"
              name="pdfZoomMode"
              checked={exportOptions.zoomMode === "fitToWidth"}
              onChange={() => onExportOptionsChange({ zoomMode: "fitToWidth" })}
              className="size-4"
              style={{ accentColor: "var(--color-brand-600)" }}
              aria-label="Fit to page"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-neutral-900">
                Fit to page
              </span>
              <p className="text-xs text-neutral-500 mt-0.5">
                Automatically scale to fit page width
              </p>
            </div>
          </label>

          {/* Custom Zoom */}
          <label
            className={`flex items-start gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50 ${
              exportOptions.zoomMode === "custom"
                ? "border-neutral-300 border-l-[3px] border-l-brand-600"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <input
              type="radio"
              name="pdfZoomMode"
              checked={exportOptions.zoomMode === "custom"}
              onChange={() => onExportOptionsChange({ zoomMode: "custom" })}
              className="size-4 mt-0.5"
              style={{ accentColor: "var(--color-brand-600)" }}
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-neutral-900">
                Custom zoom
              </span>
              <p className="text-xs text-neutral-500 mt-0.5">
                Set a specific zoom percentage
              </p>

              {exportOptions.zoomMode === "custom" && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={EXPORT_ZOOM_MIN * 100}
                      max={EXPORT_ZOOM_MAX * 100}
                      step={1}
                      value={exportOptions.timelineZoom * 100}
                      onChange={(e) =>
                        onExportOptionsChange({
                          timelineZoom: parseInt(e.target.value) / 100,
                        })
                      }
                      className="flex-1 h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-brand-600"
                    />
                    <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded px-3 py-1.5">
                      <input
                        type="number"
                        value={Math.round(exportOptions.timelineZoom * 100)}
                        onChange={(e) =>
                          onExportOptionsChange({
                            timelineZoom: Math.max(
                              EXPORT_ZOOM_MIN,
                              Math.min(
                                EXPORT_ZOOM_MAX,
                                parseInt(e.target.value) / 100 || 1
                              )
                            ),
                          })
                        }
                        className="w-10 text-sm text-center font-mono bg-transparent border-none focus:outline-none text-neutral-900"
                        min={EXPORT_ZOOM_MIN * 100}
                        max={EXPORT_ZOOM_MAX * 100}
                      />
                      <span className="text-xs text-neutral-500">%</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {Object.entries(EXPORT_ZOOM_PRESETS).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          onExportOptionsChange({ timelineZoom: value })
                        }
                        className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors duration-150 ${
                          exportOptions.timelineZoom === value
                            ? "bg-brand-600 text-white"
                            : "bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                        }`}
                      >
                        {Math.round(value * 100)}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>

      </section>

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

          {/* Orientation - Segmented Control (separate row) */}
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
                <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
                  <Checkbox
                    checked={options.header.showProjectName}
                    onChange={(checked) =>
                      onChange({
                        header: {
                          ...options.header,
                          showProjectName: checked,
                        },
                      })
                    }
                  />
                  <span className="text-sm text-neutral-900">
                    Project title
                  </span>
                </label>
                <div className="divider-h-light" />
                <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
                  <Checkbox
                    checked={options.header.showAuthor}
                    onChange={(checked) =>
                      onChange({
                        header: {
                          ...options.header,
                          showAuthor: checked,
                        },
                      })
                    }
                  />
                  <span className="text-sm text-neutral-900">
                    Author
                  </span>
                </label>
                <div className="divider-h-light" />
                <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
                  <Checkbox
                    checked={options.header.showExportDate}
                    onChange={(checked) =>
                      onChange({
                        header: {
                          ...options.header,
                          showExportDate: checked,
                        },
                      })
                    }
                  />
                  <span className="text-sm text-neutral-900">
                    Export date
                  </span>
                </label>
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
                <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
                  <Checkbox
                    checked={options.footer.showProjectName}
                    onChange={(checked) =>
                      onChange({
                        footer: {
                          ...options.footer,
                          showProjectName: checked,
                        },
                      })
                    }
                  />
                  <span className="text-sm text-neutral-900">
                    Project title
                  </span>
                </label>
                <div className="divider-h-light" />
                <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
                  <Checkbox
                    checked={options.footer.showAuthor}
                    onChange={(checked) =>
                      onChange({
                        footer: {
                          ...options.footer,
                          showAuthor: checked,
                        },
                      })
                    }
                  />
                  <span className="text-sm text-neutral-900">
                    Author
                  </span>
                </label>
                <div className="divider-h-light" />
                <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
                  <Checkbox
                    checked={options.footer.showExportDate}
                    onChange={(checked) =>
                      onChange({
                        footer: {
                          ...options.footer,
                          showExportDate: checked,
                        },
                      })
                    }
                  />
                  <span className="text-sm text-neutral-900">
                    Export date
                  </span>
                </label>
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
