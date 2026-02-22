/**
 * Export utilities for PNG, PDF, and SVG generation.
 */

export {
  captureChart,
  canvasToBlob,
  type CaptureChartParams,
} from "./captureChart";

// Layout computation (pure functions, no React)
export {
  calculateExportDimensions,
  computeExportLayout,
  type ExportLayout,
} from "./exportLayout";

// Shared constants
export {
  HEADER_HEIGHT,
  SVG_FONT_FAMILY,
  EXPORT_COLORS,
  TASK_TYPE_ICON_PATHS,
} from "./constants";

// Column definitions (single source of truth)
export {
  EXPORT_COLUMNS,
  EXPORT_COLUMN_MAP,
  HEADER_LABELS,
  type ExportColumn,
} from "./columns";

// Shared helpers
export {
  waitForFonts,
  waitForPaint,
  setFontFamilyOnTextElements,
  generateExportFilename,
  createOffscreenContainer,
  removeOffscreenContainer,
} from "./helpers";

// Task table rendering
export {
  renderTaskTableHeader,
  renderTaskTableRows,
  type FlattenedTask,
} from "./taskTableRenderer";
export {
  downloadBlob,
  downloadCanvasAsPng,
  generateFilename,
} from "./downloadPng";
export { sanitizeFilename } from "./sanitizeFilename";
export {
  INTERNAL_DPI,
  PNG_EXPORT_DPI,
  MM_PER_INCH,
  mmToPxAtDpi,
  pxToMmAtDpi,
  calculatePixelDimensions,
  formatDpiDescription,
} from "./dpi";
export {
  DEFAULT_EXPORT_OPTIONS,
  DEFAULT_PDF_OPTIONS,
  DEFAULT_SVG_OPTIONS,
  EXPORT_ZOOM_PRESETS,
  INITIAL_EXPORT_STATE,
  PDF_PAGE_SIZES,
  PDF_MARGIN_PRESETS,
  type ExportColumnKey,
  type ExportFormat,
  type ExportLayoutInput,
  type ExportOptions,
  type ExportState,
  type ExportZoomPreset,
  type PdfExportOptions,
  type PdfCustomPageSize,
  type PdfHeaderFooter,
  type PdfMarginPreset,
  type PdfMargins,
  type PdfOrientation,
  type PdfPageSize,
  type SvgDimensionMode,
  type SvgExportOptions,
  type SvgStyleMode,
  type SvgTextMode,
} from "./types";
export {
  BASE_PIXELS_PER_DAY,
  getDefaultColumnWidth,
  calculateTaskTableWidth,
  calculateEffectiveZoom,
  getEffectiveDateRange,
  calculateDurationDays,
  calculateOptimalColumnWidth,
  calculateOptimalColumnWidths,
} from "./calculations";
export { calculatePdfFitToWidth } from "./pdfLayout";

import {
  captureChart,
  canvasToBlob,
  type CaptureChartParams,
} from "./captureChart";
import { downloadBlob, generateFilename } from "./downloadPng";

/**
 * Export the chart to PNG with the given options.
 * This is the main export function that orchestrates the entire process.
 */
export async function exportToPng(params: CaptureChartParams): Promise<void> {
  // Capture the chart element
  const canvas = await captureChart(params);

  // Convert to blob
  const blob = await canvasToBlob(canvas);

  // Download the file with project name
  const filename = generateFilename(params.projectName);
  downloadBlob(blob, filename);
}
