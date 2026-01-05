/**
 * User preferences types for OwnChart
 * Sprint 1.5.9.1: UI Density settings
 */

/**
 * UI density modes
 * - compact: 28px rows, shows most tasks on screen
 * - normal: 36px rows, balanced view (default for new users)
 * - comfortable: 44px rows, easier to read (current default before this feature)
 */
export type UiDensity = "compact" | "normal" | "comfortable";

/**
 * Density configuration values for a single mode
 */
export interface DensityConfig {
  rowHeight: number;
  taskBarHeight: number;
  taskBarOffset: number;
  cellPaddingY: number;
  cellPaddingX: number;
  headerPaddingY: number;
  fontSizeCell: number;
  fontSizeBar: number;
  fontSizeHeader: number;
  iconSize: number;
  checkboxSize: number;
  indentSize: number;
  colorBarHeight: number;
  // Column widths
  columnWidths: {
    dragHandle: number;
    checkbox: number;
    color: number;
    nameMin: number;
    startDate: number;
    endDate: number;
    duration: number;
    progress: number;
    delete: number;
  };
}

/**
 * All density configurations
 */
export type DensityConfigMap = Record<UiDensity, DensityConfig>;

/**
 * User preferences state
 */
export interface UserPreferences {
  uiDensity: UiDensity;
  // Future preferences can be added here:
  // dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  // firstDayOfWeek: 'sunday' | 'monday';
  // theme: 'light' | 'dark' | 'system';
}

/**
 * Default preferences for new users
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  uiDensity: "normal",
};

/**
 * Density configuration values for each mode
 * Based on SPRINT_1.5.9.1_UI_DENSITY_CONCEPT.md Section 3.1
 */
export const DENSITY_CONFIG: DensityConfigMap = {
  compact: {
    rowHeight: 28,
    taskBarHeight: 20,
    taskBarOffset: 4,
    cellPaddingY: 4,
    cellPaddingX: 8,
    headerPaddingY: 8,
    fontSizeCell: 14,
    fontSizeBar: 11,
    fontSizeHeader: 10,
    iconSize: 14,
    checkboxSize: 14,
    indentSize: 16,
    colorBarHeight: 20,
    columnWidths: {
      dragHandle: 32,
      checkbox: 40,
      color: 28,
      nameMin: 160,
      startDate: 105,
      endDate: 105,
      duration: 80,
      progress: 56,
      delete: 32,
    },
  },
  normal: {
    rowHeight: 36,
    taskBarHeight: 26,
    taskBarOffset: 5,
    cellPaddingY: 6,
    cellPaddingX: 10,
    headerPaddingY: 12,
    fontSizeCell: 15,
    fontSizeBar: 12,
    fontSizeHeader: 11,
    iconSize: 16,
    checkboxSize: 16,
    indentSize: 18,
    colorBarHeight: 24,
    columnWidths: {
      dragHandle: 36,
      checkbox: 44,
      color: 30,
      nameMin: 180,
      startDate: 118,
      endDate: 118,
      duration: 90,
      progress: 62,
      delete: 36,
    },
  },
  comfortable: {
    rowHeight: 44,
    taskBarHeight: 32,
    taskBarOffset: 6,
    cellPaddingY: 8,
    cellPaddingX: 12,
    headerPaddingY: 16,
    fontSizeCell: 16,
    fontSizeBar: 13,
    fontSizeHeader: 12,
    iconSize: 18,
    checkboxSize: 18,
    indentSize: 20,
    colorBarHeight: 28,
    columnWidths: {
      dragHandle: 40,
      checkbox: 48,
      color: 32,
      nameMin: 200,
      startDate: 130,
      endDate: 130,
      duration: 100,
      progress: 70,
      delete: 40,
    },
  },
};
