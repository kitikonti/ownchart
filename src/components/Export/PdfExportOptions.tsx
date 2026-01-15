/**
 * PDF export options component.
 * Provides controls for page size, orientation, scale, margins, and more.
 */

import { useMemo } from "react";
import { CheckCircle, Warning, Info } from "@phosphor-icons/react";
import type {
  PdfExportOptions as PdfOptions,
  PdfPageSize,
  PdfMarginPreset,
  ExportOptions,
} from "../../utils/export/types";
import {
  PDF_PAGE_SIZES,
  PDF_MARGIN_PRESETS,
  EXPORT_ZOOM_PRESETS,
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
  EXPORT_ZOOM_READABLE_THRESHOLD,
  EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD,
} from "../../utils/export/types";
import { DENSITY_CONFIG } from "../../types/preferences.types";
import { mmToPx } from "../../utils/export/pdfLayout";

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
  taskCount: number;
}

function getReadabilityStatus(zoom: number): {
  level: "good" | "warning" | "critical";
  message: string;
  icon: typeof CheckCircle;
} {
  if (zoom >= EXPORT_ZOOM_READABLE_THRESHOLD) {
    return { level: "good", message: "Labels readable", icon: CheckCircle };
  } else if (zoom >= EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD) {
    return {
      level: "warning",
      message: "Labels may be hard to read",
      icon: Warning,
    };
  } else {
    return {
      level: "critical",
      message: "Labels will be hidden",
      icon: Warning,
    };
  }
}

export function PdfExportOptions({
  options,
  onChange,
  exportOptions,
  onExportOptionsChange,
  currentAppZoom,
  taskCount,
}: PdfExportOptionsProps): JSX.Element {
  const pageDims =
    options.pageSize === "custom"
      ? options.customPageSize || { width: 500, height: 300 }
      : PDF_PAGE_SIZES[options.pageSize];
  const displayWidth =
    options.orientation === "landscape" ? pageDims.width : pageDims.height;
  const displayHeight =
    options.orientation === "landscape" ? pageDims.height : pageDims.width;

  const scaleInfo = useMemo(() => {
    if (exportOptions.zoomMode !== "fitToWidth") return null;

    const margins = PDF_MARGIN_PRESETS[options.marginPreset];
    const hasHeader =
      options.header.showProjectName ||
      options.header.showAuthor ||
      options.header.showExportDate;
    const hasFooter =
      options.footer.showProjectName ||
      options.footer.showAuthor ||
      options.footer.showExportDate;
    const headerReserved = hasHeader ? 10 : 0;
    const footerReserved = hasFooter ? 10 : 0;

    const availableHeightMm =
      displayHeight -
      margins.top -
      margins.bottom -
      headerReserved -
      footerReserved;
    const availableHeightPx = mmToPx(availableHeightMm);

    const densityConfig = DENSITY_CONFIG[exportOptions.density];
    const headerHeight = exportOptions.includeHeader ? 48 : 0;
    const contentHeightPx = taskCount * densityConfig.rowHeight + headerHeight;

    if (contentHeightPx <= availableHeightPx) return null;

    const scaleFactor = availableHeightPx / contentHeightPx;
    return { willScale: true, scaleFactor: Math.round(scaleFactor * 100) };
  }, [
    exportOptions.zoomMode,
    exportOptions.density,
    exportOptions.includeHeader,
    options.marginPreset,
    options.header,
    options.footer,
    displayHeight,
    taskCount,
  ]);

  const effectiveZoom = useMemo(() => {
    switch (exportOptions.zoomMode) {
      case "currentView":
        return currentAppZoom;
      case "custom":
        return exportOptions.timelineZoom;
      case "fitToWidth":
        return 0.5;
      default:
        return exportOptions.timelineZoom;
    }
  }, [exportOptions.zoomMode, exportOptions.timelineZoom, currentAppZoom]);

  const readabilityStatus = useMemo(
    () => getReadabilityStatus(effectiveZoom),
    [effectiveZoom]
  );
  const StatusIcon = readabilityStatus.icon;

  return (
    <div className="space-y-8">
      {/* ============ TIMELINE SCALE ============ */}
      <section>
        <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
          Timeline Scale
        </span>

        <div className="space-y-3">
          {/* Use Current View */}
          <label
            className={`flex items-center gap-3.5 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 min-h-[44px] hover:bg-neutral-50 ${
              exportOptions.zoomMode === "currentView"
                ? "border-brand-600 bg-brand-50"
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
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                  {Math.round(currentAppZoom * 100)}%
                </span>
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">
                Export at your current zoom level
              </p>
            </div>
          </label>

          {/* Fit to Page */}
          <label
            className={`flex items-center gap-3.5 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 min-h-[44px] hover:bg-neutral-50 ${
              exportOptions.zoomMode === "fitToWidth"
                ? "border-brand-600 bg-brand-50"
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
              <p className="text-xs text-neutral-600 mt-0.5">
                Automatically scale to fit page width
              </p>
            </div>
          </label>

          {/* Custom Zoom */}
          <label
            className={`flex items-start gap-3.5 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 min-h-[44px] hover:bg-neutral-50 ${
              exportOptions.zoomMode === "custom"
                ? "border-brand-600 bg-brand-50"
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
              <p className="text-xs text-neutral-600 mt-0.5">
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
                      className="flex-1 h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-brand-600"
                    />
                    <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-lg px-3 py-1.5">
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

                  <div className="flex gap-2">
                    {Object.entries(EXPORT_ZOOM_PRESETS).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          onExportOptionsChange({ timelineZoom: value })
                        }
                        className={`px-3 py-2 text-xs font-mono font-medium rounded-lg transition-all duration-200 active:scale-[0.98] ${
                          exportOptions.timelineZoom === value
                            ? "bg-brand-600 text-white shadow-md"
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

        {/* Readability Indicator - Figma-style */}
        {exportOptions.zoomMode !== "fitToWidth" && (
          <div
            className={`flex items-center gap-2.5 mt-4 px-4 py-3 rounded-lg ${
              readabilityStatus.level === "good"
                ? "bg-green-50 border border-green-200"
                : readabilityStatus.level === "warning"
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-red-50 border border-red-200"
            }`}
          >
            <StatusIcon
              size={16}
              weight="fill"
              className={
                readabilityStatus.level === "good"
                  ? "text-green-600"
                  : readabilityStatus.level === "warning"
                    ? "text-amber-600"
                    : "text-red-600"
              }
            />
            <span
              className={`text-xs font-semibold ${
                readabilityStatus.level === "good"
                  ? "text-green-700"
                  : readabilityStatus.level === "warning"
                    ? "text-amber-700"
                    : "text-red-700"
              }`}
            >
              {readabilityStatus.message}
            </span>
            <span
              className={`ml-auto text-xs font-mono font-semibold ${
                readabilityStatus.level === "good"
                  ? "text-green-700"
                  : readabilityStatus.level === "warning"
                    ? "text-amber-700"
                    : "text-red-700"
              }`}
            >
              {Math.round(effectiveZoom * 100)}%
            </span>
          </div>
        )}

        {/* Scale Info */}
        {scaleInfo && (
          <div className="flex items-center gap-2.5 mt-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
            <Info size={16} weight="fill" className="flex-shrink-0 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">
              Content will be scaled to {scaleInfo.scaleFactor}% to fit page
            </span>
          </div>
        )}
      </section>

      <div className="h-px bg-neutral-200" />

      {/* ============ PAGE SETUP ============ */}
      <section>
        <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
          Page Setup
        </span>

        <div className="grid grid-cols-2 gap-6">
          {/* Page Size */}
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-2">
              Size
            </span>
            <select
              value={options.pageSize}
              onChange={(e) =>
                onChange({ pageSize: e.target.value as PdfPageSize })
              }
              className="w-full px-3 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-all duration-200 hover:border-neutral-400"
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
            <div className="inline-flex rounded-lg border border-neutral-300 overflow-hidden w-full">
              <button
                type="button"
                onClick={() => onChange({ orientation: "landscape" })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                  options.orientation === "landscape"
                    ? "bg-brand-600 text-white shadow-md z-10"
                    : "bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span className="w-4 h-2.5 border-2 border-current rounded-sm" />
                Landscape
              </button>
              <button
                type="button"
                onClick={() => onChange({ orientation: "portrait" })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border-l border-neutral-300 transition-all duration-200 active:scale-[0.98] ${
                  options.orientation === "portrait"
                    ? "bg-brand-600 text-white shadow-md z-10"
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
                className="w-full px-3 py-2.5 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-all duration-200 hover:border-neutral-400"
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
                className="w-full px-3 py-2.5 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-all duration-200 hover:border-neutral-400"
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
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 active:scale-[0.98] ${
                    options.marginPreset === preset
                      ? "border-brand-600 bg-brand-600 text-white shadow-md"
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

      <div className="h-px bg-neutral-200" />

      {/* ============ HEADER / FOOTER ============ */}
      <section>
        <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
          Header / Footer
        </span>

        <div className="grid grid-cols-2 gap-6">
          {/* Header */}
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-3">
              Header
            </span>
            <div className="bg-white border border-neutral-200 rounded-lg p-3">
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer group min-h-[36px]">
                  <input
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
                    className="size-4 rounded"
                    style={{ accentColor: "var(--color-brand-600)" }}
                  />
                  <span className="text-sm text-neutral-900 group-hover:text-brand-600 transition-colors duration-200">
                    Project title
                  </span>
                </label>
                <div className="h-px bg-neutral-200" />
                <label className="flex items-center gap-3 cursor-pointer group min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={options.header.showAuthor}
                    onChange={(e) =>
                      onChange({
                        header: {
                          ...options.header,
                          showAuthor: e.target.checked,
                        },
                      })
                    }
                    className="size-4 rounded"
                    style={{ accentColor: "var(--color-brand-600)" }}
                  />
                  <span className="text-sm text-neutral-900 group-hover:text-brand-600 transition-colors duration-200">
                    Author
                  </span>
                </label>
                <div className="h-px bg-neutral-200" />
                <label className="flex items-center gap-3 cursor-pointer group min-h-[36px]">
                  <input
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
                    className="size-4 rounded"
                    style={{ accentColor: "var(--color-brand-600)" }}
                  />
                  <span className="text-sm text-neutral-900 group-hover:text-brand-600 transition-colors duration-200">
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
            <div className="bg-white border border-neutral-200 rounded-lg p-3">
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer group min-h-[36px]">
                  <input
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
                    className="size-4 rounded"
                    style={{ accentColor: "var(--color-brand-600)" }}
                  />
                  <span className="text-sm text-neutral-900 group-hover:text-brand-600 transition-colors duration-200">
                    Project title
                  </span>
                </label>
                <div className="h-px bg-neutral-200" />
                <label className="flex items-center gap-3 cursor-pointer group min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={options.footer.showAuthor}
                    onChange={(e) =>
                      onChange({
                        footer: {
                          ...options.footer,
                          showAuthor: e.target.checked,
                        },
                      })
                    }
                    className="size-4 rounded"
                    style={{ accentColor: "var(--color-brand-600)" }}
                  />
                  <span className="text-sm text-neutral-900 group-hover:text-brand-600 transition-colors duration-200">
                    Author
                  </span>
                </label>
                <div className="h-px bg-neutral-200" />
                <label className="flex items-center gap-3 cursor-pointer group min-h-[36px]">
                  <input
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
                    className="size-4 rounded"
                    style={{ accentColor: "var(--color-brand-600)" }}
                  />
                  <span className="text-sm text-neutral-900 group-hover:text-brand-600 transition-colors duration-200">
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
