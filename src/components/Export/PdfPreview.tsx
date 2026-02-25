/**
 * PdfPreview - Preview component for PDF exports.
 * Shows a paper frame with correct aspect ratio, margins, header/footer.
 */

import { Spinner, WarningCircle, Warning } from "@phosphor-icons/react";
import type {
  PdfExportOptions,
  PdfPageSize,
  ReadabilityStatus,
} from "../../utils/export/types";
import { PDF_PAGE_SIZES, PDF_MARGIN_PRESETS } from "../../utils/export/types";

export interface PdfPreviewProps {
  /** Data URL of the preview image */
  previewDataUrl: string | null;
  chartDimensions: { width: number; height: number };
  pdfOptions: PdfExportOptions;
  projectTitle?: string;
  projectAuthor?: string;
  isRendering: boolean;
  error: string | null;
  /** Effective zoom for timeline (for readability indicator) */
  effectiveZoom?: number;
  /** Readability status for labels */
  readabilityStatus?: ReadabilityStatus;
}

/**
 * Get page dimensions in mm for a given page size and orientation.
 */
function getPageDimensions(
  pageSize: PdfPageSize,
  orientation: "landscape" | "portrait",
  customSize?: { width: number; height: number }
): { width: number; height: number } {
  if (pageSize === "custom" && customSize) {
    return orientation === "landscape"
      ? customSize
      : { width: customSize.height, height: customSize.width };
  }

  const baseDims = PDF_PAGE_SIZES[pageSize as Exclude<PdfPageSize, "custom">];
  if (!baseDims) {
    // Fallback to A4
    return orientation === "landscape"
      ? { width: 297, height: 210 }
      : { width: 210, height: 297 };
  }

  // PDF_PAGE_SIZES are in landscape orientation
  return orientation === "landscape"
    ? baseDims
    : { width: baseDims.height, height: baseDims.width };
}

/**
 * Format page size display name.
 */
function formatPageSizeName(pageSize: PdfPageSize): string {
  const names: Record<PdfPageSize, string> = {
    a4: "A4",
    a3: "A3",
    a2: "A2",
    a1: "A1",
    a0: "A0",
    letter: "Letter",
    legal: "Legal",
    tabloid: "Tabloid",
    custom: "Custom",
  };
  return names[pageSize] || pageSize.toUpperCase();
}

/**
 * Format today's date.
 */
function formatDate(): string {
  return new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * PdfPreview component for PDF export preview.
 * Shows a paper frame with header/footer and chart content.
 */
export function PdfPreview({
  previewDataUrl,
  chartDimensions,
  pdfOptions,
  projectTitle,
  projectAuthor,
  isRendering,
  error,
  effectiveZoom,
  readabilityStatus,
}: PdfPreviewProps): JSX.Element {
  // Get page and margin dimensions
  const pageDims = getPageDimensions(
    pdfOptions.pageSize,
    pdfOptions.orientation,
    pdfOptions.customPageSize
  );
  const margins =
    pdfOptions.customMargins ||
    PDF_MARGIN_PRESETS[pdfOptions.marginPreset] ||
    PDF_MARGIN_PRESETS.normal;

  // Calculate aspect ratio for paper frame
  const aspectRatio = pageDims.width / pageDims.height;

  // Calculate content area (after margins)
  const contentWidthMm = pageDims.width - margins.left - margins.right;
  const contentHeightMm = pageDims.height - margins.top - margins.bottom;

  // Calculate scale factor if chart doesn't fit
  const hasHeader =
    pdfOptions.header.showProjectName ||
    pdfOptions.header.showAuthor ||
    pdfOptions.header.showExportDate;
  const hasFooter =
    pdfOptions.footer.showProjectName ||
    pdfOptions.footer.showAuthor ||
    pdfOptions.footer.showExportDate;

  // Header/footer take up space in mm (must match pdfExport.ts reserved space)
  const headerHeightMm = hasHeader ? 10 : 0;
  const footerHeightMm = hasFooter ? 10 : 0;
  const chartAreaHeightMm = contentHeightMm - headerHeightMm - footerHeightMm;

  // Calculate scale factor if chart needs to be scaled down
  // Using mm to pixels: 1mm ≈ 3.78 px at 96 DPI
  const mmToPx = 3.78;
  const chartAreaWidthPx = contentWidthMm * mmToPx;
  const chartAreaHeightPx = chartAreaHeightMm * mmToPx;

  let scaleFactor = 1;
  if (chartDimensions.width > 0 && chartDimensions.height > 0) {
    const scaleX = chartAreaWidthPx / chartDimensions.width;
    const scaleY = chartAreaHeightPx / chartDimensions.height;
    scaleFactor = Math.min(scaleX, scaleY, 1);
  }
  const scalePercent = Math.round(scaleFactor * 100);

  // Build header content
  const headerLeft: string[] = [];
  const headerRight: string[] = [];
  if (pdfOptions.header.showProjectName && projectTitle) {
    headerLeft.push(projectTitle);
  }
  if (pdfOptions.header.showAuthor && projectAuthor) {
    headerRight.push(projectAuthor);
  }
  if (pdfOptions.header.showExportDate) {
    headerRight.push(formatDate());
  }

  // Build footer content (same layout as header: title left, author+date right)
  const footerLeft: string[] = [];
  const footerRight: string[] = [];
  if (pdfOptions.footer.showProjectName && projectTitle) {
    footerLeft.push(projectTitle);
  }
  if (pdfOptions.footer.showAuthor && projectAuthor) {
    footerRight.push(projectAuthor);
  }
  if (pdfOptions.footer.showExportDate) {
    footerRight.push(formatDate());
  }

  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-700 mb-1">
          PDF Preview
        </h3>
        <p className="text-xs text-neutral-500">Page layout visualization</p>
      </div>

      {/* Paper Frame Container */}
      <div className="flex-1 flex items-center justify-center p-2">
        <div
          className="bg-white border border-neutral-200 shadow-sm relative overflow-hidden"
          style={{
            aspectRatio: `${aspectRatio}`,
            maxWidth: "100%",
            maxHeight: "100%",
            width: aspectRatio >= 1 ? "100%" : "auto",
            height: aspectRatio < 1 ? "100%" : "auto",
          }}
        >
          {/* Margin visualization */}
          <div
            className="absolute inset-0 flex flex-col"
            style={{
              padding: `${(margins.top / pageDims.height) * 100}% ${(margins.right / pageDims.width) * 100}% ${(margins.bottom / pageDims.height) * 100}% ${(margins.left / pageDims.width) * 100}%`,
            }}
          >
            {/* Margin border (dashed) */}
            <div className="absolute inset-0 border border-dashed border-neutral-200 pointer-events-none" />

            {/* Content area */}
            <div className="flex flex-col h-full">
              {/* Header */}
              {hasHeader && (
                <div className="flex items-center justify-between px-1 py-0.5 border-b border-neutral-200 shrink-0">
                  <span className="text-[6px] text-neutral-600 truncate">
                    {headerLeft.join(" \u00B7 ")}
                  </span>
                  <span className="text-[6px] text-neutral-600 truncate">
                    {headerRight.join(" \u00B7 ")}
                  </span>
                </div>
              )}

              {/* Chart Content Area */}
              <div className="flex-1 flex items-start justify-center relative min-h-0 overflow-hidden">
                {/* Loading State */}
                {isRendering && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
                    <Spinner
                      size={20}
                      className="animate-spin text-brand-600"
                      weight="regular"
                    />
                    <p className="text-[8px] text-neutral-600 mt-2">
                      Rendering...
                    </p>
                  </div>
                )}

                {/* Error State */}
                {error && !isRendering && (
                  <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10 p-2">
                    <WarningCircle
                      size={16}
                      className="text-red-500"
                      weight="fill"
                    />
                    <p className="text-[7px] text-red-700 mt-1 text-center">
                      {error}
                    </p>
                  </div>
                )}

                {/* Preview Image */}
                {!error && previewDataUrl && (
                  <img
                    src={previewDataUrl}
                    alt="Export preview"
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                )}

                {/* Placeholder */}
                {!previewDataUrl && !isRendering && !error && (
                  <div className="flex items-center justify-center">
                    <div className="w-3/4 h-1/2 bg-neutral-100 rounded flex items-center justify-center">
                      <span className="text-[7px] text-neutral-400">
                        Chart content
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {hasFooter && (
                <div className="flex items-center justify-between px-1 py-0.5 border-t border-neutral-200 shrink-0">
                  <span className="text-[6px] text-neutral-600 truncate">
                    {footerLeft.join(" \u00B7 ")}
                  </span>
                  <span className="text-[6px] text-neutral-600 truncate">
                    {footerRight.join(" \u00B7 ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel - Compact */}
      <div className="mt-4 space-y-2">
        {/* Single row with dot separators */}
        <div className="text-xs text-neutral-600">
          <span className="font-medium text-neutral-900">
            {effectiveZoom !== undefined
              ? `${Math.round(effectiveZoom * 100)}%`
              : "—"}
          </span>
          {" zoom"}
          <span className="mx-1.5 text-neutral-300">·</span>
          <span className="font-medium text-neutral-900">
            {formatPageSizeName(pdfOptions.pageSize)}{" "}
            {pdfOptions.orientation === "landscape" ? "Landscape" : "Portrait"}
          </span>
          <span className="mx-1.5 text-neutral-300">·</span>
          <span className="font-medium text-neutral-900">
            {pageDims.width}×{pageDims.height}
          </span>
          {" mm"}
        </div>

        {/* Readability Indicator - only show warnings/critical */}
        {readabilityStatus && readabilityStatus.level !== "good" && (
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded ${
              readabilityStatus.level === "warning"
                ? "bg-amber-50 border border-amber-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <Warning
              size={16}
              weight="fill"
              className={
                readabilityStatus.level === "warning"
                  ? "text-amber-600"
                  : "text-red-600"
              }
            />
            <span
              className={`text-xs font-semibold ${
                readabilityStatus.level === "warning"
                  ? "text-amber-700"
                  : "text-red-700"
              }`}
            >
              {readabilityStatus.message}
            </span>
          </div>
        )}

        {/* Scale Warning - if content needs significant scaling to fit page */}
        {scaleFactor < 0.5 && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded bg-amber-50 border border-amber-200">
            <WarningCircle size={16} weight="fill" className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">
              Content scaled to {scalePercent}% — consider larger page size
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
