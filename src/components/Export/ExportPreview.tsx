/**
 * ExportPreview - Wrapper component that switches between preview types.
 * Renders PdfPreview for PDF format, ChartPreview for PNG/SVG.
 */

import { memo } from "react";
import type {
  ExportFormat,
  PdfExportOptions,
  PixelDimensions,
  ReadabilityStatus,
} from "@/utils/export/types";
import { ChartPreview } from "./ChartPreview";
import { PdfPreview } from "./PdfPreview";

export interface ExportPreviewProps {
  format: ExportFormat;
  /** Data URL of the preview image */
  previewDataUrl: string | null;
  dimensions: PixelDimensions;
  isRendering: boolean;
  error: string | null;
  isTransparent: boolean;
  pdfOptions?: PdfExportOptions;
  projectTitle?: string;
  projectAuthor?: string;
  /** Effective zoom for preview info */
  effectiveZoom?: number;
  /** Readability status for preview */
  readabilityStatus?: ReadabilityStatus;
}

/**
 * ExportPreview - Renders the appropriate preview based on export format.
 */
export const ExportPreview = memo(function ExportPreview({
  format,
  previewDataUrl,
  dimensions,
  isRendering,
  error,
  isTransparent,
  pdfOptions,
  projectTitle,
  projectAuthor,
  effectiveZoom,
  readabilityStatus,
}: ExportPreviewProps): JSX.Element {
  // pdfOptions is optional so ExportPreview can be used outside ExportDialog
  // (e.g. in tests or future standalone contexts). Within ExportDialog it is
  // always populated by the hook; the undefined branch is a loading-state guard.
  if (format === "pdf" && pdfOptions) {
    return (
      <PdfPreview
        previewDataUrl={previewDataUrl}
        chartDimensions={dimensions}
        pdfOptions={pdfOptions}
        projectTitle={projectTitle}
        projectAuthor={projectAuthor}
        isRendering={isRendering}
        error={error}
        effectiveZoom={effectiveZoom}
        readabilityStatus={readabilityStatus}
      />
    );
  }

  return (
    <ChartPreview
      previewDataUrl={previewDataUrl}
      dimensions={dimensions}
      isRendering={isRendering}
      error={error}
      isTransparent={isTransparent}
      effectiveZoom={effectiveZoom}
      readabilityStatus={readabilityStatus}
      formatType={format === "svg" ? "svg" : "png"}
    />
  );
});
