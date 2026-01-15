/**
 * Color mode types for Smart Color Management
 * Defines the 5 color modes and their options
 */

/**
 * Available color modes
 */
export type ColorMode =
  | "manual" // Per-task control with enhanced picker
  | "theme" // One-click themes with palette selection
  | "summary" // Children inherit parent summary color
  | "taskType" // Summary/Task/Milestone each get fixed color
  | "hierarchy"; // Darker→lighter based on hierarchy depth

/**
 * Theme mode options - selected palette and custom monochrome
 */
export interface ThemeModeOptions {
  selectedPaletteId: string | null;
  customMonochromeBase: string | null; // Hex color for custom monochrome palette
}

/**
 * Summary group mode options
 */
export interface SummaryModeOptions {
  useMilestoneAccent: boolean;
  milestoneAccentColor: string; // Hex color for milestone accent
}

/**
 * Task type mode options - fixed colors per type
 */
export interface TaskTypeModeOptions {
  summaryColor: string;
  taskColor: string;
  milestoneColor: string;
}

/**
 * Hierarchy mode options
 */
export interface HierarchyModeOptions {
  baseColor: string;
  lightenPercentPerLevel: number; // e.g., 12 for 12%
  maxLightenPercent: number; // e.g., 36 for max 36% lightening
}

/**
 * Complete color mode state
 */
export interface ColorModeState {
  mode: ColorMode;
  themeOptions: ThemeModeOptions;
  summaryOptions: SummaryModeOptions;
  taskTypeOptions: TaskTypeModeOptions;
  hierarchyOptions: HierarchyModeOptions;
}

/**
 * Default color mode state
 */
export const DEFAULT_COLOR_MODE_STATE: ColorModeState = {
  mode: "manual",
  themeOptions: {
    selectedPaletteId: null,
    customMonochromeBase: null,
  },
  summaryOptions: {
    useMilestoneAccent: true,
    milestoneAccentColor: "#CA8A04", // Gold
  },
  taskTypeOptions: {
    summaryColor: "#0A2E4A", // Dark blue
    taskColor: "#0F6CBD", // Brand blue
    milestoneColor: "#CA8A04", // Gold
  },
  hierarchyOptions: {
    baseColor: "#0F6CBD", // Brand blue
    lightenPercentPerLevel: 12,
    maxLightenPercent: 36,
  },
};
