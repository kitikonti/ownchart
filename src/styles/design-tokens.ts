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
 * - TABLE_HEADER / ROW_NUMBER: MS Fluent-derived grays (#F3F3F3 etc.) — neither
 *   cool-tinted nor matching the neutral scale; shared via TABLE_HEADER references
 */

// =============================================================================
// COLORS
// =============================================================================

// Standalone scales — referenced by COLORS.chart to avoid duplicated hex values.

const neutral = {
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
} as const;

// Brand (Outlook Blue - derived from MS Fluent themePrimary #0F6CBD)
// ⚠️  NOTE: Scale follows Fluent theme slot mapping, NOT linear lightness.
// brand[500] (themeDarkAlt) is DARKER than brand[600] (themePrimary).
// Primary brand color = brand[600].
const brand = {
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
} as const;

// Cool gray (Bootstrap/Tailwind cool-gray family — slight blue tint)
// Used for chart/grid areas for visual softness vs. pure neutral UI chrome.
const coolGray = {
  50: "#f8f9fa",
  100: "#f1f3f5",
  200: "#e9ecef",
  250: "#dee2e6",
  400: "#d1d5db",
} as const;

// Slate (Tailwind Slate family — stronger blue-gray tint)
// Used for dependency arrows, connection handles, toasts, and chart overlays.
const slate = {
  100: "#f8fafc",
  200: "#e2e8f0",
  400: "#94a3b8",
  500: "#64748b", // dependency hover (between default and selected)
  700: "#334155",
  800: "#1e293b",
} as const;

export const COLORS = {
  neutral,
  brand,

  // Semantic (NOT for UI, only for status indicators)
  semantic: {
    success: "#059669", // Green for success messages
    warning: "#d97706", // Orange for warnings
    error: "#dc2626", // Red for errors
    info: "#0284c7", // Blue for info (rarely used)
  },

  // Chart-specific colors (referencing brand scale where applicable)
  chart: {
    selection: brand[400], // drag preview/selection
    text: "#495057", // Text in SVG (Bootstrap gray-700)
    dependencyDefault: slate[400],
    dependencyHover: slate[500], // between default and selected
    dependencySelected: slate[700],
    todayMarker: brand[600], // today marker
    todayHighlight: brand[50], // today header cell background
    taskDefault: brand[600], // new tasks
    marquee: slate[700], // Marquee selection rectangle
    /** Fill opacity for selected-row highlight and marquee overlay */
    selectionFillOpacity: 0.08,
    marqueeFillOpacity: 0.1,
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
  letterSpacing: {
    wide: "0.5px",
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
  focus: `0 0 0 2px ${brand[100]}`,
} as const;

// =============================================================================
// Z-INDEX (stacking order)
// =============================================================================

export const Z_INDEX = {
  rowHighlight: 5,
  rowIndicator: 25,
  hiddenRow: 40,
  hiddenRowHover: 42,
  rowControls: 45,
  insertLine: 60,
  stickyHeader: 100,
  dropdown: 1000,
  popover: 10000,
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
  iconSizeMenu: 18, // File menu / dropdown menu items

  // Spacing
  groupGap: 4, // gap between items within a group (px)
  sectionGap: 8, // gap between groups (px)

  // Button dimensions
  buttonHeight: 31,
  buttonMinWidth: 32,

  // Dropdown dimensions
  fileMenuMinWidth: "14rem",
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
  weekendBg: coolGray[100],
  weekendOpacity: 0.6,
  holidayBg: "#fce7f3", // Tailwind pink-100
  holidayOpacity: 0.7,
  lineDaily: coolGray[200],
  lineWeeklyMonthly: coolGray[400],
  lineDailyWeekend: coolGray[250],
  lineHorizontal: coolGray[200],
} as const;

// =============================================================================
// TIMELINE HEADER TOKENS
// =============================================================================

export const TIMELINE_HEADER = {
  bg: coolGray[50],
  border: coolGray[250],
} as const;

// =============================================================================
// CONNECTION HANDLE TOKENS (dependency + progress handles)
// Intentionally brighter/lighter shades than COLORS.semantic (status text).
// =============================================================================

export const CONNECTION_HANDLE = {
  neutralFill: slate[200],
  neutralStroke: slate[400],
  validFill: "#bbf7d0", // Tailwind green-200
  validStroke: "#22c55e", // Tailwind green-500
  invalidFill: "#fecaca", // Tailwind red-200
  invalidStroke: "#ef4444", // Tailwind red-500
} as const;

// =============================================================================
// ROW NUMBER TOKENS
// =============================================================================

export const ROW_NUMBER = {
  bgInactive: TABLE_HEADER.bg,
  bgHover: TABLE_HEADER.bgHover,
  textInactive: neutral[500], // Secondary text
  textSelected: neutral[0],
  border: TABLE_HEADER.border,
  hiddenIndicator: neutral[400], // Subtle indicator lines
  controlBg: neutral[0], // Insert-circle & cursor background
} as const;

// =============================================================================
// TOAST TOKENS
// =============================================================================

export const TOAST = {
  bg: slate[800],
  text: slate[100],
} as const;
