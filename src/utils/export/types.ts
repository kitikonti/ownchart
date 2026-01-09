/**
 * Types for export functionality (PNG, PDF, SVG).
 */

import type {
  UiDensity,
  TaskLabelPosition,
} from "../../types/preferences.types";

// =============================================================================
// Export Format Types
// =============================================================================

/** Export format selection */
export type ExportFormat = "png" | "pdf" | "svg";

// =============================================================================
// PDF Export Types
// =============================================================================

/** PDF page size options */
export type PdfPageSize = "a4" | "a3" | "letter" | "legal" | "tabloid";

/** PDF page orientation */
export type PdfOrientation = "landscape" | "portrait";

/** PDF scale mode */
export type PdfScaleMode = "fitToPage" | "custom";

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
  showExportDate: boolean;
  customText?: string;
}

/** PDF-specific export options */
export interface PdfExportOptions {
  pageSize: PdfPageSize;
  orientation: PdfOrientation;
  scaleMode: PdfScaleMode;
  customScale?: number; // percentage, for custom scale
  marginPreset: PdfMarginPreset;
  customMargins?: PdfMargins;
  header: PdfHeaderFooter;
  footer: PdfHeaderFooter;
  grayscale: boolean;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

/** PDF page dimensions in mm (landscape orientation by default) */
export const PDF_PAGE_SIZES: Record<
  PdfPageSize,
  { width: number; height: number }
> = {
  a4: { width: 297, height: 210 },
  a3: { width: 420, height: 297 },
  letter: { width: 279, height: 216 },
  legal: { width: 356, height: 216 },
  tabloid: { width: 432, height: 279 },
};

/** PDF margin presets in mm */
export const PDF_MARGIN_PRESETS: Record<PdfMarginPreset, PdfMargins> = {
  normal: { top: 10, bottom: 10, left: 15, right: 15 },
  narrow: { top: 5, bottom: 5, left: 5, right: 5 },
  wide: { top: 20, bottom: 20, left: 25, right: 25 },
  none: { top: 0, bottom: 0, left: 0, right: 0 },
  custom: { top: 10, bottom: 10, left: 15, right: 15 },
};

/** Default PDF export options */
export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  pageSize: "a4",
  orientation: "landscape",
  scaleMode: "fitToPage",
  marginPreset: "normal",
  header: {
    showProjectName: true,
    showExportDate: false,
  },
  footer: {
    showProjectName: false,
    showExportDate: false,
  },
  grayscale: false,
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

/** Zoom mode for export */
export type ExportZoomMode = "currentView" | "custom" | "fitToWidth";

/** Date range mode for export */
export type ExportDateRangeMode = "all" | "visible" | "custom";

/** Quick preset for common export sizes */
export interface ExportQuickPreset {
  key: string;
  label: string;
  description: string;
  targetWidth: number;
}

/**
 * Export options for PNG generation.
 */
export interface ExportOptions {
  /** How the zoom level is determined */
  zoomMode: ExportZoomMode;
  /** Timeline zoom level (affects horizontal scale) - used when zoomMode is 'preset' or 'custom' */
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
  /** Include holiday highlighting (Sprint 1.5.9) */
  includeHolidays: boolean;
  /** Task label position on bars (Sprint 1.5.9) */
  taskLabelPosition: TaskLabelPosition;
  /** Background color */
  background: "white" | "transparent";
  /** UI density for export */
  density: UiDensity;
}

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

/**
 * Quick presets for common export target widths.
 * Based on standard paper sizes at 150 DPI (good print quality).
 */
export const EXPORT_QUICK_PRESETS: ExportQuickPreset[] = [
  {
    key: "a4-landscape",
    label: "A4 Landscape",
    description: "1754 × 1240 px (150 DPI)",
    targetWidth: 1754,
  },
  {
    key: "a3-landscape",
    label: "A3 Landscape",
    description: "2480 × 1754 px (150 DPI)",
    targetWidth: 2480,
  },
  {
    key: "letter-landscape",
    label: "Letter Landscape",
    description: "1650 × 1275 px (150 DPI)",
    targetWidth: 1650,
  },
  {
    key: "hd-screen",
    label: "HD Screen",
    description: "1920 × 1080 px",
    targetWidth: 1920,
  },
  {
    key: "4k-screen",
    label: "4K Screen",
    description: "3840 × 2160 px",
    targetWidth: 3840,
  },
];

/** Minimum zoom level for export */
export const EXPORT_ZOOM_MIN = 0.05;

/** Maximum zoom level for export */
export const EXPORT_ZOOM_MAX = 3.0;

/** Zoom threshold below which labels become hard to read */
export const EXPORT_ZOOM_READABLE_THRESHOLD = 0.15;

/** Zoom threshold below which labels are typically hidden */
export const EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD = 0.08;

/** Maximum safe canvas width (WebGL limit on many GPUs) */
export const EXPORT_MAX_SAFE_WIDTH = 16384;

/**
 * Default export options.
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  zoomMode: "currentView",
  timelineZoom: EXPORT_ZOOM_PRESETS.STANDARD,
  fitToWidth: 1920,
  dateRangeMode: "all",
  selectedColumns: [],
  includeHeader: true,
  includeTodayMarker: true,
  includeDependencies: true,
  includeGridLines: true,
  includeWeekends: true,
  includeHolidays: true,
  taskLabelPosition: "inside",
  background: "white",
  density: "comfortable",
};

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
