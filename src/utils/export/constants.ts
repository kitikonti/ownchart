/**
 * Shared constants for SVG/PDF export rendering.
 * Used by both pdfExport.ts and svgExport.ts.
 */

import { COLORS } from "../../styles/design-tokens";

/** Height of the header row in pixels */
export const HEADER_HEIGHT = 48;

/**
 * Wait time in ms after root.render() before reading the DOM.
 * React schedules its commit asynchronously; this gives it one macro-task
 * to flush before waitForFonts() / waitForPaint() take over.
 *
 * Intentionally not re-exported from index.ts — this is an internal
 * implementation detail of the export orchestration layer, not a public API.
 */
export const REACT_RENDER_WAIT_MS = 100;

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

// ─── Task table cell rendering constants ──────────────────────────────────────

/** Y offset added to rowHeight/2 for SVG text baseline alignment */
export const TEXT_BASELINE_OFFSET = 4;

/** Fixed width reserved for the expand/collapse arrow in the name column (Tailwind w-4) */
export const ARROW_PLACEHOLDER_WIDTH = 16;

/** Rendered pixel size of the task-type Phosphor icon in the name column */
export const ICON_RENDER_SIZE = 16;

/** Gap between the task-type icon and the task name text (px) */
export const ICON_TEXT_GAP = 4;

/** ViewBox dimension of Phosphor icons (all icons share a 256×256 coordinate space) */
const PHOSPHOR_ICON_VIEWBOX_SIZE = 256;

/** Scale factor to render Phosphor icons at ICON_RENDER_SIZE px (ICON_RENDER_SIZE / PHOSPHOR_ICON_VIEWBOX_SIZE) */
export const ICON_SCALE = ICON_RENDER_SIZE / PHOSPHOR_ICON_VIEWBOX_SIZE;

/** Font size for the expand/collapse arrow glyph "▼" */
export const ARROW_FONT_SIZE = 11;

/** Width of the color indicator pill in the color column (px) */
export const COLOR_BAR_WIDTH = 6;

/** Corner radius of the color indicator pill (px) */
export const COLOR_BAR_RADIUS = 3;

/**
 * Font size for task table column header labels.
 * Matches Tailwind text-xs (12px) used in the app — density-invariant.
 */
export const COLUMN_HEADER_FONT_SIZE = 12;

/** SVG stroke-width for table border and separator lines (px) */
export const BORDER_STROKE_WIDTH = 1;

/**
 * CSS letter-spacing for column header labels.
 * Matches Tailwind's tracking-wider utility (0.05em).
 */
export const LETTER_SPACING_WIDER = "0.05em";

/**
 * CSS class applied to the main Gantt chart SVG element by ExportRenderer.
 * Used as a querySelector selector by PDF and SVG export utilities.
 * Must stay in sync with the className prop on that element in ExportRenderer.tsx.
 */
export const EXPORT_CHART_SVG_CLASS = "gantt-chart";

/**
 * CSS class applied to the timeline header SVG element by ExportRenderer.
 * Used as a querySelector selector by PDF export utilities.
 * Must stay in sync with the className prop on that element in ExportRenderer.tsx.
 */
export const EXPORT_TIMELINE_HEADER_SVG_CLASS = "export-timeline-header";

/** SVG namespace URI — required for every createElementNS call */
export const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * White background fill colour for SVG/PDF export with opaque background.
 * Intentionally hardcoded: pure white is a presentation-layer override for
 * the "opaque background" export option, not a design-system colour that
 * should track theme changes.
 * Single source of truth — shared by svgExport.ts and pdfExport.ts.
 */
export const SVG_BACKGROUND_WHITE = "#ffffff";

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
