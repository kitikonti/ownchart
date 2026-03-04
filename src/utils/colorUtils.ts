/**
 * Color utilities for calculating text contrast, HSL manipulation, and palette
 * generation.
 *
 * WCAG 2.1 relative luminance algorithm:
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *
 * For general-purpose string hashing (e.g. mapping task IDs to palette
 * indices), see {@link ../utils/hashUtils}.
 */

import { COLORS, SLATE_800 } from "../styles/design-tokens";

/**
 * Default fallback color (brand primary — matches COLORS.brand[600] in design-tokens.ts)
 */
const DEFAULT_COLOR = COLORS.brand[600];

/**
 * Text colors used for contrast selection.
 *
 * LIGHT_TEXT: pure white, from the neutral scale (neutral[0]).
 * DARK_TEXT: slate[800] — imported as SLATE_800 from design-tokens.ts.
 */
const LIGHT_TEXT = COLORS.neutral[0]; // "#ffffff"
const DARK_TEXT = SLATE_800; // "#1e293b" — slate[800]

// ─────────────────────────────────────────────────────────────────────────────
// WCAG 2.1 sRGB linearization coefficients
// Source: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
// ─────────────────────────────────────────────────────────────────────────────

/** sRGB threshold below which the linear approximation applies */
const SRGB_LINEARIZATION_THRESHOLD = 0.03928;
/** Linear-range divisor for sub-threshold channels */
const SRGB_LINEAR_DIVISOR = 12.92;
/** Gamma correction additive bias */
const SRGB_GAMMA_BIAS = 0.055;
/** Gamma correction divisor (scale factor before exponentiation) */
const SRGB_GAMMA_DIVISOR = 1.055;
/** Gamma correction exponent */
const SRGB_GAMMA_EXPONENT = 2.4;

// ─────────────────────────────────────────────────────────────────────────────
// WCAG 2.1 relative luminance coefficients (CIE Y)
// Weights reflect human perceptual sensitivity to each color channel.
// ─────────────────────────────────────────────────────────────────────────────

const LUMINANCE_R = 0.2126;
const LUMINANCE_G = 0.7152;
const LUMINANCE_B = 0.0722;

// ─────────────────────────────────────────────────────────────────────────────
// WCAG 2.1 contrast ratio constant
// ─────────────────────────────────────────────────────────────────────────────

/** Luminance offset in WCAG 2.1 contrast ratio formula — prevents division-by-zero for pure black */
const WCAG_CONTRAST_OFFSET = 0.05;

/**
 * Converts a hex color string to RGB values.
 *
 * Supported formats (with or without leading `#`):
 * - 3-digit shorthand:  #RGB  → expands each digit (e.g. #F0A → #FF00AA)
 * - 6-digit standard:   #RRGGBB
 * - 8-digit with alpha: #RRGGBBAA — alpha channel is silently ignored
 *
 * Not supported: 4-digit CSS shorthand (#RGBA). The blue channel would parse
 * as NaN, causing a fallback to DEFAULT_COLOR.
 *
 * Falls back to DEFAULT_COLOR for empty strings and for strings that produce
 * invalid (NaN) channel values (e.g. "#ZZZZZZ"). The return value always
 * contains valid 0–255 channel integers.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Defensive fallback for empty strings (runtime safety net)
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

  // Guard against invalid hex strings — fall back to default rather than
  // propagating NaN through WCAG luminance calculations.
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return hexToRgb(DEFAULT_COLOR);
  }

  return { r, g, b };
}

/**
 * Converts an sRGB channel value (0-255) to linear RGB
 * Applies gamma correction as per WCAG 2.1 specification
 */
function sRGBtoLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= SRGB_LINEARIZATION_THRESHOLD
    ? normalized / SRGB_LINEAR_DIVISOR
    : Math.pow(
        (normalized + SRGB_GAMMA_BIAS) / SRGB_GAMMA_DIVISOR,
        SRGB_GAMMA_EXPONENT
      );
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

  return LUMINANCE_R * rLinear + LUMINANCE_G * gLinear + LUMINANCE_B * bLinear;
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

  return (lighter + WCAG_CONTRAST_OFFSET) / (darker + WCAG_CONTRAST_OFFSET);
}

/**
 * Minimum contrast ratio for white text to be acceptable.
 *
 * Intentionally below WCAG AA (4.5:1) and WCAG AA Large Text (3:1).
 * This is a deliberate UX trade-off: white text is more visually readable on
 * saturated colors (blues, greens, oranges) even at lower mathematical contrast.
 * Dark text is reserved for near-white/near-yellow backgrounds only.
 *
 * Design decision: accepted in code review 2026-03-03.
 * To achieve WCAG AA compliance for all task labels, raise this value to 4.5.
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
  // Prefer white text if it has acceptable contrast (≥ WHITE_TEXT_MIN_CONTRAST).
  // Intentional UX trade-off: white reads better on saturated colors even when dark text
  // has slightly higher mathematical contrast. Dark text is only used on near-white
  // backgrounds (yellow, white, light gray).
  if (getContrastRatio(backgroundColor, lightText) >= WHITE_TEXT_MIN_CONTRAST) {
    return lightText;
  }

  return darkText;
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
      // No default: max ∈ {rNorm, gNorm, bNorm} by construction — all cases covered
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HSL piecewise thresholds — CSS Color Module 4, §10.2
// @see https://www.w3.org/TR/css-color-4/#hsl-to-rgb
// ─────────────────────────────────────────────────────────────────────────────

/** One sixth of the hue circle (0–1 range) — first segment boundary */
const HUE_ONE_SIXTH = 1 / 6;
/** One third of the hue circle — offset applied to R/B channels in hslToHex */
const HUE_ONE_THIRD = 1 / 3;
/** Midpoint of the hue circle — second segment boundary */
const HUE_ONE_HALF = 1 / 2;
/** Two thirds of the hue circle — third segment boundary */
const HUE_TWO_THIRDS = 2 / 3;
/** Number of hue segments — reciprocal of HUE_ONE_SIXTH, used as multiplier */
const HUE_SEGMENTS = 6;

/**
 * Maps a hue fraction to an RGB channel value (0–1).
 * Wraps t into [0, 1] before applying the standard HSL piecewise formula.
 * Per the CSS Color Module 4 specification.
 * @see https://www.w3.org/TR/css-color-4/#hsl-to-rgb
 */
function hueToRgb(p: number, q: number, t: number): number {
  const tw = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
  if (tw < HUE_ONE_SIXTH) return p + (q - p) * HUE_SEGMENTS * tw;
  if (tw < HUE_ONE_HALF) return q;
  if (tw < HUE_TWO_THIRDS)
    return p + (q - p) * (HUE_TWO_THIRDS - tw) * HUE_SEGMENTS;
  return p;
}

/**
 * Formats a linear RGB channel value (0–1) as a zero-padded two-character hex string.
 */
function linearChannelToHex(x: number): string {
  return Math.round(x * 255)
    .toString(16)
    .padStart(2, "0");
}

/**
 * Converts HSL to hex color.
 * Out-of-range inputs are normalised before conversion:
 * - h is wrapped modulo 360 (supports negative hues and values > 360)
 * - s and l are clamped to [0, 100]
 */
export function hslToHex(hsl: HSL): string {
  const h = (((hsl.h % 360) + 360) % 360) / 360;
  const s = Math.min(100, Math.max(0, hsl.s)) / 100;
  const l = Math.min(100, Math.max(0, hsl.l)) / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hueToRgb(p, q, h + HUE_ONE_THIRD);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - HUE_ONE_THIRD);
  }

  return `#${linearChannelToHex(r)}${linearChannelToHex(g)}${linearChannelToHex(b)}`.toUpperCase();
}

/**
 * Adjusts the lightness of a color by a signed delta.
 * @param hex - Hex color string
 * @param delta - Lightness change in percentage points (positive = lighter, negative = darker)
 */
function adjustLightness(hex: string, delta: number): string {
  const hsl = hexToHSL(hex);
  return hslToHex({ ...hsl, l: Math.min(100, Math.max(0, hsl.l + delta)) });
}

/**
 * Lightens a color by a percentage
 * @param hex - Hex color string
 * @param amount - Amount to lighten (0-1, e.g., 0.15 = 15%)
 */
export function lightenColor(hex: string, amount: number): string {
  return adjustLightness(hex, amount * 100);
}

/**
 * Darkens a color by a percentage
 * @param hex - Hex color string
 * @param amount - Amount to darken (0-1, e.g., 0.15 = 15%)
 */
export function darkenColor(hex: string, amount: number): string {
  return adjustLightness(hex, -amount * 100);
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
 * Expands a palette to match a target count using lightness variations.
 * Returns an empty array when baseColors is empty or targetCount is zero.
 * Based on Matt Ström's color formulas and Lyft ColorBox algorithm.
 * @see https://matthewstrom.com/writing/generating-color-palettes/
 * @see https://github.com/lyft/coloralgorithm
 */
export function expandPalette(
  baseColors: string[],
  targetCount: number
): string[] {
  if (baseColors.length === 0 || targetCount <= 0) {
    return [];
  }

  if (targetCount <= baseColors.length) {
    return baseColors.slice(0, targetCount);
  }

  const stepsPerColor = Math.ceil(targetCount / baseColors.length);
  const expanded: string[] = [];

  for (const baseHex of baseColors) {
    if (expanded.length >= targetCount) break;

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

      if (expanded.length >= targetCount) break;
    }
  }

  return expanded;
}
