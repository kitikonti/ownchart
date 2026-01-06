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
 * These settings are stored in localStorage and persist across projects
 */
export interface UserPreferences {
  // Appearance (Sprint 1.5.9.1)
  uiDensity: UiDensity;

  // Regional (Sprint 1.5.9)
  dateFormat: DateFormat;
  firstDayOfWeek: FirstDayOfWeek;
  weekNumberingSystem: WeekNumberingSystem;
  holidayRegion: string; // ISO 3166-1 alpha-2 code (e.g., 'AT', 'DE', 'US')

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

/**
 * Detect locale-based date format from browser
 */
export function detectLocaleDateFormat(): DateFormat {
  const locale = navigator.language.toLowerCase();

  // US uses MM/DD/YYYY
  if (locale.includes("us") || locale === "en") {
    return "MM/DD/YYYY";
  }

  // ISO format for some locales (Japan, China, etc.)
  if (
    locale.startsWith("ja") ||
    locale.startsWith("zh") ||
    locale.startsWith("ko")
  ) {
    return "YYYY-MM-DD";
  }

  // Most of the world uses DD/MM/YYYY
  return "DD/MM/YYYY";
}

/**
 * Detect first day of week from browser locale
 */
export function detectLocaleFirstDayOfWeek(): FirstDayOfWeek {
  const locale = navigator.language.toLowerCase();

  // Countries that use Sunday as first day of week
  const sundayFirstCountries = [
    "us",
    "ca",
    "jp",
    "tw",
    "hk",
    "il",
    "sa",
    "ae",
    "eg",
    "br",
  ];

  // Check if locale contains any Sunday-first country code
  if (sundayFirstCountries.some((code) => locale.includes(code))) {
    return "sunday";
  }

  // Most countries use Monday as first day
  return "monday";
}

/**
 * Detect week numbering system from browser locale
 * US/Canada use their own system, most other countries use ISO 8601
 */
export function detectLocaleWeekNumberingSystem(): WeekNumberingSystem {
  const locale = navigator.language.toLowerCase();

  // Countries that use US week numbering (Week 1 contains Jan 1)
  const usWeekNumberingCountries = ["us", "ca"];

  // Check if locale contains any US-style country code
  if (usWeekNumberingCountries.some((code) => locale.includes(code))) {
    return "us";
  }

  // Most countries use ISO 8601 (Week 1 contains first Thursday)
  return "iso";
}

/**
 * Detect holiday region from browser locale
 */
export function detectLocaleHolidayRegion(): string {
  const locale = navigator.language;
  const parts = locale.split("-");

  // If locale has region (e.g., "en-US", "de-AT"), use the region
  if (parts.length > 1) {
    return parts[1].toUpperCase();
  }

  // Otherwise, try to map language to a country
  const languageToCountry: Record<string, string> = {
    de: "DE",
    en: "US",
    fr: "FR",
    es: "ES",
    it: "IT",
    nl: "NL",
    pt: "PT",
    ru: "RU",
    ja: "JP",
    zh: "CN",
    ko: "KR",
  };

  return languageToCountry[parts[0].toLowerCase()] || "US";
}

/**
 * Default preferences for new users
 * Uses locale detection for regional settings
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  uiDensity: "normal",
  dateFormat: detectLocaleDateFormat(),
  firstDayOfWeek: detectLocaleFirstDayOfWeek(),
  weekNumberingSystem: detectLocaleWeekNumberingSystem(),
  holidayRegion: detectLocaleHolidayRegion(),
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
