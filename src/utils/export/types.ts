/**
 * Types for export functionality (PNG, PDF, SVG).
 */

import type { UiDensity, TaskLabelPosition } from "@/types/preferences.types";
import type { Task } from "@/types/chart.types";

// =============================================================================
// Export Format Types
// =============================================================================

/** Export format selection */
export type ExportFormat = "png" | "pdf" | "svg";

/** Chart pixel dimensions (width × height in px) */
export interface PixelDimensions {
  width: number;
  height: number;
}

// =============================================================================
// PDF Export Types
// =============================================================================

/** PDF page size options */
export type PdfPageSize =
  | "a4"
  | "a3"
  | "a2"
  | "a1"
  | "a0"
  | "letter"
  | "legal"
  | "tabloid"
  | "custom";

/** PDF page orientation */
export type PdfOrientation = "landscape" | "portrait";

/** Custom page dimensions in mm */
export interface PdfCustomPageSize {
  width: number;
  height: number;
}

/**
 * Default custom page dimensions (mm) used as fallback when no custom size is provided.
 * 500 × 300 mm is a generous landscape canvas — wider than A3 (420 mm), suitable for
 * projects spanning many months that don't map cleanly to a standard paper size.
 */
export const DEFAULT_CUSTOM_PAGE_SIZE: PdfCustomPageSize = {
  width: 500,
  height: 300,
};

/** PDF margin preset */
export type PdfMarginPreset = "normal" | "narrow" | "wide" | "none" | "custom";

/** PDF margin values in millimeters */
export interface PdfMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** PDF header/footer configuration */
export interface PdfHeaderFooter {
  showProjectName: boolean;
  showAuthor: boolean;
  showExportDate: boolean;
  showLogo: boolean;
}

/** PDF document metadata (title, author, subject) */
export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
}

/** PDF-specific export options */
export interface PdfExportOptions {
  pageSize: PdfPageSize;
  customPageSize?: PdfCustomPageSize; // only used when pageSize === "custom"
  orientation: PdfOrientation;
  marginPreset: PdfMarginPreset;
  customMargins?: PdfMargins;
  header: PdfHeaderFooter;
  footer: PdfHeaderFooter;
  metadata: PdfMetadata;
}

/** PDF page dimensions in mm (landscape orientation by default) */
export const PDF_PAGE_SIZES: Record<
  Exclude<PdfPageSize, "custom">,
  { width: number; height: number }
> = {
  a4: { width: 297, height: 210 },
  a3: { width: 420, height: 297 },
  a2: { width: 594, height: 420 },
  a1: { width: 841, height: 594 },
  a0: { width: 1189, height: 841 },
  letter: { width: 279, height: 216 },
  legal: { width: 356, height: 216 },
  tabloid: { width: 432, height: 279 },
};

// Named margin constants to avoid magic numbers in PDF_MARGIN_PRESETS.
// "normal" is the baseline; "narrow" halves it; "wide" roughly doubles it.
const PDF_MARGIN_NORMAL_TOPBOTTOM_MM = 10;
const PDF_MARGIN_NORMAL_SIDE_MM = 15;
const PDF_MARGIN_NARROW_MM = 5;
const PDF_MARGIN_WIDE_TOPBOTTOM_MM = 20;
const PDF_MARGIN_WIDE_SIDE_MM = 25;

/** PDF margin presets in mm */
export const PDF_MARGIN_PRESETS: Record<PdfMarginPreset, PdfMargins> = {
  normal: {
    top: PDF_MARGIN_NORMAL_TOPBOTTOM_MM,
    bottom: PDF_MARGIN_NORMAL_TOPBOTTOM_MM,
    left: PDF_MARGIN_NORMAL_SIDE_MM,
    right: PDF_MARGIN_NORMAL_SIDE_MM,
  },
  narrow: {
    top: PDF_MARGIN_NARROW_MM,
    bottom: PDF_MARGIN_NARROW_MM,
    left: PDF_MARGIN_NARROW_MM,
    right: PDF_MARGIN_NARROW_MM,
  },
  wide: {
    top: PDF_MARGIN_WIDE_TOPBOTTOM_MM,
    bottom: PDF_MARGIN_WIDE_TOPBOTTOM_MM,
    left: PDF_MARGIN_WIDE_SIDE_MM,
    right: PDF_MARGIN_WIDE_SIDE_MM,
  },
  none: { top: 0, bottom: 0, left: 0, right: 0 },
  // "custom" fallback mirrors "normal" so users see a sensible starting point
  // when they first switch to the custom preset.
  custom: {
    top: PDF_MARGIN_NORMAL_TOPBOTTOM_MM,
    bottom: PDF_MARGIN_NORMAL_TOPBOTTOM_MM,
    left: PDF_MARGIN_NORMAL_SIDE_MM,
    right: PDF_MARGIN_NORMAL_SIDE_MM,
  },
};

/** Default PDF export options */
export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  pageSize: "a4",
  // Pre-seeded so the user sees a sensible canvas size when switching to "custom"
  // even though pageSize defaults to "a4" and customPageSize is normally ignored.
  customPageSize: DEFAULT_CUSTOM_PAGE_SIZE,
  orientation: "landscape",
  marginPreset: "normal",
  header: {
    showProjectName: true,
    showAuthor: false,
    showExportDate: false,
    showLogo: false,
  },
  footer: {
    showProjectName: false,
    showAuthor: false,
    showExportDate: true,
    showLogo: false,
  },
  metadata: {},
};

// =============================================================================
// SVG Export Types
// =============================================================================

/** SVG dimension mode */
export type SvgDimensionMode = "auto" | "custom";

/** SVG text handling */
export type SvgTextMode = "text" | "paths";

/** SVG styling mode */
export type SvgStyleMode = "inline" | "classes";

/** SVG export options */
export interface SvgExportOptions {
  dimensionMode: SvgDimensionMode;
  customWidth?: number; // pixels, for custom mode
  customHeight?: number; // pixels, for custom mode
  preserveAspectRatio: boolean;
  textMode: SvgTextMode;
  styleMode: SvgStyleMode;
  optimize: boolean; // Run SVGO
  includeBackground: boolean; // Add white bg rectangle
  responsiveMode: boolean; // If true, no width/height, only viewBox
  includeAccessibility: boolean; // Add role="img" and aria-label
  copyToClipboard: boolean; // Copy instead of download
}

/** Default SVG export options */
export const DEFAULT_SVG_OPTIONS: SvgExportOptions = {
  dimensionMode: "auto",
  preserveAspectRatio: true,
  textMode: "text",
  styleMode: "inline",
  optimize: false,
  includeBackground: false,
  responsiveMode: false,
  includeAccessibility: true,
  copyToClipboard: false,
};

/** Available columns for export */
export type ExportColumnKey =
  | "color"
  | "name"
  | "startDate"
  | "endDate"
  | "duration"
  | "progress";

/**
 * Data-only columns (excludes layout columns like color/name that need special rendering).
 * Use this type when only data cells (dates, duration, progress) are relevant,
 * e.g. for column auto-fit calculations that skip the fixed-width layout columns.
 */
export type ExportDataColumnKey = Exclude<ExportColumnKey, "color" | "name">;

/**
 * Default columns shown when no explicit selection has been made.
 * Used as fallback in ExportRenderer and SVG export when selectedColumns is empty.
 *
 * This is an intentional subset of ExportColumnKey — "color" and "duration" are
 * omitted from the default to keep the exported table compact. When new column keys
 * are added to ExportColumnKey, consider whether they should appear here by default.
 */
export const DEFAULT_EXPORT_COLUMNS: ExportColumnKey[] = [
  "name",
  "startDate",
  "endDate",
  "progress",
];

/** Zoom mode for export */
export type ExportZoomMode = "currentView" | "custom" | "fitToWidth";

/** Date range mode for export */
export type ExportDateRangeMode = "all" | "visible" | "custom";

/** Background fill mode for export (white canvas or transparent) */
export type ExportBackground = "white" | "transparent";

/** Quick preset for common export sizes */
export interface ExportQuickPreset {
  key: string;
  label: string;
  description: string;
  targetWidth: number;
}

/**
 * Common export options shared across all export formats (PNG, PDF, SVG).
 * Format-specific options live in {@link PdfExportOptions} and {@link SvgExportOptions}.
 */
export interface ExportOptions {
  /** How the zoom level is determined */
  zoomMode: ExportZoomMode;
  /** Timeline zoom level (affects horizontal scale) - used when zoomMode is 'custom' */
  timelineZoom: number;
  /** Target width in pixels - used when zoomMode is 'fitToWidth' */
  fitToWidth: number;
  /** Date range mode for export */
  dateRangeMode: ExportDateRangeMode;
  /** Custom date range start (ISO string) - used when dateRangeMode is 'custom' */
  customDateStart?: string;
  /** Custom date range end (ISO string) - used when dateRangeMode is 'custom' */
  customDateEnd?: string;
  /** Selected columns to include in export (empty = timeline only) */
  selectedColumns: ExportColumnKey[];
  /** Include the timeline header */
  includeHeader: boolean;
  /** Include the today marker line */
  includeTodayMarker: boolean;
  /** Include dependency arrows */
  includeDependencies: boolean;
  /** Include grid lines */
  includeGridLines: boolean;
  /** Include weekend highlighting */
  includeWeekends: boolean;
  /** Include holiday highlighting */
  includeHolidays: boolean;
  /** Task label position on bars */
  taskLabelPosition: TaskLabelPosition;
  /** Background fill mode */
  background: ExportBackground;
  /** UI density for export */
  density: UiDensity;
}

/**
 * Boolean toggle keys in ExportOptions (type-safe subset for checkbox groups).
 * Derived automatically from ExportOptions so it stays in sync when new boolean
 * fields are added — no manual maintenance required.
 *
 * `Required<ExportOptions>` is applied first so that optional fields (which produce
 * `T | undefined`) don't widen their value type and accidentally fail the `extends boolean`
 * guard. After `Required<>`, every field is non-optional and the mapped type correctly
 * narrows to only the keys whose resolved value type is exactly `boolean`.
 */
export type ExportBooleanKey = {
  [K in keyof Required<ExportOptions>]: Required<ExportOptions>[K] extends boolean
    ? K
    : never;
}[keyof Required<ExportOptions>];

/**
 * Preset zoom options for export.
 * These control how spread out the timeline appears.
 */
export const EXPORT_ZOOM_PRESETS = {
  COMPACT: 0.5, // 50% - more dates fit, compact view
  STANDARD: 1.0, // 100% - same as default app view
  DETAILED: 1.5, // 150% - more space per day
  EXPANDED: 2.0, // 200% - maximum detail
} as const;

export type ExportZoomPreset = keyof typeof EXPORT_ZOOM_PRESETS;

/** Default fitToWidth value in pixels (HD screen width) */
export const DEFAULT_FIT_TO_WIDTH_PX = 1920;

/** HD (1080p) screen height in pixels */
export const HD_SCREEN_HEIGHT_PX = 1080;

/** 4K (UHD) screen width in pixels */
export const UHD_SCREEN_WIDTH_PX = 3840;

/** 4K (UHD) screen height in pixels */
export const UHD_SCREEN_HEIGHT_PX = 2160;

/** Minimum zoom level for export */
export const EXPORT_ZOOM_MIN = 0.05;

/** Maximum zoom level for export */
export const EXPORT_ZOOM_MAX = 3.0;

/**
 * 10% zoom — fine-grained preset available only for PNG/SVG exports.
 * PDF exports omit this level because fixed page dimensions impose readability
 * constraints that make very small scales impractical.
 */
export const EXPORT_ZOOM_TENTH = 0.1;

/**
 * 25% zoom — fine-grained preset available only for PNG/SVG exports.
 * See EXPORT_ZOOM_TENTH for rationale.
 */
export const EXPORT_ZOOM_QUARTER = 0.25;

/** Zoom multiplier (1.0 = 100%) below which labels become hard to read */
export const EXPORT_ZOOM_READABLE_THRESHOLD = 0.15;

/** Zoom multiplier (1.0 = 100%) below which labels are typically hidden */
export const EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD = 0.08;

/** Maximum safe canvas width (WebGL limit on many GPUs) */
export const EXPORT_MAX_SAFE_WIDTH = 16384;

/** Width threshold above which a "large export" info message is shown (PNG only) */
export const EXPORT_LARGE_WIDTH_THRESHOLD = 4000;

/** Minimum allowed fitToWidth value in pixels */
export const MIN_FIT_WIDTH_PX = 100;

/** Maximum allowed fitToWidth value in pixels */
export const MAX_FIT_WIDTH_PX = 20000;

/**
 * Default export options.
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  zoomMode: "fitToWidth",
  timelineZoom: EXPORT_ZOOM_PRESETS.STANDARD,
  fitToWidth: DEFAULT_FIT_TO_WIDTH_PX,
  dateRangeMode: "all",
  selectedColumns: ["color", "name", "startDate", "endDate"],
  includeHeader: true,
  includeTodayMarker: true,
  includeDependencies: true,
  includeGridLines: true,
  includeWeekends: true,
  includeHolidays: true,
  taskLabelPosition: "inside",
  background: "white",
  density: "normal",
};

// =============================================================================
// Task Table Rendering Types
// =============================================================================

/**
 * Flattened task with hierarchy information for SVG/PDF task table rendering.
 * Intentionally simpler than the store's FlattenedTask (no globalRowNumber needed).
 */
export interface FlattenedTask {
  task: Task;
  level: number;
  hasChildren: boolean;
}

/** Readability status for export zoom level */
export interface ReadabilityStatus {
  level: "good" | "warning" | "critical";
  message: string;
}

/**
 * Export state for tracking progress.
 */
export interface ExportState {
  isExporting: boolean;
  progress: number; // 0-100
  error: string | null;
}

/**
 * Initial export state.
 */
export const INITIAL_EXPORT_STATE: ExportState = {
  isExporting: false,
  progress: 0,
  error: null,
};

// =============================================================================
// Export Layout Input
// =============================================================================

/** Common input parameters for export layout computation and dimension calculation. */
export interface ExportLayoutInput {
  tasks: Task[];
  options: ExportOptions;
  /**
   * Per-column pixel widths for the task table. Required when selectedColumns is
   * non-empty; omit (or pass undefined) for timeline-only exports.
   */
  columnWidths?: Record<string, number>;
  /**
   * Current app timeline zoom level (unitless multiplier). Required when
   * options.zoomMode === 'currentView' to replicate the on-screen zoom in the export.
   */
  currentAppZoom?: number;
  /**
   * Date range spanning all tasks (earliest start → latest end).
   * Required when options.dateRangeMode === 'all' or 'custom'.
   */
  projectDateRange?: { start: Date; end: Date };
  /**
   * Currently visible date range on screen.
   * Required when options.dateRangeMode === 'visible'.
   */
  visibleDateRange?: { start: Date; end: Date };
}
