/**
 * Shared constants for SVG/PDF export rendering.
 * Used by both pdfExport.ts and svgExport.ts.
 */

/** Height of the header row in pixels */
export const HEADER_HEIGHT = 48;

/** Font family for SVG text elements (system font stack) */
export const SVG_FONT_FAMILY = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Tailwind slate colors for consistent styling.
 * These match the web app's color scheme.
 */
export const COLORS = {
  /** neutral-800 - task names, regular cell text */
  textPrimary: "#1e293b",
  /** neutral-600 - dates, progress, icons, header labels */
  textSecondary: "#475569",
  /** neutral-500 - summary dates/duration (lighter, italic in app) */
  textSummary: "#64748b",
  /** neutral-600 - header labels */
  textHeader: "#475569",
  /** neutral-200 - header borders */
  border: "#e2e8f0",
  /** neutral-100 - row borders */
  borderLight: "#f1f5f9",
  /** neutral-50 - header background */
  headerBg: "#f8fafc",
} as const;

/**
 * Header labels matching the app's TASK_COLUMNS.
 * Keys correspond to ExportColumnKey values.
 */
export const HEADER_LABELS: Record<string, string> = {
  color: "",
  name: "Name",
  startDate: "Start Date",
  endDate: "End Date",
  duration: "Duration",
  progress: "%",
};

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
