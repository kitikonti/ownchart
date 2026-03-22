/**
 * Export utilities for PNG, PDF, and SVG generation.
 *
 * Primary entry point:
 *   exportToPng — high-level orchestration for PNG export
 *
 * Supporting utilities are grouped below by concern.
 */

// High-level orchestration (primary public API)
export { exportToPng } from "./exportToPng";

// Types and domain constants (single source of truth for the export domain)
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
  type FlattenedTask,
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

// Capture (canvas-level PNG generation)
export {
  captureChart,
  canvasToBlob,
  type CaptureChartParams,
} from "./captureChart";

// Download helpers
export {
  downloadBlob,
  downloadCanvasAsPng,
  generateFilename,
} from "./downloadPng";

// Filename sanitization
export { sanitizeFilename, MAX_NAME_LENGTH } from "./sanitizeFilename";

// Layout computation (pure functions, no React)
export {
  calculateExportDimensions,
  computeExportLayout,
  type ExportLayout,
} from "./exportLayout";

// DPI constants and conversion utilities
export {
  INTERNAL_DPI,
  PNG_EXPORT_DPI,
  MM_PER_INCH,
  mmToPxAtDpi,
  pxToMmAtDpi,
  calculatePixelDimensions,
  formatDpiDescription,
} from "./dpi";

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

// Calculation utilities
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

// PDF layout utilities
export {
  calculatePdfFitToWidth,
  hasHeaderFooterContent,
  getReservedSpace,
  formatPageSizeName,
  getPageDimensions,
  getMargins,
  mmToPx,
} from "./pdfLayout";

// Page size presets (runtime data, separate from type definitions)
export { EXPORT_QUICK_PRESETS } from "./pagePresets";
