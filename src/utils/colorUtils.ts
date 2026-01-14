/**
 * Color utilities for calculating text contrast
 * Uses WCAG 2.1 relative luminance algorithm for accessibility-compliant contrast
 */

/**
 * Default fallback color (teal - app brand color)
 */
const DEFAULT_COLOR = '#14b8a6';

/**
 * Text colors for contrast
 * Using darker text (#1e293b = slate-800) for better readability
 */
const LIGHT_TEXT = '#ffffff';
const DARK_TEXT = '#1e293b'; // slate-800 - darker than previous #495057

/**
 * Converts a hex color string to RGB values
 * Handles both 3-digit (#RGB) and 6-digit (#RRGGBB) formats, with or without #
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Handle undefined/null/empty by using default
  const safeHex = hex || DEFAULT_COLOR;

  // Remove leading # if present
  let cleanHex = safeHex.startsWith('#') ? safeHex.slice(1) : safeHex;

  // Expand 3-digit hex to 6-digit
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Converts an sRGB channel value (0-255) to linear RGB
 * Applies gamma correction as per WCAG 2.1 specification
 */
function sRGBtoLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * Calculates relative luminance as per WCAG 2.1
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G, B are linearized sRGB values
 *
 * @returns luminance value from 0 (black) to 1 (white)
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);

  const rLinear = sRGBtoLinear(r);
  const gLinear = sRGBtoLinear(g);
  const bLinear = sRGBtoLinear(b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculates contrast ratio between two colors as per WCAG 2.1
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 > L2
 *
 * @returns contrast ratio from 1:1 (no contrast) to 21:1 (max contrast)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determines if a color is perceptually "light" enough to need dark text
 * Uses WCAG luminance with a threshold optimized for task bar readability
 *
 * A luminance > 0.179 means white text won't have enough contrast (< 4.5:1)
 * so we need dark text instead
 */
export function isLightColor(hex: string): boolean {
  const luminance = getRelativeLuminance(hex);
  // Threshold: if luminance > 0.179, white text contrast < 4.5:1
  // Using slightly lower threshold (0.18) to be more conservative
  return luminance > 0.18;
}

/**
 * Minimum contrast ratio for white text to be acceptable.
 * We use a lower threshold (2.0) to prefer white text on most colored backgrounds,
 * since white text is more readable on saturated colors even at lower contrast ratios.
 * Dark text is only used on very light backgrounds (yellow, white, light gray).
 */
const WHITE_TEXT_MIN_CONTRAST = 2.0;

/**
 * Returns the appropriate text color (light or dark) for optimal contrast
 * against the given background color.
 *
 * Uses WCAG 2.1 contrast ratio with a preference for white text on
 * saturated/medium colors (where white is more visually readable even
 * if dark text has slightly higher mathematical contrast).
 *
 * @param backgroundColor - Background color as hex string
 * @param lightText - Color to use on dark backgrounds (default: white)
 * @param darkText - Color to use on light backgrounds (default: slate-800)
 * @returns The text color that provides best contrast
 */
export function getContrastTextColor(
  backgroundColor: string,
  lightText: string = LIGHT_TEXT,
  darkText: string = DARK_TEXT
): string {
  // Calculate contrast ratio for white text
  const lightContrast = getContrastRatio(backgroundColor, lightText);

  // Prefer white text if it has acceptable contrast (≥ 3:1)
  // This works better on saturated colors where white is more readable
  // than dark text even if dark has slightly higher mathematical contrast
  if (lightContrast >= WHITE_TEXT_MIN_CONTRAST) {
    return lightText;
  }

  // Otherwise use dark text (for very light backgrounds like yellow, white, etc.)
  return darkText;
}

// Legacy export for backwards compatibility (HSP-based)
export function getPerceivedBrightness(hex: string): number {
  // Convert WCAG luminance (0-1) to brightness scale (0-255) for compatibility
  return getRelativeLuminance(hex) * 255;
}
