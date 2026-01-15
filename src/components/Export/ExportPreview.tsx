/**
 * ExportPreview - Wrapper component that switches between preview types.
 * Renders PdfPreview for PDF format, ChartPreview for PNG/SVG.
 */

import type { ExportFormat, PdfExportOptions } from "../../utils/export/types";
import { ChartPreview, type ReadabilityStatus } from "./ChartPreview";
import { PdfPreview } from "./PdfPreview";

export interface ExportPreviewProps {
  format: ExportFormat;
  /** Data URL of the preview image */
  previewDataUrl: string | null;
  dimensions: { width: number; height: number };
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
export function ExportPreview({
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
}
