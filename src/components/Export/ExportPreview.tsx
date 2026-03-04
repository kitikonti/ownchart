/**
 * ExportPreview - Wrapper component that switches between preview types.
 * Renders PdfPreview for PDF format, ChartPreview for PNG/SVG.
 */

import { memo } from "react";
import type {
  PdfExportOptions,
  PixelDimensions,
  ReadabilityStatus,
} from "@/utils/export/types";
import { ChartPreview } from "./ChartPreview";
import { PdfPreview } from "./PdfPreview";

type SharedPreviewProps = {
  previewDataUrl: string | null;
  dimensions: PixelDimensions;
  isRendering: boolean;
  error: string | null;
  effectiveZoom?: number;
  readabilityStatus?: ReadabilityStatus;
};

type PdfPreviewVariant = SharedPreviewProps & {
  format: "pdf";
  pdfOptions: PdfExportOptions;
  projectTitle?: string;
  projectAuthor?: string;
};

type RasterPreviewVariant = SharedPreviewProps & {
  format: "png" | "svg";
  isTransparent: boolean;
};

/**
 * Discriminated-union props: PDF requires pdfOptions; PNG/SVG require isTransparent.
 * This makes format-specific requirements explicit at the type level —
 * callers cannot pass a PDF format without supplying pdfOptions, nor mix
 * PDF-only and raster-only props in the same render.
 */
export type ExportPreviewProps = PdfPreviewVariant | RasterPreviewVariant;

/**
 * ExportPreview - Renders the appropriate preview based on export format.
 */
export const ExportPreview = memo(function ExportPreview(
  props: ExportPreviewProps
): JSX.Element {
  const {
    previewDataUrl,
    dimensions,
    isRendering,
    error,
    effectiveZoom,
    readabilityStatus,
  } = props;

  if (props.format === "pdf") {
    return (
      <PdfPreview
        previewDataUrl={previewDataUrl}
        chartDimensions={dimensions}
        pdfOptions={props.pdfOptions}
        projectTitle={props.projectTitle}
        projectAuthor={props.projectAuthor}
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
      isTransparent={props.isTransparent}
      effectiveZoom={effectiveZoom}
      readabilityStatus={readabilityStatus}
      formatType={props.format === "svg" ? "svg" : "png"}
    />
  );
});
