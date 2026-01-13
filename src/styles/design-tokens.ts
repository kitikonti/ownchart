/**
 * Design Tokens - Single Source of Truth for OwnChart Design System
 *
 * Based on MS 365/Fluent UI design principles:
 * - Neutral gray palette (pure grays, no blue tint)
 * - Cyan (#00CCCC) as the single brand color
 * - WCAG AA compliant contrast ratios
 */

// =============================================================================
// COLORS
// =============================================================================

export const COLORS = {
  // Neutrals (MS Fluent - pure grays, no blue tint)
  neutral: {
    0: "#ffffff",
    50: "#f5f5f5", // Tab bar, subtle bg
    100: "#ebebeb", // Hover states
    200: "#d4d4d4", // Borders, separators
    300: "#b3b3b3", // Disabled text
    400: "#8a8a8a", // Placeholder
    500: "#6b6b6b", // Secondary text
    600: "#525252", // Icons default
    700: "#404040", // Primary text
    800: "#303030", // Headings
    900: "#1a1a1a", // Emphasis
  },

  // Brand (Cyan - SINGLE color for all interactive elements)
  // Dark shades use hue rotation toward blue (180° → 195°) to maintain
  // cyan appearance at low lightness (see: "Don't let lightness kill your saturation")
  brand: {
    50: "#E0FFFF", // Selected backgrounds, very subtle (H=180°)
    100: "#B3FFFF", // Focus rings, light backgrounds (H=180°)
    200: "#80FFFF", // Disabled buttons (light) (H=180°)
    300: "#4DFFFF", // Light accents (H=180°)
    400: "#00CCCC", // BRAND COLOR - Icons, Highlights, Logo (H=180°)
    500: "#00AAB3", // Button Hover (H=183°, +3° blue shift)
    600: "#008A99", // PRIMARY BUTTONS (H=186°, +6° blue shift) WCAG AA ✓
    700: "#006C80", // Links/Text (H=189°, +9° blue shift) WCAG AA ✓
    800: "#005266", // Pressed/Active state (H=192°, +12° blue shift)
    900: "#00394D", // Dark emphasis (H=195°, +15° blue shift)
  },

  // Semantic (NOT for UI, only for status indicators)
  semantic: {
    success: "#059669", // Green for success messages
    warning: "#d97706", // Orange for warnings
    error: "#dc2626", // Red for errors
    info: "#0284c7", // Blue for info (rarely used)
  },

  // Chart-specific colors (preserved from original)
  chart: {
    selection: "#228be6", // Blue for drag preview/selection
    text: "#495057", // Text in SVG
    dependencyDefault: "#94a3b8",
    dependencySelected: "#334155",
    todayMarker: "#fa5252", // Red for today marker
  },
} as const;

// =============================================================================
// SPACING (4px base unit)
// =============================================================================

export const SPACING = {
  0: "0px",
  0.5: "2px", // Micro spacing
  1: "4px", // Tight
  2: "8px", // Standard (base unit)
  3: "12px", // Comfortable
  4: "16px", // Section
  5: "20px",
  6: "24px", // Large
  8: "32px",
  10: "40px",
  12: "48px",
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const TYPOGRAPHY = {
  fontFamily: {
    sans: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', sans-serif",
    mono: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: "11px", // Headers, small labels
    sm: "12px", // Secondary text
    base: "14px", // Body, buttons
    lg: "16px", // Emphasis
    xl: "18px", // Headings
    "2xl": "20px", // Dialog titles
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// =============================================================================
// BORDER RADIUS (MS style - flatter)
// =============================================================================

export const RADIUS = {
  none: "0px",
  sm: "2px", // MS style - very flat
  md: "4px", // Buttons, inputs
  lg: "8px", // Cards, dialogs
  xl: "12px", // Modals
  full: "9999px", // Pills, avatars
} as const;

// =============================================================================
// SHADOWS (Fluent UI style)
// =============================================================================

// MS Fluent UI shadow system
export const SHADOWS = {
  none: "none",
  rest: "0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)",
  hover: "0 0 2px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.14)",
  pressed: "0 0 2px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)",
  dropdown: "0 0 8px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.14)",
  // MS Dialog shadow: extracted from computed styles
  modal: "0 0 8px rgba(0,0,0,0.12), 0 32px 64px rgba(0,0,0,0.14)",
  // Focus ring (for accessibility)
  focus: `0 0 0 2px ${COLORS.brand[100]}`,
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const TRANSITIONS = {
  fast: "100ms cubic-bezier(0.33, 0, 0.67, 1)",
  base: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// =============================================================================
// TOOLBAR TOKENS (MS Ribbon-inspired)
// =============================================================================

export const TOOLBAR = {
  // Icon sizes (Phosphor Icons: 16px grid, optimal at 16/20/24/32)
  iconSize: 20,
  iconSizeSmall: 16,

  // Spacing
  groupGap: 4, // gap between items within a group (px)
  sectionGap: 8, // gap between groups (px)

  // Button dimensions
  buttonHeight: 31,
  buttonMinWidth: 32,
} as const;

// =============================================================================
// DENSITY SYSTEM (unchanged from original)
// =============================================================================

export const DENSITY = {
  compact: {
    rowHeight: 28,
    taskBarHeight: 20,
    cellPaddingY: 4,
    iconSize: 14,
  },
  normal: {
    rowHeight: 36,
    taskBarHeight: 26,
    cellPaddingY: 6,
    iconSize: 16,
  },
  comfortable: {
    rowHeight: 44,
    taskBarHeight: 32,
    cellPaddingY: 8,
    iconSize: 18,
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ColorToken = typeof COLORS;
export type SpacingToken = typeof SPACING;
export type TypographyToken = typeof TYPOGRAPHY;
export type RadiusToken = typeof RADIUS;
export type ShadowToken = typeof SHADOWS;
export type TransitionToken = typeof TRANSITIONS;
export type ToolbarToken = typeof TOOLBAR;
export type DensityToken = typeof DENSITY;
