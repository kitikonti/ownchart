/**
 * Types for PNG export functionality.
 */

/**
 * Export options for PNG generation.
 */
export interface ExportOptions {
  /** Target width in pixels */
  width: number;
  /** Include the task list (left panel) */
  includeTaskList: boolean;
  /** Include the timeline header */
  includeHeader: boolean;
  /** Background color */
  background: "white" | "transparent";
}

/**
 * Preset width options for export.
 */
export const EXPORT_WIDTH_PRESETS = {
  HD: 1280,
  FULL_HD: 1920,
  QHD: 2560,
  "4K": 3840,
} as const;

export type ExportWidthPreset = keyof typeof EXPORT_WIDTH_PRESETS;

/**
 * Default export options.
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  width: EXPORT_WIDTH_PRESETS.FULL_HD,
  includeTaskList: true,
  includeHeader: true,
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
