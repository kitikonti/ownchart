/**
 * Color mode types for Smart Color Management
 * Defines the 5 color modes and their options
 */

import type { HexColor, PaletteId } from "./branded.types";

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
  selectedPaletteId: PaletteId | null;
  customMonochromeBase: HexColor | null;
}

/**
 * Summary group mode options
 */
export interface SummaryModeOptions {
  useMilestoneAccent: boolean;
  milestoneAccentColor: HexColor;
}

/**
 * Task type mode options - fixed colors per type
 */
export interface TaskTypeModeOptions {
  summaryColor: HexColor;
  taskColor: HexColor;
  milestoneColor: HexColor;
}

/**
 * Hierarchy mode options
 */
export interface HierarchyModeOptions {
  baseColor: HexColor;
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
