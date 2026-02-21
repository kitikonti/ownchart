/**
 * Design Tokens - Single Source of Truth for OwnChart Design System
 *
 * Based on MS 365/Fluent UI design principles:
 * - Outlook Blue (#0F6CBD) as the single brand color
 * - WCAG AA compliant contrast ratios
 *
 * Color systems:
 * - COLORS.neutral: Pure grays (no blue tint) — used for Ribbon, toolbars, UI chrome
 * - COLORS.brand: Outlook Blue scale — mapped from Fluent theme slots (see note below)
 * - Section tokens (GRID, TIMELINE_HEADER, etc.): Cool grays with slight blue tint —
 *   used for chart/grid areas for visual softness, sourced from Bootstrap/Tailwind palettes
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

  // Brand (Outlook Blue - derived from MS Fluent themePrimary #0F6CBD)
  // NOTE: Scale follows Fluent theme slot mapping, NOT linear lightness.
  // Specifically, 500 (themeDarkAlt) is darker than 600 (themePrimary).
  // Primary brand color = brand[600].
  brand: {
    50: "#EBF3FC", // themeLighterAlt - light backgrounds
    100: "#CFE4FA", // themeLighter - focus rings
    200: "#B4D6FA", // themeLight - disabled states
    300: "#62ABF5", // themeTertiary - light accents
    400: "#2B88D8", // themeSecondary - icons, highlights
    500: "#115EA3", // themeDarkAlt - hover states
    600: "#0F6CBD", // themePrimary - primary buttons
    700: "#0F548C", // themeDark - links/text
    800: "#0C3B5E", // themeDarker - pressed states
    900: "#0A2E4A", // darker - dark emphasis
  },

  // Semantic (NOT for UI, only for status indicators)
  semantic: {
    success: "#059669", // Green for success messages
    warning: "#d97706", // Orange for warnings
    error: "#dc2626", // Red for errors
    info: "#0284c7", // Blue for info (rarely used)
  },

  // Chart-specific colors (using Outlook blue palette)
  chart: {
    selection: "#2B88D8", // brand-400 for drag preview/selection
    text: "#495057", // Text in SVG
    dependencyDefault: "#94a3b8",
    dependencySelected: "#334155",
    todayMarker: "#0F6CBD", // brand-600 for today marker
    todayHighlight: "#EBF3FC", // brand-50 for today header cell background
    taskDefault: "#0F6CBD", // brand-600 for new tasks
    marquee: "#334155", // Marquee selection rectangle
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
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
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
  contextMenu: "0 0 2px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.14)",
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
// CONTEXT MENU TOKENS
// =============================================================================

export const CONTEXT_MENU = {
  iconSize: 20,
  iconWeight: "light" as const,
} as const;

// =============================================================================
// TABLE HEADER TOKENS
// =============================================================================

export const TABLE_HEADER = {
  bg: "#F3F3F3",
  bgHover: "#E8E8E8",
  border: "#E1E1E1",
  triangle: "#A6A6A6",
} as const;

// =============================================================================
// GRID TOKENS (timeline background)
// =============================================================================

export const GRID = {
  weekendBg: "#f1f3f5",
  holidayBg: "#fce7f3",
  lineDaily: "#e9ecef",
  lineWeeklyMonthly: "#d1d5db",
  lineDailyWeekend: "#dee2e6",
  lineHorizontal: "#e9ecef",
} as const;

// =============================================================================
// TIMELINE HEADER TOKENS
// =============================================================================

export const TIMELINE_HEADER = {
  bg: "#f8f9fa",
  border: "#dee2e6",
} as const;

// =============================================================================
// CONNECTION HANDLE TOKENS (dependency + progress handles)
// =============================================================================

export const CONNECTION_HANDLE = {
  neutralFill: "#e2e8f0",
  neutralStroke: "#94a3b8",
  validFill: "#bbf7d0",
  validStroke: "#22c55e",
  invalidFill: "#fecaca",
  invalidStroke: "#ef4444",
} as const;

// =============================================================================
// ROW NUMBER TOKENS
// =============================================================================

export const ROW_NUMBER = {
  bgInactive: "#F3F3F3",
  bgHover: "#E8E8E8",
  textInactive: "#5F6368",
  textSelected: "#FFFFFF",
  border: "#E1E1E1",
  hiddenIndicator: "#9ca3af",
} as const;

// =============================================================================
// TOAST TOKENS
// =============================================================================

export const TOAST = {
  bg: "#1e293b",
  text: "#f8fafc",
} as const;
