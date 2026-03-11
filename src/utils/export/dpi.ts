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
 * @throws {RangeError} If dpi is not a finite positive number.
 */
export function mmToPxAtDpi(mm: number, dpi: number): number {
  if (!Number.isFinite(dpi) || dpi <= 0) {
    throw new RangeError(`dpi must be a finite positive number, got ${dpi}`);
  }
  return (mm / MM_PER_INCH) * dpi;
}

/**
 * Convert pixels to millimeters at a specific DPI.
 * @throws {RangeError} If dpi is not a finite positive number.
 */
export function pxToMmAtDpi(px: number, dpi: number): number {
  if (!Number.isFinite(dpi) || dpi <= 0) {
    throw new RangeError(`dpi must be a finite positive number, got ${dpi}`);
  }
  return (px / dpi) * MM_PER_INCH;
}

/**
 * Calculate pixel dimensions for a page size at a given DPI.
 * @param widthMm - Page width in millimeters (must be ≥ 0)
 * @param heightMm - Page height in millimeters (must be ≥ 0)
 * @param dpi - Target DPI (e.g., 150 for print quality)
 * @returns Pixel dimensions (rounded to integers)
 * @throws {RangeError} If widthMm is negative (checked first), then if heightMm
 *   is negative (checked second), or finally if dpi is not a finite positive
 *   number (validated inside {@link mmToPxAtDpi}).
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
 * @param widthPx - Width in pixels (caller is responsible for passing a valid positive number)
 * @param heightPx - Height in pixels (caller is responsible for passing a valid positive number)
 * @param dpi - DPI value (display only — no range check performed; pass a valid positive number)
 */
export function formatDpiDescription(
  widthPx: number,
  heightPx: number,
  dpi: number
): string {
  return `${widthPx} × ${heightPx} px (${dpi} DPI)`;
}
