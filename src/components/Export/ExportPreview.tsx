/**
 * ExportPreview - Wrapper component that switches between preview types.
 * Renders PdfPreview for PDF format, ChartPreview for PNG/SVG.
 */

import type { ExportFormat, PdfExportOptions } from "../../utils/export/types";
import { ChartPreview } from "./ChartPreview";
import { PdfPreview } from "./PdfPreview";

export interface ExportPreviewProps {
  format: ExportFormat;
  canvas: HTMLCanvasElement | null;
  dimensions: { width: number; height: number };
  isRendering: boolean;
  error: string | null;
  isTransparent: boolean;
  pdfOptions?: PdfExportOptions;
  projectTitle?: string;
  projectAuthor?: string;
}

/**
 * ExportPreview - Renders the appropriate preview based on export format.
 */
export function ExportPreview({
  format,
  canvas,
  dimensions,
  isRendering,
  error,
  isTransparent,
  pdfOptions,
  projectTitle,
  projectAuthor,
}: ExportPreviewProps): JSX.Element {
  if (format === "pdf" && pdfOptions) {
    return (
      <PdfPreview
        canvas={canvas}
        chartDimensions={dimensions}
        pdfOptions={pdfOptions}
        projectTitle={projectTitle}
        projectAuthor={projectAuthor}
        isRendering={isRendering}
        error={error}
      />
    );
  }

  return (
    <ChartPreview
      canvas={canvas}
      dimensions={dimensions}
      isRendering={isRendering}
      error={error}
      isTransparent={isTransparent}
    />
  );
}
