/**
 * PDF Layout utilities.
 * Handles coordinate conversion and printable area calculation.
 */

import type { PdfExportOptions, PdfMargins } from "./types";
import { PDF_PAGE_SIZES, PDF_MARGIN_PRESETS } from "./types";

/** Points per millimeter (72 pt/inch ÷ 25.4 mm/inch) */
export const PT_PER_MM = 72 / 25.4;

/** Points per pixel at 96 DPI */
export const PT_PER_PX = 72 / 96;

/** Millimeters per pixel at 96 DPI */
export const MM_PER_PX = 25.4 / 96;

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
 * Convert millimeters to pixels.
 */
export function mmToPx(mm: number): number {
  return mm / MM_PER_PX;
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
  const pageSize = PDF_PAGE_SIZES[options.pageSize];

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

  let scale: number;

  if (options.scaleMode === "fitToPage") {
    // Calculate scale to fit both width and height
    const scaleX = printable.width / contentWidthMm;
    const scaleY = availableHeight / contentHeightMm;
    scale = Math.min(scaleX, scaleY);
  } else {
    // Custom scale (percentage)
    scale = (options.customScale || 100) / 100;
  }

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
 * Convert hex color to RGB.
 */
export function hexToRgb(hex: string): PdfColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 128, g: 128, b: 128 };
}

/**
 * Convert color to grayscale.
 */
export function toGrayscale(color: PdfColor): PdfColor {
  // Luminosity method: 0.21 R + 0.72 G + 0.07 B
  const gray = Math.round(0.21 * color.r + 0.72 * color.g + 0.07 * color.b);
  return { r: gray, g: gray, b: gray };
}

/**
 * Get color, optionally converting to grayscale.
 */
export function getColor(hex: string, grayscale: boolean): PdfColor {
  const color = hexToRgb(hex);
  return grayscale ? toGrayscale(color) : color;
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
  // Approximate character width (varies by font)
  // For Helvetica, average char width is ~0.5 * fontSize in pt
  const avgCharWidthPt = fontSize * 0.5;
  const avgCharWidthMm = ptToMm(avgCharWidthPt);

  const maxChars = Math.floor(maxWidth / avgCharWidthMm);

  if (text.length <= maxChars) {
    return text;
  }

  // Truncate with ellipsis
  return text.substring(0, maxChars - 3) + "...";
}
