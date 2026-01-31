/**
 * User preferences types for OwnChart
 * Sprint 1.5.9.1: UI Density settings
 * Sprint 1.5.9: User Preferences & Settings (extended)
 */

/**
 * UI density modes
 * - compact: 28px rows, shows most tasks on screen
 * - normal: 36px rows, balanced view (default for new users)
 * - comfortable: 44px rows, easier to read (current default before this feature)
 */
export type UiDensity = "compact" | "normal" | "comfortable";

/**
 * Date format options for user preference
 */
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

/**
 * First day of week options
 */
export type FirstDayOfWeek = "sunday" | "monday";

/**
 * Week numbering system options
 * - ISO 8601: Week 1 contains the first Thursday (used in Europe)
 * - US: Week 1 contains January 1st (used in USA/Canada)
 */
export type WeekNumberingSystem = "iso" | "us";

/**
 * Task label position options in the timeline
 */
export type TaskLabelPosition = "before" | "inside" | "after" | "none";

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
    rowNumber: number;
    color: number;
    nameMin: number;
    startDate: number;
    endDate: number;
    duration: number;
    progress: number;
  };
}

/**
 * All density configurations
 */
export type DensityConfigMap = Record<UiDensity, DensityConfig>;

/**
 * User preferences state
 * These settings are stored in localStorage and persist across projects
 */
export interface UserPreferences {
  // Appearance (Sprint 1.5.9.1)
  uiDensity: UiDensity;

  // Regional (Sprint 1.5.9)
  dateFormat: DateFormat;
  firstDayOfWeek: FirstDayOfWeek;
  weekNumberingSystem: WeekNumberingSystem;

  // Note: holidayRegion is now a per-project setting in chartSlice
  // (moved from user preferences to ensure consistent behavior when sharing files)

  // Future preferences (V2.0+):
  // theme: 'light' | 'dark' | 'system';
  // language: string;
}

/**
 * Working days configuration for project settings
 */
export interface WorkingDaysConfig {
  excludeSaturday: boolean;
  excludeSunday: boolean;
  excludeHolidays: boolean;
}

/**
 * Default working days configuration
 */
export const DEFAULT_WORKING_DAYS_CONFIG: WorkingDaysConfig = {
  excludeSaturday: true,
  excludeSunday: true,
  excludeHolidays: true,
};

// Re-export locale detection functions from their dedicated module
export {
  detectLocaleDateFormat,
  detectLocaleFirstDayOfWeek,
  detectLocaleWeekNumberingSystem,
  detectLocaleHolidayRegion,
  DEFAULT_PREFERENCES,
} from "../utils/localeDetection";

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
      rowNumber: 48,
      color: 28,
      nameMin: 160,
      startDate: 105,
      endDate: 105,
      duration: 80,
      progress: 56,
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
      rowNumber: 52,
      color: 30,
      nameMin: 180,
      startDate: 118,
      endDate: 118,
      duration: 90,
      progress: 62,
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
      rowNumber: 56,
      color: 32,
      nameMin: 200,
      startDate: 130,
      endDate: 130,
      duration: 100,
      progress: 70,
    },
  },
};
