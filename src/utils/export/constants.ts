/**
 * Shared constants for SVG/PDF export rendering.
 * Used by both pdfExport.ts and svgExport.ts.
 */

import { COLORS } from "../../styles/design-tokens";

/** Height of the header row in pixels */
export const HEADER_HEIGHT = 48;

/** Font family for SVG text elements (Inter with system font fallback) */
export const SVG_FONT_FAMILY =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Semantic color tokens for SVG/PDF export task table rendering.
 * Derived from the design-token neutral scale to stay consistent
 * with the Tailwind classes used in the HTML (PNG) export path.
 */
export const EXPORT_COLORS = {
  /** neutral-700 — task names, regular cell text */
  textPrimary: COLORS.neutral[700],
  /** neutral-600 — dates, progress, icons, header labels */
  textSecondary: COLORS.neutral[600],
  /** neutral-500 — summary dates/duration (lighter, italic in app) */
  textSummary: COLORS.neutral[500],
  /** neutral-600 — header labels */
  textHeader: COLORS.neutral[600],
  /** neutral-200 — header borders */
  border: COLORS.neutral[200],
  /** neutral-100 — row borders */
  borderLight: COLORS.neutral[100],
  /** neutral-50 — header background */
  headerBg: COLORS.neutral[50],
} as const;

/**
 * Phosphor icon SVG paths for task types (256x256 viewBox).
 * These are used in task table rendering for SVG/PDF export.
 */
export const TASK_TYPE_ICON_PATHS = {
  /** Diamond icon for milestones */
  milestone:
    "M235.33,116.72,139.28,20.66a16,16,0,0,0-22.56,0l-96,96.06a16,16,0,0,0,0,22.56l96.05,96.06a16,16,0,0,0,22.56,0l96.05-96.06a16,16,0,0,0,0-22.56ZM128,224,32,128,128,32l96,96Z",
  /** Folder icon for summary tasks */
  summary:
    "M216,72H130.67L102.93,51.2a16.12,16.12,0,0,0-9.6-3.2H40A16,16,0,0,0,24,64V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM40,64H93.33l21.34,16H40ZM216,200H40V96H216Z",
  /** CheckSquare icon for regular tasks */
  task: "M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Zm-32.49-101.49-72,72a12,12,0,0,1-17,0l-32-32a12,12,0,0,1,17-17L96,154l63.51-63.52a12,12,0,0,1,17,17Z",
} as const;
