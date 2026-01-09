/**
 * PDF export options component.
 * Provides controls for page size, orientation, scale, margins, and more.
 */

import { useMemo } from "react";
import {
  File,
  Rows,
  MonitorPlay,
  ArrowsOutLineHorizontal,
  SlidersHorizontal,
  CheckCircle,
  Warning,
  Info,
} from "@phosphor-icons/react";
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
  exportOptions: ExportOptions;
  onExportOptionsChange: (options: Partial<ExportOptions>) => void;
  currentAppZoom: number;
  taskCount: number;
}

/**
 * Get readability status based on effective zoom level.
 */
function getReadabilityStatus(zoom: number): {
  level: "good" | "warning" | "critical";
  message: string;
  icon: typeof CheckCircle;
} {
  if (zoom >= EXPORT_ZOOM_READABLE_THRESHOLD) {
    return {
      level: "good",
      message: "Labels readable",
      icon: CheckCircle,
    };
  } else if (zoom >= EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD) {
    return {
      level: "warning",
      message: "Labels may be hard to read",
      icon: Warning,
    };
  } else {
    return {
      level: "critical",
      message: "Labels will be hidden or unreadable",
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
  // Get current page dimensions for display
  const pageDims =
    options.pageSize === "custom"
      ? options.customPageSize || { width: 500, height: 300 }
      : PDF_PAGE_SIZES[options.pageSize];
  const displayWidth =
    options.orientation === "landscape" ? pageDims.width : pageDims.height;
  const displayHeight =
    options.orientation === "landscape" ? pageDims.height : pageDims.width;

  // Calculate if content will need scaling (for "fit to page" info)
  const scaleInfo = useMemo(() => {
    if (exportOptions.zoomMode !== "fitToWidth") return null;

    const margins = PDF_MARGIN_PRESETS[options.marginPreset];
    const hasHeader = options.header.showProjectName || options.header.showAuthor || options.header.showExportDate;
    const hasFooter = options.footer.showProjectName || options.footer.showAuthor || options.footer.showExportDate;
    const headerReserved = hasHeader ? 10 : 0;
    const footerReserved = hasFooter ? 10 : 0;

    // Available height in mm and pixels
    const availableHeightMm =
      displayHeight - margins.top - margins.bottom - headerReserved - footerReserved;
    const availableHeightPx = mmToPx(availableHeightMm);

    // Content height based on task count and density
    const densityConfig = DENSITY_CONFIG[exportOptions.density];
    const headerHeight = exportOptions.includeHeader ? 48 : 0;
    const contentHeightPx = taskCount * densityConfig.rowHeight + headerHeight;

    // Check if content fits without scaling
    if (contentHeightPx <= availableHeightPx) {
      return null; // No scaling needed
    }

    // Content is taller than page - calculate the scale factor
    // With the optimization, we expand width to match page aspect ratio,
    // then scale down to fit. The scale factor is height-based.
    const scaleFactor = availableHeightPx / contentHeightPx;
    return {
      willScale: true,
      scaleFactor: Math.round(scaleFactor * 100),
    };
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

  // Calculate effective zoom for readability indicator
  const effectiveZoom = useMemo(() => {
    switch (exportOptions.zoomMode) {
      case "currentView":
        return currentAppZoom;
      case "custom":
        return exportOptions.timelineZoom;
      case "fitToWidth":
        // For PDF "fit to page", we estimate based on typical page width
        // Actual calculation happens in pdfExport.ts
        return 0.5; // Approximate - will be recalculated during export
      default:
        return exportOptions.timelineZoom;
    }
  }, [exportOptions.zoomMode, exportOptions.timelineZoom, currentAppZoom]);

  const readabilityStatus = useMemo(
    () => getReadabilityStatus(effectiveZoom),
    [effectiveZoom]
  );

  return (
    <div className="space-y-5">
      {/* Timeline Scale Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal
            size={16}
            weight="duotone"
            className="text-slate-500"
          />
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Timeline Scale
          </h4>
        </div>

        {/* Zoom Mode Selection */}
        <div className="space-y-1.5 mb-4">
          {/* Use Current View */}
          <label
            className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-150 ${
              exportOptions.zoomMode === "currentView"
                ? "bg-slate-50 border-slate-400"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="pdfZoomMode"
              value="currentView"
              checked={exportOptions.zoomMode === "currentView"}
              onChange={() => onExportOptionsChange({ zoomMode: "currentView" })}
              className="mt-0.5 accent-slate-700"
              aria-label="Use current view zoom level"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <MonitorPlay
                  size={16}
                  weight={
                    exportOptions.zoomMode === "currentView"
                      ? "duotone"
                      : "regular"
                  }
                  className="text-slate-500"
                />
                <span className="text-sm font-medium text-slate-800">
                  Use current view
                </span>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {Math.round(currentAppZoom * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-6">
                Export at the same zoom level as your current app view
              </p>
            </div>
          </label>

          {/* Fit to Page */}
          <label
            className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-150 ${
              exportOptions.zoomMode === "fitToWidth"
                ? "bg-slate-50 border-slate-400"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="pdfZoomMode"
              value="fitToWidth"
              checked={exportOptions.zoomMode === "fitToWidth"}
              onChange={() => onExportOptionsChange({ zoomMode: "fitToWidth" })}
              className="mt-0.5 accent-slate-700"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <ArrowsOutLineHorizontal
                  size={16}
                  weight={
                    exportOptions.zoomMode === "fitToWidth"
                      ? "duotone"
                      : "regular"
                  }
                  className="text-slate-500"
                />
                <span className="text-sm font-medium text-slate-800">
                  Fit to page
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-6">
                Automatically scale timeline to fit the selected page width
              </p>
            </div>
          </label>

          {/* Custom Zoom */}
          <label
            className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all duration-150 ${
              exportOptions.zoomMode === "custom"
                ? "bg-slate-50 border-slate-400"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="radio"
              name="pdfZoomMode"
              value="custom"
              checked={exportOptions.zoomMode === "custom"}
              onChange={() => onExportOptionsChange({ zoomMode: "custom" })}
              className="mt-0.5 accent-slate-700"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  size={16}
                  weight={
                    exportOptions.zoomMode === "custom" ? "duotone" : "regular"
                  }
                  className="text-slate-500"
                />
                <span className="text-sm font-medium text-slate-800">
                  Custom zoom
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-6">
                Set a specific zoom percentage (5% - 300%)
              </p>

              {/* Expanded options with animation */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  exportOptions.zoomMode === "custom"
                    ? "max-h-32 opacity-100 mt-3"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="ml-6 space-y-3">
                  {/* Slider with value display */}
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
                      className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-700"
                    />
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
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
                        className="w-12 px-1 py-0.5 text-sm text-center font-mono bg-transparent border-none focus:ring-0 focus:outline-none"
                        min={EXPORT_ZOOM_MIN * 100}
                        max={EXPORT_ZOOM_MAX * 100}
                      />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>

                  {/* Quick zoom buttons */}
                  <div className="flex gap-1.5">
                    {Object.entries(EXPORT_ZOOM_PRESETS).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          onExportOptionsChange({ timelineZoom: value })
                        }
                        className={`px-2 py-1 text-xs font-mono rounded-md border transition-all duration-150 ${
                          exportOptions.timelineZoom === value
                            ? "bg-slate-700 border-slate-700 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {Math.round(value * 100)}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* Readability Indicator - only show for currentView and custom modes */}
        {exportOptions.zoomMode !== "fitToWidth" && (
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
              readabilityStatus.level === "good"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : readabilityStatus.level === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <readabilityStatus.icon size={16} weight="bold" />
            <span className="text-xs font-medium flex-1">
              {readabilityStatus.message}
            </span>
            <span className="text-sm font-semibold font-mono">
              {Math.round(effectiveZoom * 100)}%
            </span>
          </div>
        )}

        {/* Scale Info - show when content will be scaled to fit page */}
        {scaleInfo && (
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800">
            <Info size={16} weight="bold" className="mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-medium">Content will be scaled to fit.</span>
              <span className="text-amber-700">
                {" "}
                The chart will be rendered at {scaleInfo.scaleFactor}% to fit the page while maximizing detail.
              </span>
            </div>
          </div>
        )}
      </div>

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

      </div>

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
              <span className="text-sm text-slate-700">Project title</span>
            </label>
            <label
              htmlFor="pdf-header-author"
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                id="pdf-header-author"
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
                className="accent-slate-700 rounded"
              />
              <span className="text-sm text-slate-700">Author</span>
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
              <span className="text-sm text-slate-700">Project title</span>
            </label>
            <label
              htmlFor="pdf-footer-author"
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                id="pdf-footer-author"
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
                className="accent-slate-700 rounded"
              />
              <span className="text-sm text-slate-700">Author</span>
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

      {/* PDF Metadata info */}
      <div className="p-2 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-500">
          Project title and author can be set in Chart Settings.
        </p>
      </div>
    </div>
  );
}
