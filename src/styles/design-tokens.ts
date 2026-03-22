/**
 * Design Tokens - Single Source of Truth for OwnChart Design System
 *
 * - Brand blue (#0F6CBD) as the single brand color
 * - WCAG AA compliant contrast ratios
 *
 * Gray system: Unified Tailwind Slate (blue-gray tint) scale.
 * All UI areas — chrome, chart grid, overlays, headers — share a single
 * slate family defined in colors.js. See Issue #56 for rationale.
 *
 * - COLORS.slate: Tailwind Slate gray scale — used everywhere
 * - COLORS.brand: Brand blue scale — primary interactive color
 */

// =============================================================================
// COLORS
// =============================================================================

// Canonical color scales imported from the single source of truth.
// See colors.js for the full palette definitions.
import { slate, brand, semantic } from "./colors.js";

/**
 * Contrast-safe dark text color (slate[800]).
 * Used in WCAG contrast calculations and export table text rendering.
 */
export const DARK_TEXT_COLOR = slate[800];

/**
 * Default color applied to newly created tasks.
 * Exported as a standalone constant so non-UI modules (e.g. clipboard utilities)
 * can reference it without importing the full COLORS object.
 */
export const DEFAULT_TASK_COLOR = brand[600];

/**
 * Default milestone accent colour (Tailwind yellow-600 / gold).
 * Used in color mode defaults and milestone rendering.
 */
export const DEFAULT_MILESTONE_COLOR = "#CA8A04";

/**
 * Convert a hex color to an rgba() string.
 * Keeps color references tied to the scale instead of hardcoding RGB components.
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const COLORS = {
  slate,
  brand,

  // Semantic (NOT for UI, only for status indicators)
  semantic,

  // Chart-specific colors (referencing brand + slate scales)
  chart: {
    selection: brand[400], // drag preview/selection
    text: slate[600], // Text in SVG
    dependencyDefault: slate[400],
    dependencyHover: slate[500], // between default and selected
    dependencySelected: slate[700],
    todayMarker: brand[600], // today marker
    todayHighlight: brand[50], // today header cell background
    taskDefault: DEFAULT_TASK_COLOR, // new tasks
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
// BORDER RADIUS
// =============================================================================

export const RADIUS = {
  none: "0px",
  sm: "2px", // flat style
  md: "4px", // Buttons, inputs
  lg: "8px", // Cards, dialogs
  xl: "12px", // Modals
  full: "9999px", // Pills, avatars
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

// Elevation shadow system
export const SHADOWS = {
  none: "none",
  rest: "0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)",
  hover: "0 0 2px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.14)",
  pressed: "0 0 2px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)",
  dropdown: "0 0 8px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.14)",
  contextMenu: "0 0 2px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.14)",
  // Dialog shadow
  modal: "0 0 8px rgba(0,0,0,0.12), 0 32px 64px rgba(0,0,0,0.14)",
  // Focus ring (for accessibility)
  focus: `0 0 0 2px ${brand[100]}`,
  // Toast notification shadow (Tailwind-style elevation)
  toast:
    "0 10px 15px -3px rgba(15, 23, 42, 0.15), 0 4px 6px -2px rgba(15, 23, 42, 0.08)",
} as const;

// =============================================================================
// Z-INDEX (stacking order)
// =============================================================================

export const Z_INDEX = {
  rowHighlight: 5,
  cellActive: 10,
  cellEditing: 20,
  rowIndicator: 25,
  hiddenRow: 40,
  hiddenRowHover: 42,
  rowControls: 45,
  insertLine: 60,
  stickyHeader: 100,
  dropdown: 1000,
  /** Context menus (right-click menus) — same layer as dropdowns */
  contextMenu: 1000,
  /** Modal dialogs — must sit above context menus and dropdowns */
  modal: 1100,
  /** Mobile block overlay — must sit above the export dialog and all other overlays */
  mobileBlock: 2000,
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
// TOOLBAR TOKENS
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

  // Sub-pixel border width for trigger buttons — intentionally differs from
  // a standard 1px border for visual fidelity.
  triggerBorderWidth: "0.667px",
} as const;

// =============================================================================
// CONTEXT MENU TOKENS
// =============================================================================

export const CONTEXT_MENU = {
  iconSize: 20,
  iconWeight: "light" as const,
  minWidth: 180,
} as const;

// =============================================================================
// TABLE HEADER TOKENS
// =============================================================================

export const TABLE_HEADER = {
  bg: slate[50],
  bgHover: slate[100],
  border: slate[200],
  triangle: slate[400],
} as const;

// =============================================================================
// GRID TOKENS (timeline background)
// =============================================================================

export const GRID = {
  weekendBg: slate[100],
  weekendOpacity: 0.6,
  holidayBg: "#fce7f3", // Tailwind pink-100
  holidayOpacity: 0.7,
  lineDaily: slate[200],
  lineWeeklyMonthly: slate[300],
  lineDailyWeekend: slate[200],
  lineHorizontal: slate[200],
} as const;

// =============================================================================
// TIMELINE HEADER TOKENS
// =============================================================================

export const TIMELINE_HEADER = {
  bg: slate[50],
  border: slate[200],
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
// CELL TOKENS (task table cell styling)
// =============================================================================

export const CELL = {
  /** Brand color for active cell outline */
  activeBorderColor: brand[600],
  /** Full box-shadow for active/editing cell */
  activeBorderShadow: `inset 0 0 0 2px ${brand[600]}`,
} as const;

// =============================================================================
// PLACEHOLDER CELL TOKENS (new task placeholder row)
// =============================================================================

export const PLACEHOLDER_CELL = {
  bgDefault: slate[50], // Subtle background for idle state
  bgSelected: slate[100], // Selected state
  bgActive: slate[100], // Active (focused) state
  bgEditing: slate[0], // Editing state (white)
} as const;

// =============================================================================
// ROW NUMBER TOKENS
// =============================================================================

export const ROW_NUMBER = {
  bgInactive: TABLE_HEADER.bg,
  bgHover: TABLE_HEADER.bgHover,
  textInactive: slate[500], // Secondary text
  textSelected: slate[0],
  border: TABLE_HEADER.border,
  hiddenIndicator: slate[450], // Subtle indicator lines
  controlBg: slate[0], // Insert-circle & cursor background
} as const;

// =============================================================================
// TABLE ROW TOKENS
// =============================================================================

export const TABLE_ROW = {
  /** Default (unselected) row background — white. */
  defaultBg: slate[0],
  /** Selected row background: brand[600] at chart.selectionFillOpacity (8%). */
  selectionBg: hexToRgba(brand[600], COLORS.chart.selectionFillOpacity),
} as const;

// =============================================================================
// TOAST TOKENS
// =============================================================================

export const TOAST = {
  bg: slate[800],
  text: slate[100],
  borderRadius: "8px",
  fontSize: "14px",
  padding: "12px 16px",
  /** Default display duration for toast notifications (ms) */
  durationMs: 3000,
} as const;
