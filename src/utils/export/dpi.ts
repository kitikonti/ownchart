/**
 * DPI constants and conversion utilities for export.
 * Shared across all export formats (PNG, PDF, SVG).
 */

// =============================================================================
// DPI Constants
// =============================================================================

/** Internal DPI for calculations (CSS/browser standard) */
export const INTERNAL_DPI = 96;

/** Minimum DPI for PNG export (good print quality) */
export const PNG_EXPORT_DPI = 150;

/** Millimeters per inch */
export const MM_PER_INCH = 25.4;

// =============================================================================
// Conversion Utilities
// =============================================================================

/**
 * Convert millimeters to pixels at a specific DPI.
 */
export function mmToPxAtDpi(mm: number, dpi: number): number {
  return (mm / MM_PER_INCH) * dpi;
}

/**
 * Convert pixels to millimeters at a specific DPI.
 */
export function pxToMmAtDpi(px: number, dpi: number): number {
  return (px / dpi) * MM_PER_INCH;
}

/**
 * Calculate pixel dimensions for a page size at a given DPI.
 * @param widthMm - Page width in millimeters
 * @param heightMm - Page height in millimeters
 * @param dpi - Target DPI (e.g., 150 for print quality)
 * @returns Pixel dimensions (rounded to integers)
 */
export function calculatePixelDimensions(
  widthMm: number,
  heightMm: number,
  dpi: number = PNG_EXPORT_DPI
): { width: number; height: number } {
  return {
    width: Math.round(mmToPxAtDpi(widthMm, dpi)),
    height: Math.round(mmToPxAtDpi(heightMm, dpi)),
  };
}

/**
 * Format DPI info string for display.
 * @param widthPx - Width in pixels
 * @param heightPx - Height in pixels
 * @param dpi - DPI value
 */
export function formatDpiDescription(
  widthPx: number,
  heightPx: number,
  dpi: number
): string {
  return `${widthPx} × ${heightPx} px (${dpi} DPI)`;
}
