/**
 * Color utilities for calculating text contrast
 * Uses WCAG 2.1 relative luminance algorithm for accessibility-compliant contrast
 */

import { COLORS } from "../styles/design-tokens";

/**
 * Default fallback color (brand primary — matches COLORS.brand[600] in design-tokens.ts)
 */
const DEFAULT_COLOR = COLORS.brand[600];

/**
 * Text colors for contrast.
 * DARK_TEXT matches slate[800] from the design system — update if the slate scale changes.
 */
const LIGHT_TEXT = "#ffffff";
const DARK_TEXT = "#1e293b"; // slate[800] from design system

/**
 * Converts a hex color string to RGB values
 * Handles both 3-digit (#RGB) and 6-digit (#RRGGBB) formats, with or without #
 *
 * NOTE: Only null/undefined/empty strings are guarded — invalid hex strings (e.g. "#ZZZZZZ")
 * produce NaN channels that propagate silently. Callers should pass valid hex strings.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Handle undefined/null/empty by using default
  const safeHex = hex || DEFAULT_COLOR;

  // Remove leading # if present
  let cleanHex = safeHex.startsWith("#") ? safeHex.slice(1) : safeHex;

  // Expand 3-digit hex to 6-digit
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
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
 * Minimum contrast ratio for white text to be acceptable.
 * Intentionally below WCAG AA (4.5:1) and WCAG AA Large Text (3:1) — this is a
 * deliberate UX trade-off: white text is more readable on saturated colors even at
 * lower mathematical contrast ratios. Dark text is only used on near-white backgrounds.
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

  // Prefer white text if it has acceptable contrast (≥ 2:1, per WHITE_TEXT_MIN_CONTRAST).
  // Intentional UX trade-off: white reads better on saturated colors even when dark text
  // has slightly higher mathematical contrast. Dark text is only used on near-white
  // backgrounds (yellow, white, light gray).
  if (lightContrast >= WHITE_TEXT_MIN_CONTRAST) {
    return lightText;
  }

  return darkText;
}

// ═══════════════════════════════════════════════════════════════════════════
// STABLE HASH (for deterministic color assignment)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DJB2 hash function for deterministic, stable color assignment.
 * Produces a positive integer from a string (e.g., task ID).
 */
export function stableHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

// ═══════════════════════════════════════════════════════════════════════════
// HSL COLOR UTILITIES (Smart Color Management)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * HSL color representation
 */
export interface HSL {
  h: number; // Hue: 0-360
  s: number; // Saturation: 0-100
  l: number; // Lightness: 0-100
}

/**
 * Converts a hex color to HSL
 */
export function hexToHSL(hex: string): HSL {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL to hex color
 */
export function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number): string => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Lightens a color by a percentage
 * @param hex - Hex color string
 * @param amount - Amount to lighten (0-1, e.g., 0.15 = 15%)
 */
export function lightenColor(hex: string, amount: number): string {
  const hsl = hexToHSL(hex);
  hsl.l = Math.min(100, hsl.l + amount * 100);
  return hslToHex(hsl);
}

/**
 * Darkens a color by a percentage
 * @param hex - Hex color string
 * @param amount - Amount to darken (0-1, e.g., 0.15 = 15%)
 */
export function darkenColor(hex: string, amount: number): string {
  const hsl = hexToHSL(hex);
  hsl.l = Math.max(0, hsl.l - amount * 100);
  return hslToHex(hsl);
}

/** Lightness steps (dark → light) for the 10-swatch monochrome palette */
const MONOCHROME_LIGHTNESS_STEPS = [15, 22, 30, 37, 44, 52, 59, 66, 73, 80];

/**
 * Generates a monochrome palette from a base color (10 shades: dark → light)
 * @param baseColor - Hex color string
 */
export function generateMonochromePalette(baseColor: string): string[] {
  const hsl = hexToHSL(baseColor);
  return MONOCHROME_LIGHTNESS_STEPS.map((l) =>
    hslToHex({ h: hsl.h, s: hsl.s, l })
  );
}

/** Lightness floor/ceiling (%) for expanded palette shades */
const PALETTE_LIGHTNESS_MIN = 25;
const PALETTE_LIGHTNESS_MAX = 75;
/** Saturation modulation depth for palette expansion (0 = none, 1 = full parabola) */
const PALETTE_SATURATION_VARIATION = 0.3;
/** Max hue rotation for the Bezold-Brücke perceptual shift (degrees) */
const BEZOLD_BRUCKE_SHIFT_DEGREES = 6;

/**
 * Expands a palette to match a target count using lightness variations
 * Based on Matt Ström's color formulas and Lyft ColorBox algorithm
 * @see https://matthewstrom.com/writing/generating-color-palettes/
 * @see https://github.com/lyft/coloralgorithm
 */
export function expandPalette(
  baseColors: string[],
  targetCount: number
): string[] {
  if (targetCount <= baseColors.length) {
    return baseColors.slice(0, targetCount);
  }

  const stepsPerColor = Math.ceil(targetCount / baseColors.length);
  const expanded: string[] = [];

  for (const baseHex of baseColors) {
    const hsl = hexToHSL(baseHex);

    for (let i = 0; i < stepsPerColor; i++) {
      const t = stepsPerColor > 1 ? i / (stepsPerColor - 1) : 0.5; // 0 → 1

      // Easing for more natural transitions (easeOutQuad)
      const eased = 1 - Math.pow(1 - t, 2);

      // Lightness: dark → light
      const lightness =
        PALETTE_LIGHTNESS_MIN +
        eased * (PALETTE_LIGHTNESS_MAX - PALETTE_LIGHTNESS_MIN);

      // Saturation: parabola (maximum in middle, formula: -4n² + 4n)
      const satMod = 1 - Math.pow(2 * t - 1, 2) * PALETTE_SATURATION_VARIATION;
      const saturation = Math.min(100, hsl.s * satMod);

      // Hue-Shift (Bezold-Brücke effect)
      const hueShift = (0.5 - t) * BEZOLD_BRUCKE_SHIFT_DEGREES;
      const hue = (hsl.h + hueShift + 360) % 360;

      expanded.push(hslToHex({ h: hue, s: saturation, l: lightness }));
    }

    if (expanded.length >= targetCount) break;
  }

  return expanded.slice(0, targetCount);
}
