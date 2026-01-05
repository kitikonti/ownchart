/**
 * Types for PNG export functionality.
 */

/** Available columns for export */
export type ExportColumnKey =
  | "color"
  | "name"
  | "startDate"
  | "endDate"
  | "duration"
  | "progress";

/**
 * Export options for PNG generation.
 */
export interface ExportOptions {
  /** Timeline zoom level (affects horizontal scale) */
  timelineZoom: number;
  /** Selected columns to include in export (empty = timeline only) */
  selectedColumns: ExportColumnKey[];
  /** Include the timeline header */
  includeHeader: boolean;
  /** Include the today marker line */
  includeTodayMarker: boolean;
  /** Include dependency arrows */
  includeDependencies: boolean;
  /** Background color */
  background: "white" | "transparent";
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
 * Default export options.
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  timelineZoom: EXPORT_ZOOM_PRESETS.STANDARD,
  selectedColumns: [],
  includeHeader: true,
  includeTodayMarker: true,
  includeDependencies: true,
  background: "white",
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
