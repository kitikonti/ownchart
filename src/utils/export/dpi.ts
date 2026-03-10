/**
 * DPI constants and conversion utilities for export.
 * Shared across all export formats (PNG, PDF, SVG).
 */

// =============================================================================
// DPI Constants
// =============================================================================

/** Internal DPI for calculations (CSS/browser standard) */
export const INTERNAL_DPI = 96;

/** DPI used for PNG export and PDF pixel-dimension calculations (print quality). */
export const PNG_EXPORT_DPI = 150;

/** Millimeters per inch */
export const MM_PER_INCH = 25.4;

// =============================================================================
// Conversion Utilities
// =============================================================================

/**
 * Convert millimeters to pixels at a specific DPI.
 * @throws {RangeError} If dpi is not greater than zero.
 */
export function mmToPxAtDpi(mm: number, dpi: number): number {
  if (dpi <= 0) {
    throw new RangeError(`dpi must be greater than 0, got ${dpi}`);
  }
  return (mm / MM_PER_INCH) * dpi;
}

/**
 * Convert pixels to millimeters at a specific DPI.
 * @throws {RangeError} If dpi is not greater than zero.
 */
export function pxToMmAtDpi(px: number, dpi: number): number {
  if (dpi <= 0) {
    throw new RangeError(`dpi must be greater than 0, got ${dpi}`);
  }
  return (px / dpi) * MM_PER_INCH;
}

/**
 * Calculate pixel dimensions for a page size at a given DPI.
 * @param widthMm - Page width in millimeters (must be ≥ 0)
 * @param heightMm - Page height in millimeters (must be ≥ 0)
 * @param dpi - Target DPI (e.g., 150 for print quality)
 * @returns Pixel dimensions (rounded to integers)
 * @throws {RangeError} If dpi is not greater than zero, or if widthMm/heightMm are negative.
 */
export function calculatePixelDimensions(
  widthMm: number,
  heightMm: number,
  dpi: number = PNG_EXPORT_DPI
): { width: number; height: number } {
  if (widthMm < 0) {
    throw new RangeError(`widthMm must be >= 0, got ${widthMm}`);
  }
  if (heightMm < 0) {
    throw new RangeError(`heightMm must be >= 0, got ${heightMm}`);
  }
  return {
    width: Math.round(mmToPxAtDpi(widthMm, dpi)),
    height: Math.round(mmToPxAtDpi(heightMm, dpi)),
  };
}

/**
 * Format DPI info string for display.
 *
 * This is a pure formatting helper — it does **not** validate the inputs.
 * Use {@link mmToPxAtDpi} / {@link pxToMmAtDpi} / {@link calculatePixelDimensions}
 * when conversion accuracy is required (those functions throw on invalid DPI).
 *
 * @param widthPx - Width in pixels
 * @param heightPx - Height in pixels
 * @param dpi - DPI value (display only — no range check performed)
 */
export function formatDpiDescription(
  widthPx: number,
  heightPx: number,
  dpi: number
): string {
  return `${widthPx} × ${heightPx} px (${dpi} DPI)`;
}
