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

// Shared constants — only public-API constants are re-exported here.
// Internal SVG-rendering constants (TEXT_BASELINE_OFFSET, ICON_RENDER_SIZE, etc.)
// are imported directly from ./constants by the renderers that need them.
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
  estimateFileSize,
} from "./helpers";

// Task table rendering
export {
  renderTaskTableHeader,
  renderTaskTableRows,
  type TaskTableHeaderOptions,
  type TaskTableRowsOptions,
} from "./taskTableRenderer";
export type { FlattenedTask } from "./types";
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
  DEFAULT_FIT_TO_WIDTH_PX,
  DEFAULT_PDF_OPTIONS,
  DEFAULT_SVG_OPTIONS,
  EXPORT_ZOOM_PRESETS,
  INITIAL_EXPORT_STATE,
  PDF_PAGE_SIZES,
  PDF_MARGIN_PRESETS,
  UHD_SCREEN_WIDTH_PX,
  type ExportColumnKey,
  type ExportFormat,
  type ExportLayoutInput,
  type ExportOptions,
  type ExportState,
  type ExportZoomPreset,
  type PdfExportOptions,
  type PdfCustomPageSize,
  type PdfHeaderFooter,
  type PdfMetadata,
  type PdfMarginPreset,
  type PdfMargins,
  type PdfOrientation,
  type PdfPageSize,
  type SvgDimensionMode,
  type SvgExportOptions,
  type SvgStyleMode,
  type SvgTextMode,
  type ExportQuickPreset,
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
export {
  calculatePdfFitToWidth,
  PDF_HEADER_FOOTER_RESERVED_MM,
  hasHeaderFooterContent,
  getReservedSpace,
  formatPageSizeName,
  getPageDimensions,
  getMargins,
  mmToPx,
} from "./pdfLayout";

// Page size presets (runtime data, separate from type definitions)
export { EXPORT_QUICK_PRESETS } from "./pagePresets";

// High-level orchestration
export { exportToPng } from "./exportToPng";
