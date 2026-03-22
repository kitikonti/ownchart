/**
 * Canonical color scale definitions for the OwnChart design system.
 *
 * This file is the SINGLE SOURCE OF TRUTH for color palettes.
 * Consumed by both:
 *   - design-tokens.ts  (runtime access for SVG/canvas/dynamic JS)
 *   - tailwind.config.js (utility class generation)
 *
 * Plain JS (not TS) so that tailwind.config.js can import it
 * directly in the Node.js/PostCSS context without a TS loader.
 */

/**
 * Unified gray scale — Tailwind Slate (blue-gray tint).
 *
 * Chosen to harmonize with our blue brand accent (#0F6CBD).
 * Replaces the former pure-gray neutral, coolGray, slate, and
 * TABLE_HEADER gray families (see Issue #56).
 *
 * Standard Tailwind Slate stops (50–950) are used as-is.
 * Custom intermediate stops bridge luminance gaps:
 *   250 — HiDPI grid line compensation (midpoint 200↔300, Issue #64)
 *   325 — high contrast mode grid lines (midpoint 300↔350)
 *   350 — intermediate stop (midpoint 300↔375, currently a scale entry only)
 *   375 — form/select borders, disabled text (contrast-matched to former neutral[300])
 *   450 — muted icons/indicators (luminance-matched to former neutral[400])
 */
export const slate = Object.freeze({
  0: '#ffffff',
  50: '#f8fafc',     // Tailwind slate-50
  100: '#f1f5f9',    // Tailwind slate-100
  200: '#e2e8f0',    // Tailwind slate-200
  250: '#d6dee8',    // Custom: HiDPI grid line compensation (midpoint 200↔300)
  300: '#cbd5e1',    // Tailwind slate-300
  325: '#c3cdd9',    // Custom: midpoint 300↔350 for high contrast mode grid lines
  350: '#bbc5d1',    // Custom: midpoint 300↔375
  375: '#abb4c0',    // Custom: contrast-matched to former neutral[300] for form borders
  400: '#94a3b8',    // Tailwind slate-400
  450: '#7f8b9b',    // Custom: luminance-matched to former neutral[400] for indicators
  500: '#64748b',    // Tailwind slate-500
  600: '#475569',    // Tailwind slate-600
  700: '#334155',    // Tailwind slate-700
  800: '#1e293b',    // Tailwind slate-800
  900: '#0f172a',    // Tailwind slate-900
  950: '#020617',    // Tailwind slate-950
});

/**
 * Brand blue scale (#0F6CBD).
 *
 * NOTE: Scale is NOT linear lightness.
 * brand[500] is DARKER than brand[600].
 * Primary brand color = brand[600].
 */
export const brand = Object.freeze({
  50: '#EBF3FC',
  100: '#CFE4FA',
  200: '#B4D6FA',
  300: '#62ABF5',
  400: '#2B88D8',
  500: '#115EA3',
  600: '#0F6CBD',
  700: '#0F548C',
  800: '#0C3B5E',
  900: '#0A2E4A',
});

/** Semantic colors — status indicators only, not for UI chrome. */
export const semantic = Object.freeze({
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7',
});

/** Surface colors — background layers (derived from slate scale). */
export const surface = Object.freeze({
  DEFAULT: '#ffffff',
  raised: '#f8fafc',   // slate[50]
  sunken: '#e2e8f0',   // slate[200]
});
