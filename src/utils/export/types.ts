/**
 * Types for PNG export functionality.
 */

import type {
  UiDensity,
  TaskLabelPosition,
} from "../../types/preferences.types";

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
