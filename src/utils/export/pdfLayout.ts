/**
 * PDF Layout utilities.
 * Handles coordinate conversion and printable area calculation.
 */

import type {
  PdfExportOptions,
  PdfHeaderFooter,
  PdfMargins,
  PdfPageSize,
  ExportOptions,
} from "./types";
import {
  PDF_PAGE_SIZES,
  PDF_MARGIN_PRESETS,
  DEFAULT_CUSTOM_PAGE_SIZE,
} from "./types";
import { INTERNAL_DPI, MM_PER_INCH, PNG_EXPORT_DPI, mmToPxAtDpi } from "./dpi";
import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import { buildFlattenedTaskList } from "../hierarchy";
import { DENSITY_CONFIG } from "../../config/densityConfig";
import { HEADER_HEIGHT } from "./constants";

/**
 * @deprecated These re-exports exist only for backwards compatibility with callers
 * that imported from pdfLayout before the DPI helpers were extracted to ./dpi.
 * Import directly from './dpi' for new code.
 * TODO: Remove these re-exports once all callers are migrated to './dpi'.
 *       Track progress by searching for `from.*pdfLayout` imports of these names.
 */
export { INTERNAL_DPI, PNG_EXPORT_DPI, MM_PER_INCH } from "./dpi";
/** @deprecated Import from './dpi' directly. */
export {
  mmToPxAtDpi,
  calculatePixelDimensions,
  formatDpiDescription,
} from "./dpi";

// =============================================================================
// Derived Constants for PDF
// =============================================================================

/** Points per millimeter (72 pt/inch ÷ 25.4 mm/inch) */
export const PT_PER_MM = 72 / MM_PER_INCH;

/** Points per pixel at internal DPI */
export const PT_PER_PX = 72 / INTERNAL_DPI;

/** Millimeters per pixel at internal DPI */
export const MM_PER_PX = MM_PER_INCH / INTERNAL_DPI;

/**
 * Convert millimeters to points (PDF native unit).
 */
export function mmToPt(mm: number): number {
  return mm * PT_PER_MM;
}

/**
 * Convert points to millimeters.
 */
export function ptToMm(pt: number): number {
  return pt / PT_PER_MM;
}

/**
 * Convert pixels to points.
 */
export function pxToPt(px: number): number {
  return px * PT_PER_PX;
}

/**
 * Convert points to pixels.
 */
export function ptToPx(pt: number): number {
  return pt / PT_PER_PX;
}

/**
 * Convert pixels to millimeters.
 */
export function pxToMm(px: number): number {
  return px * MM_PER_PX;
}

/**
 * Convert millimeters to pixels (at internal DPI).
 */
export function mmToPx(mm: number): number {
  return mm / MM_PER_PX;
}

// =============================================================================
// PDF Header/Footer Constants
// =============================================================================

/** Reserved space (mm) for header or footer when content is enabled */
export const PDF_HEADER_FOOTER_RESERVED_MM = 10;

/**
 * Approximation of average character width as a fraction of font size (in pt).
 * Based on Helvetica metrics; used exclusively by truncateText() for width estimation.
 */
const HELVETICA_AVG_CHAR_WIDTH_RATIO = 0.5;

/** Ellipsis string appended when text is truncated. Used only by truncateText(). */
const ELLIPSIS = "...";

/**
 * Check whether a header/footer section has any content enabled.
 */
export function hasHeaderFooterContent(section: PdfHeaderFooter): boolean {
  return (
    section.showProjectName || section.showAuthor || section.showExportDate
  );
}

/**
 * Calculate reserved space (mm) for a header/footer section.
 * Returns PDF_HEADER_FOOTER_RESERVED_MM if any content is enabled, 0 otherwise.
 */
export function getReservedSpace(section: PdfHeaderFooter): number {
  return hasHeaderFooterContent(section) ? PDF_HEADER_FOOTER_RESERVED_MM : 0;
}

/**
 * Format page size display name (e.g. "a4" → "A4", "letter" → "Letter").
 */
export function formatPageSizeName(pageSize: PdfPageSize): string {
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
  return names[pageSize];
}

/**
 * Page dimensions in millimeters.
 */
export interface PageDimensions {
  width: number;
  height: number;
}

/**
 * Printable area dimensions and position in millimeters.
 */
export interface PrintableArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get page dimensions based on options.
 */
export function getPageDimensions(options: PdfExportOptions): PageDimensions {
  // Handle custom page size
  const pageSize =
    options.pageSize === "custom"
      ? options.customPageSize || DEFAULT_CUSTOM_PAGE_SIZE
      : PDF_PAGE_SIZES[options.pageSize];

  // Landscape dimensions are width x height
  // Portrait dimensions are height x width
  const width =
    options.orientation === "landscape" ? pageSize.width : pageSize.height;
  const height =
    options.orientation === "landscape" ? pageSize.height : pageSize.width;

  return { width, height };
}

/**
 * Get margin values based on preset or custom.
 */
export function getMargins(options: PdfExportOptions): PdfMargins {
  if (options.marginPreset === "custom" && options.customMargins) {
    return options.customMargins;
  }
  return PDF_MARGIN_PRESETS[options.marginPreset];
}

/**
 * Calculate printable area within page margins.
 */
export function getPrintableArea(options: PdfExportOptions): PrintableArea {
  const page = getPageDimensions(options);
  const margins = getMargins(options);

  return {
    x: margins.left,
    y: margins.top,
    width: page.width - margins.left - margins.right,
    height: page.height - margins.top - margins.bottom,
  };
}

/**
 * Scale calculation result.
 */
export interface ScaleResult {
  scale: number;
  chartWidth: number; // Final chart width in mm
  chartHeight: number; // Final chart height in mm
  offsetX: number; // X offset to center chart
  offsetY: number; // Y offset to center chart
}

/**
 * Calculate scale factor to fit content in printable area.
 * @param contentWidth - Content width in pixels
 * @param contentHeight - Content height in pixels
 * @param options - PDF export options
 * @param reservedTop - Reserved space at top for header (mm)
 * @param reservedBottom - Reserved space at bottom for footer (mm)
 */
export function calculateScale(
  contentWidth: number,
  contentHeight: number,
  options: PdfExportOptions,
  reservedTop: number = 0,
  reservedBottom: number = 0
): ScaleResult {
  const printable = getPrintableArea(options);

  // Available space after reserving header/footer
  const availableHeight = printable.height - reservedTop - reservedBottom;

  // Convert content dimensions to mm
  const contentWidthMm = pxToMm(contentWidth);
  const contentHeightMm = pxToMm(contentHeight);

  // Calculate scale to fit both width and height on a single page
  const scaleX = printable.width / contentWidthMm;
  const scaleY = availableHeight / contentHeightMm;
  const scale = Math.min(scaleX, scaleY);

  // Final dimensions
  const chartWidth = contentWidthMm * scale;
  const chartHeight = contentHeightMm * scale;

  // Center horizontally, align to top
  const offsetX = (printable.width - chartWidth) / 2;
  const offsetY = reservedTop;

  return {
    scale,
    chartWidth,
    chartHeight,
    offsetX,
    offsetY,
  };
}

/**
 * Colors for PDF rendering.
 */
export interface PdfColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert a 6-digit hex color string to RGB components.
 * Accepts strings with or without a leading `#` (e.g. `"#ff0000"` or `"ff0000"`).
 * 3-digit shorthand hex (e.g. `"#fff"`) is NOT supported — falls back to neutral gray.
 * @param hex - Hex color string (6 digits, optionally prefixed with `#`)
 * @returns RGB object with `r`, `g`, `b` in the range 0–255
 */
export function hexToRgb(hex: string): PdfColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Invalid hex string (including unsupported 3-digit shorthand) —
    // return a neutral gray as a safe fallback to avoid crashing PDF rendering.
    if (import.meta.env.DEV) {
      console.warn(
        "[pdfLayout] hexToRgb: unsupported or invalid hex value:",
        hex
      );
    }
    return { r: 128, g: 128, b: 128 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Truncate text to fit within a given width.
 * @param text - The text to truncate
 * @param maxWidth - Maximum width in mm
 * @param fontSize - Font size in pt
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(
  text: string,
  maxWidth: number,
  fontSize: number
): string {
  if (!text) return text;
  if (maxWidth <= 0) return "";

  // Approximate character width (varies by font)
  // For Helvetica, average char width is ~HELVETICA_AVG_CHAR_WIDTH_RATIO * fontSize in pt
  const avgCharWidthPt = fontSize * HELVETICA_AVG_CHAR_WIDTH_RATIO;
  const avgCharWidthMm = ptToMm(avgCharWidthPt);

  const maxChars = Math.floor(maxWidth / avgCharWidthMm);

  if (text.length <= maxChars) {
    return text;
  }

  // Guard: if maxChars is too small to fit an ellipsis, just cut hard
  if (maxChars <= ELLIPSIS.length) {
    return text.substring(0, maxChars);
  }

  // Truncate with ellipsis
  return text.substring(0, maxChars - ELLIPSIS.length) + ELLIPSIS;
}

/**
 * Estimate the total content height in pixels for a given task list and export options.
 * Used internally by calculatePdfFitToWidth to determine whether content overflows the
 * available page height, which drives the aspect-ratio compensation logic.
 *
 * @param tasks - All tasks to export (including hidden/collapsed — hierarchy determines rows)
 * @param options - Export options (for density and header inclusion)
 * @returns Estimated content height in pixels at INTERNAL_DPI
 */
function estimateContentHeightPx(
  tasks: Task[],
  options: ExportOptions
): number {
  const densityConfig = DENSITY_CONFIG[options.density];
  const contentHeaderHeight = options.includeHeader ? HEADER_HEIGHT : 0;
  const flattenedTasks = buildFlattenedTaskList(tasks, new Set<TaskId>());
  return flattenedTasks.length * densityConfig.rowHeight + contentHeaderHeight;
}

/**
 * Calculate the optimal fitToWidth for PDF "Fit to Page" mode.
 *
 * In PDF export, the rendered content is scaled to fit the printable area.
 * When content is taller than the page, scaling down reduces the effective width.
 * This function calculates a wider fitToWidth so that after scaling, the content
 * fills the page width.
 *
 * @param tasks - All tasks to export
 * @param options - Export options (for density, header, etc.)
 * @param pdfOptions - PDF-specific options (page size, margins, header/footer)
 * @returns Optimal fitToWidth in pixels
 */
export function calculatePdfFitToWidth(
  tasks: Task[],
  options: ExportOptions,
  pdfOptions: PdfExportOptions
): number {
  const pageDims = getPageDimensions(pdfOptions);
  const margins = getMargins(pdfOptions);

  // Calculate reserved space for PDF header/footer
  const headerReserved = getReservedSpace(pdfOptions.header);
  const footerReserved = getReservedSpace(pdfOptions.footer);

  const availableWidthMm = pageDims.width - margins.left - margins.right;
  const availableHeightMm =
    pageDims.height -
    margins.top -
    margins.bottom -
    headerReserved -
    footerReserved;

  // Convert to pixels at PNG_EXPORT_DPI (150) — intentionally NOT INTERNAL_DPI (96) —
  // so the result is consistent with PNG preset widths and page-size presets in types.ts.
  // Do not substitute mmToPx() here; that helper operates at INTERNAL_DPI.
  const availableWidthPx = mmToPxAtDpi(availableWidthMm, PNG_EXPORT_DPI);
  const availableHeightPx = mmToPxAtDpi(availableHeightMm, PNG_EXPORT_DPI);

  const contentHeightPx = estimateContentHeightPx(tasks, options);

  // Base width matches PNG preset (full page at PNG_EXPORT_DPI, not INTERNAL_DPI)
  const baseWidthPx = mmToPxAtDpi(pageDims.width, PNG_EXPORT_DPI);

  // If content is taller than available space, it will be scaled down.
  // To fill the page after scaling, we need a wider content.
  // Formula: optimalWidth = contentHeight * (availableWidth / availableHeight)
  let optimalFitToWidth = baseWidthPx;
  if (contentHeightPx > availableHeightPx) {
    const pageAspectRatio = availableWidthPx / availableHeightPx;
    optimalFitToWidth = Math.max(
      baseWidthPx,
      Math.round(contentHeightPx * pageAspectRatio)
    );
  }

  return optimalFitToWidth;
}
