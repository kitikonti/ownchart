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

/** Neutral grays — pure grays, no blue tint. Used for UI chrome. */
export const neutral = Object.freeze({
  0: '#ffffff',
  50: '#f5f5f5',
  100: '#ebebeb',
  200: '#d4d4d4',
  300: '#b3b3b3',
  400: '#8a8a8a',
  500: '#6b6b6b',
  600: '#525252',
  700: '#404040',
  800: '#303030',
  900: '#1a1a1a',
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

/** Surface colors — background layers. */
export const surface = Object.freeze({
  DEFAULT: '#ffffff',
  raised: '#f5f5f5',
  sunken: '#ebebeb',
});
