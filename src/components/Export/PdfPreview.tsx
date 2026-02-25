/**
 * PdfPreview - Preview component for PDF exports.
 * Shows a paper frame with correct aspect ratio, margins, header/footer.
 */

import { useMemo } from "react";
import { Spinner, WarningCircle, Warning } from "@phosphor-icons/react";
import type {
  PdfExportOptions,
  PdfHeaderFooter,
  ReadabilityStatus,
} from "../../utils/export/types";
import {
  getPageDimensions,
  getMargins,
  getReservedSpace,
  hasHeaderFooterContent,
  mmToPx,
  formatPageSizeName,
} from "../../utils/export/pdfLayout";

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Helpers
// =============================================================================

/**
 * Build left/right text arrays for a header or footer section.
 */
function buildSectionContent(
  section: PdfHeaderFooter,
  projectTitle: string | undefined,
  projectAuthor: string | undefined,
  formattedDate: string
): { left: string[]; right: string[] } {
  const left: string[] = [];
  const right: string[] = [];

  if (section.showProjectName && projectTitle) {
    left.push(projectTitle);
  }
  if (section.showAuthor && projectAuthor) {
    right.push(projectAuthor);
  }
  if (section.showExportDate) {
    right.push(formattedDate);
  }

  return { left, right };
}

/**
 * Calculate scale factor when fitting chart into the PDF content area.
 * Returns a value in [0, 1] — 1 means the chart fits without scaling.
 */
function calculateScaleFactor(
  chartWidth: number,
  chartHeight: number,
  contentWidthMm: number,
  chartAreaHeightMm: number
): number {
  if (chartWidth <= 0 || chartHeight <= 0) return 1;

  const chartAreaWidthPx = mmToPx(contentWidthMm);
  const chartAreaHeightPx = mmToPx(chartAreaHeightMm);
  const scaleX = chartAreaWidthPx / chartWidth;
  const scaleY = chartAreaHeightPx / chartHeight;
  return Math.min(scaleX, scaleY, 1);
}

// =============================================================================
// Sub-components
// =============================================================================

/** Dot-separated row in the header or footer strip */
function SectionStrip({
  left,
  right,
  border,
}: {
  left: string[];
  right: string[];
  border: "top" | "bottom";
}): JSX.Element {
  const borderClass =
    border === "bottom"
      ? "border-b border-neutral-200"
      : "border-t border-neutral-200";
  return (
    <div
      className={`flex items-center justify-between px-1 py-0.5 ${borderClass} shrink-0`}
    >
      <span className="text-[6px] text-neutral-600 truncate">
        {left.join(" \u00B7 ")}
      </span>
      <span className="text-[6px] text-neutral-600 truncate">
        {right.join(" \u00B7 ")}
      </span>
    </div>
  );
}

/** Info panel below the paper frame showing zoom, page size, and warnings */
function PdfPreviewInfo({
  effectiveZoom,
  pdfOptions,
  pageDims,
  scaleFactor,
  readabilityStatus,
}: {
  effectiveZoom: number | undefined;
  pdfOptions: PdfExportOptions;
  pageDims: { width: number; height: number };
  scaleFactor: number;
  readabilityStatus: ReadabilityStatus | undefined;
}): JSX.Element {
  const scalePercent = Math.round(scaleFactor * 100);
  const SCALE_WARNING_THRESHOLD = 0.5;

  return (
    <div className="mt-4 space-y-2">
      {/* Single row with dot separators */}
      <div className="text-xs text-neutral-600">
        <span className="font-medium text-neutral-900">
          {effectiveZoom !== undefined
            ? `${Math.round(effectiveZoom * 100)}%`
            : "\u2014"}
        </span>
        {" zoom"}
        <span className="mx-1.5 text-neutral-300">&middot;</span>
        <span className="font-medium text-neutral-900">
          {formatPageSizeName(pdfOptions.pageSize)}{" "}
          {pdfOptions.orientation === "landscape" ? "Landscape" : "Portrait"}
        </span>
        <span className="mx-1.5 text-neutral-300">&middot;</span>
        <span className="font-medium text-neutral-900">
          {pageDims.width}&times;{pageDims.height}
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
      {scaleFactor < SCALE_WARNING_THRESHOLD && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded bg-amber-50 border border-amber-200">
          <WarningCircle size={16} weight="fill" className="text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">
            Content scaled to {scalePercent}% &mdash; consider larger page size
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

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
  // Use canonical layout utilities — single source of truth with pdfExport.ts
  const pageDims = getPageDimensions(pdfOptions);
  const margins = getMargins(pdfOptions);

  const aspectRatio = pageDims.width / pageDims.height;
  const contentWidthMm = pageDims.width - margins.left - margins.right;
  const contentHeightMm = pageDims.height - margins.top - margins.bottom;

  const hasHeader = hasHeaderFooterContent(pdfOptions.header);
  const hasFooter = hasHeaderFooterContent(pdfOptions.footer);
  const headerHeightMm = getReservedSpace(pdfOptions.header);
  const footerHeightMm = getReservedSpace(pdfOptions.footer);
  const chartAreaHeightMm = contentHeightMm - headerHeightMm - footerHeightMm;

  const scaleFactor = calculateScaleFactor(
    chartDimensions.width,
    chartDimensions.height,
    contentWidthMm,
    chartAreaHeightMm
  );

  // Stable formatted date — only recalculate when pdfOptions identity changes
  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pdfOptions]
  );

  const headerContent = buildSectionContent(
    pdfOptions.header,
    projectTitle,
    projectAuthor,
    formattedDate
  );
  const footerContent = buildSectionContent(
    pdfOptions.footer,
    projectTitle,
    projectAuthor,
    formattedDate
  );

  // Margin padding as percentages of page dimensions for responsive scaling
  const marginPadding = `${(margins.top / pageDims.height) * 100}% ${(margins.right / pageDims.width) * 100}% ${(margins.bottom / pageDims.height) * 100}% ${(margins.left / pageDims.width) * 100}%`;

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
            style={{ padding: marginPadding }}
          >
            {/* Margin border (dashed) */}
            <div className="absolute inset-0 border border-dashed border-neutral-200 pointer-events-none" />

            {/* Content area */}
            <div className="flex flex-col h-full">
              {hasHeader && (
                <SectionStrip
                  left={headerContent.left}
                  right={headerContent.right}
                  border="bottom"
                />
              )}

              {/* Chart Content Area */}
              <div className="flex-1 flex items-start justify-center relative min-h-0 overflow-hidden">
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

                {!error && previewDataUrl && (
                  <img
                    src={previewDataUrl}
                    alt="Export preview"
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                )}

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

              {hasFooter && (
                <SectionStrip
                  left={footerContent.left}
                  right={footerContent.right}
                  border="top"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <PdfPreviewInfo
        effectiveZoom={effectiveZoom}
        pdfOptions={pdfOptions}
        pageDims={pageDims}
        scaleFactor={scaleFactor}
        readabilityStatus={readabilityStatus}
      />
    </div>
  );
}
