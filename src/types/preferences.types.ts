/**
 * User preferences types for OwnChart.
 * UI Density, Date Format, Regional Settings, Task Display.
 */

/**
 * UI density modes:
 * - compact: 28px rows, shows most tasks on screen
 * - normal: 36px rows, balanced view (default for new users)
 * - comfortable: 44px rows, easier to read
 */
export type UiDensity = "compact" | "normal" | "comfortable";

/** Date format options for user preference */
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

/** First day of week options */
export type FirstDayOfWeek = "sunday" | "monday";

/**
 * Week numbering system options:
 * - ISO 8601: Week 1 contains the first Thursday (used in Europe)
 * - US: Week 1 contains January 1st (used in USA/Canada)
 */
export type WeekNumberingSystem = "iso" | "us";

/** Task label position options in the timeline */
export type TaskLabelPosition = "before" | "inside" | "after" | "none";

/** Density configuration values for a single mode */
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

export type DensityConfigMap = Record<UiDensity, DensityConfig>;

/**
 * User preferences state.
 * These settings are stored in localStorage and persist across projects.
 */
export interface UserPreferences {
  // Appearance
  uiDensity: UiDensity;

  // Regional
  dateFormat: DateFormat;
  firstDayOfWeek: FirstDayOfWeek;
  weekNumberingSystem: WeekNumberingSystem;

  // Note: holidayRegion is a per-project setting in chartSlice
}

/** Working days configuration for project settings */
export interface WorkingDaysConfig {
  excludeSaturday: boolean;
  excludeSunday: boolean;
  excludeHolidays: boolean;
}
