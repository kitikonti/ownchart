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
    <div className="space-y-16">
      {/* ============ TIMELINE SCALE ============ */}
      <section>
        <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider pb-0.5 mb-3 border-b border-neutral-200">
          Timeline Scale
        </h3>

        <div className="space-y-2">
          {/* Use Current View */}
          <label
            className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
              exportOptions.zoomMode === "currentView"
                ? "bg-brand-50 border-[var(--color-brand-gray-400)]"
                : "border-neutral-200 hover:border-[var(--color-brand-gray-400)]"
            }`}
          >
            <input
              type="radio"
              name="pdfZoomMode"
              checked={exportOptions.zoomMode === "currentView"}
              onChange={() =>
                onExportOptionsChange({ zoomMode: "currentView" })
              }
              className="mt-0.5 w-4 h-4"
              aria-label="Use current view"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${exportOptions.zoomMode === "currentView" ? "text-[var(--color-brand-gray-900)]" : "text-neutral-800"}`}
                >
                  Use current view
                </span>
                <span
                  className={`text-xs font-mono px-1.5 py-0.5 rounded ${exportOptions.zoomMode === "currentView" ? "text-[var(--color-brand-gray-700)] bg-[var(--color-brand-gray-100)]" : "text-neutral-500 bg-neutral-100"}`}
                >
                  {Math.round(currentAppZoom * 100)}%
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${exportOptions.zoomMode === "currentView" ? "text-[var(--color-brand-gray-700)]" : "text-neutral-500"}`}
              >
                Export at your current zoom level
              </p>
            </div>
          </label>

          {/* Fit to Page */}
          <label
            className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
              exportOptions.zoomMode === "fitToWidth"
                ? "bg-brand-50 border-[var(--color-brand-gray-400)]"
                : "border-neutral-200 hover:border-[var(--color-brand-gray-400)]"
            }`}
          >
            <input
              type="radio"
              name="pdfZoomMode"
              checked={exportOptions.zoomMode === "fitToWidth"}
              onChange={() => onExportOptionsChange({ zoomMode: "fitToWidth" })}
              className="mt-0.5 w-4 h-4"
              aria-label="Fit to page"
            />
            <div className="flex-1">
              <span
                className={`text-sm font-medium ${exportOptions.zoomMode === "fitToWidth" ? "text-[var(--color-brand-gray-900)]" : "text-neutral-800"}`}
              >
                Fit to page
              </span>
              <p
                className={`text-xs mt-0.5 ${exportOptions.zoomMode === "fitToWidth" ? "text-[var(--color-brand-gray-700)]" : "text-neutral-500"}`}
              >
                Automatically scale to fit page width
              </p>
            </div>
          </label>

          {/* Custom Zoom */}
          <label
            className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
              exportOptions.zoomMode === "custom"
                ? "bg-brand-50 border-[var(--color-brand-gray-400)]"
                : "border-neutral-200 hover:border-[var(--color-brand-gray-400)]"
            }`}
          >
            <input
              type="radio"
              name="pdfZoomMode"
              checked={exportOptions.zoomMode === "custom"}
              onChange={() => onExportOptionsChange({ zoomMode: "custom" })}
              className="mt-0.5 w-4 h-4"
            />
            <div className="flex-1">
              <span
                className={`text-sm font-medium ${exportOptions.zoomMode === "custom" ? "text-[var(--color-brand-gray-900)]" : "text-neutral-800"}`}
              >
                Custom zoom
              </span>
              <p
                className={`text-xs mt-0.5 ${exportOptions.zoomMode === "custom" ? "text-[var(--color-brand-gray-700)]" : "text-neutral-500"}`}
              >
                Set a specific zoom percentage
              </p>

              {exportOptions.zoomMode === "custom" && (
                <div className="mt-3 space-y-3">
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
                      className="flex-1 h-1.5 bg-[var(--color-brand-gray-200)] rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-1 bg-[var(--color-brand-gray-100)] rounded-md px-2 py-1">
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
                        className="w-10 text-sm text-center font-mono bg-transparent border-none focus:outline-none text-[var(--color-brand-gray-900)]"
                        min={EXPORT_ZOOM_MIN * 100}
                        max={EXPORT_ZOOM_MAX * 100}
                      />
                      <span className="text-xs text-[var(--color-brand-gray-700)]">
                        %
                      </span>
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
                        className={`px-2 py-1 text-xs font-mono rounded-md transition-colors ${
                          exportOptions.timelineZoom === value
                            ? "bg-brand-600 text-white"
                            : "bg-[var(--color-brand-gray-100)] text-[var(--color-brand-gray-700)] hover:bg-[var(--color-brand-gray-200)]"
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

        {/* Readability Indicator */}
        {exportOptions.zoomMode !== "fitToWidth" && (
          <div
            className={`flex items-center gap-2 mt-4 px-3 py-2 rounded-md text-xs ${
              readabilityStatus.level === "good"
                ? "bg-emerald-50 text-emerald-700"
                : readabilityStatus.level === "warning"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
            }`}
          >
            <StatusIcon size={14} weight="light" />
            <span className="flex-1">{readabilityStatus.message}</span>
            <span className="font-mono font-medium">
              {Math.round(effectiveZoom * 100)}%
            </span>
          </div>
        )}

        {/* Scale Info */}
        {scaleInfo && (
          <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-md text-xs bg-amber-50 text-amber-700">
            <Info size={14} weight="light" className="flex-shrink-0" />
            <span>
              Content will be scaled to {scaleInfo.scaleFactor}% to fit page
            </span>
          </div>
        )}
      </section>

      {/* ============ PAGE SETUP ============ */}
      <section>
        <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider pb-0.5 mb-3 border-b border-neutral-200">
          Page Setup
        </h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Page Size */}
          <div>
            <span className="text-xs font-medium text-neutral-500 mb-2.5 block">
              Size
            </span>
            <select
              value={options.pageSize}
              onChange={(e) =>
                onChange({ pageSize: e.target.value as PdfPageSize })
              }
              className="w-full px-2.5 py-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
              <p className="text-[10px] text-neutral-400 mt-1.5">
                {displayWidth} × {displayHeight} mm
              </p>
            )}
          </div>

          {/* Orientation */}
          <div>
            <span className="text-xs font-medium text-neutral-500 mb-2.5 block">
              Orientation
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ orientation: "landscape" })}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
                  options.orientation === "landscape"
                    ? "bg-brand-600 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-[var(--color-brand-gray-100)] hover:text-[var(--color-brand-gray-700)]"
                }`}
              >
                <span className="w-4 h-2.5 border-2 border-current rounded-sm" />
                Landscape
              </button>
              <button
                type="button"
                onClick={() => onChange({ orientation: "portrait" })}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
                  options.orientation === "portrait"
                    ? "bg-brand-600 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-[var(--color-brand-gray-100)] hover:text-[var(--color-brand-gray-700)]"
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
                className="text-xs font-medium text-neutral-500 mb-2.5 block"
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
                className="w-full px-2.5 py-2 text-sm font-mono bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label
                className="text-xs font-medium text-neutral-500 mb-2.5 block"
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
                className="w-full px-2.5 py-2 text-sm font-mono bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Margins */}
        <div className="mt-6">
          <span className="text-xs font-medium text-neutral-500 mb-2.5 block">
            Margins
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(MARGIN_LABELS) as PdfMarginPreset[])
              .filter((key) => key !== "custom")
              .map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ marginPreset: preset })}
                  className={`px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    options.marginPreset === preset
                      ? "bg-brand-600 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-[var(--color-brand-gray-100)] hover:text-[var(--color-brand-gray-700)]"
                  }`}
                >
                  {MARGIN_LABELS[preset]}
                </button>
              ))}
          </div>
          {options.marginPreset !== "none" && (
            <p className="text-[10px] text-neutral-400 mt-2">
              {PDF_MARGIN_PRESETS[options.marginPreset].top}mm top/bottom,{" "}
              {PDF_MARGIN_PRESETS[options.marginPreset].left}mm left/right
            </p>
          )}
        </div>
      </section>

      {/* ============ HEADER / FOOTER ============ */}
      <section>
        <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider pb-0.5 mb-3 border-b border-neutral-200">
          Header / Footer
        </h3>

        <div className="grid grid-cols-2 gap-8">
          {/* Header */}
          <div>
            <span className="text-xs font-medium text-neutral-500 mb-2.5 block">
              Header
            </span>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2.5 cursor-pointer group">
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
                  className="w-3.5 h-3.5 rounded"
                />
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                  Project title
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
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
                  className="w-3.5 h-3.5 rounded"
                />
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                  Author
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
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
                  className="w-3.5 h-3.5 rounded"
                />
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                  Export date
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div>
            <span className="text-xs font-medium text-neutral-500 mb-2.5 block">
              Footer
            </span>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2.5 cursor-pointer group">
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
                  className="w-3.5 h-3.5 rounded"
                />
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                  Project title
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
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
                  className="w-3.5 h-3.5 rounded"
                />
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                  Author
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
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
                  className="w-3.5 h-3.5 rounded"
                />
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                  Export date
                </span>
              </label>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-neutral-400 mt-4">
          Set project title and author in Chart Settings
        </p>
      </section>
    </div>
  );
}
