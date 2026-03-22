/**
 * Locale detection utilities for user preferences.
 * Detects date format, first day of week, week numbering system,
 * and holiday region from the browser locale.
 *
 * NOTE: This module reads `navigator.language` at import time via
 * `DEFAULT_PREFERENCES`. It must only be imported in browser environments.
 */

import type {
  DateFormat,
  FirstDayOfWeek,
  WeekNumberingSystem,
  UserPreferences,
} from "@/types/preferences.types";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Sentinel date for format detection.
 * Day (2) ≠ month (1), making MM vs DD ordering unambiguous.
 */
const FORMAT_DETECTION_DATE = new Date(2026, 0, 2);

/**
 * Maps bare language codes to their most commonly associated region code (lowercase).
 * Used as a fallback when the locale string has no explicit region subtag
 * (e.g., "ja" → "jp", "en" → "us").
 */
const LANGUAGE_TO_REGION: Record<string, string> = {
  de: "de",
  en: "us",
  fr: "fr",
  es: "es",
  it: "it",
  nl: "nl",
  pt: "pt",
  ru: "ru",
  ja: "jp",
  zh: "cn",
  ko: "kr",
};

/** Regions where Sunday is the first day of the week. */
const SUNDAY_FIRST_REGIONS = new Set([
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
]);

/** Regions using US-style week numbering (Week 1 contains Jan 1). */
const US_WEEK_NUMBERING_REGIONS = new Set(["us", "ca"]);

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Per-language-key caches for getLocaleRegion and getLocaleWeekInfo. Keyed by
 * navigator.language so callers that temporarily change it (e.g. in tests)
 * still receive correct results per distinct language. Avoids redundant Intl
 * construction when detectLocale* functions are called in sequence (e.g. when
 * building DEFAULT_PREFERENCES).
 */
const _regionCache = new Map<string, string | undefined>();
const _weekInfoCache = new Map<string, LocaleWeekInfo | undefined>();

/**
 * Extract the region subtag from navigator.language (lowercase).
 *
 * Handles BCP 47 tags with optional script subtags:
 *   "en-US"      → "us"
 *   "zh-Hans-CN" → "cn"  (skips the 4-letter script subtag)
 *
 * Falls back to LANGUAGE_TO_REGION for bare language codes:
 *   "ja" → "jp", "en" → "us"
 *
 * Returns undefined when no mapping is available.
 */
function getLocaleRegion(): string | undefined {
  const lang = navigator.language;
  if (_regionCache.has(lang)) return _regionCache.get(lang);
  const parts = lang.toLowerCase().split("-");
  // BCP 47: language[-script[-region]]; region is always exactly 2 alpha chars.
  // Skip the language part (index 0) and find the first 2-letter subtag.
  const region = parts.slice(1).find((p) => /^[a-z]{2}$/.test(p));
  const result = region ?? LANGUAGE_TO_REGION[parts[0]];
  _regionCache.set(lang, result);
  return result;
}

/**
 * Shape of Intl.Locale.weekInfo / .getWeekInfo() — not yet in all TS lib types.
 * firstDay: 1 = Monday … 7 = Sunday (ISO weekday numbering).
 * minimalDays: minimum days of the year's first week (ISO = 4, US = 1).
 */
interface LocaleWeekInfo {
  firstDay?: number;
  minimalDays?: number;
  weekend?: number[];
}

/**
 * Retrieve weekInfo from Intl.Locale.
 * Returns undefined if the API is unavailable or throws.
 */
function getLocaleWeekInfo(): LocaleWeekInfo | undefined {
  const lang = navigator.language;
  if (_weekInfoCache.has(lang)) return _weekInfoCache.get(lang);
  let result: LocaleWeekInfo | undefined;
  try {
    // Cast to a typed shape that mirrors the actual API; getWeekInfo() / weekInfo
    // are not yet in all TS lib types.
    const localeObj = new Intl.Locale(lang) as unknown as {
      getWeekInfo?: () => LocaleWeekInfo;
      weekInfo?: LocaleWeekInfo;
    };
    result =
      typeof localeObj.getWeekInfo === "function"
        ? localeObj.getWeekInfo()
        : localeObj.weekInfo;
  } catch {
    result = undefined;
  }
  _weekInfoCache.set(lang, result);
  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Detect locale-based date format from browser.
 * Uses Intl.DateTimeFormat.formatToParts() with region-based fallback.
 */
export function detectLocaleDateFormat(): DateFormat {
  // Modern: analyze Intl.DateTimeFormat part order
  try {
    const parts = new Intl.DateTimeFormat(navigator.language, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(FORMAT_DETECTION_DATE);
    const order = parts
      .filter((p) => ["year", "month", "day"].includes(p.type))
      .map((p) => p.type);
    if (order[0] === "month") return "MM/DD/YYYY";
    if (order[0] === "year") return "YYYY-MM-DD";
    return "DD/MM/YYYY";
  } catch {
    // Intl.DateTimeFormat.formatToParts() unavailable; fall through to region-based mapping
  }

  const region = getLocaleRegion();
  if (region === "us") return "MM/DD/YYYY";
  if (region === "jp" || region === "cn" || region === "kr")
    return "YYYY-MM-DD";
  return "DD/MM/YYYY";
}

/**
 * Detect first day of week from browser locale.
 * Uses Intl.Locale.getWeekInfo() with region-based fallback.
 */
export function detectLocaleFirstDayOfWeek(): FirstDayOfWeek {
  const weekInfo = getLocaleWeekInfo();
  if (weekInfo) {
    if (weekInfo.firstDay === 7) return "sunday";
    if (weekInfo.firstDay === 1) return "monday";
    // firstDay values 2–6 (Tue–Sat as week start) fall through to the
    // region-based fallback. FirstDayOfWeek only supports 'monday' | 'sunday'.
  }

  const region = getLocaleRegion();
  if (region && SUNDAY_FIRST_REGIONS.has(region)) return "sunday";
  return "monday";
}

/**
 * Detect week numbering system from browser locale.
 * Uses Intl.Locale.getWeekInfo().minimalDays with region-based fallback.
 */
export function detectLocaleWeekNumberingSystem(): WeekNumberingSystem {
  const weekInfo = getLocaleWeekInfo();
  if (weekInfo) {
    if (weekInfo.minimalDays === 1) return "us";
    if (weekInfo.minimalDays === 4) return "iso";
  }

  const region = getLocaleRegion();
  if (region && US_WEEK_NUMBERING_REGIONS.has(region)) return "us";
  return "iso";
}

/**
 * Detect holiday region from browser locale.
 * @returns ISO 3166-1 alpha-2 country code (uppercase)
 */
export function detectLocaleHolidayRegion(): string {
  const region = getLocaleRegion();
  return region ? region.toUpperCase() : "US";
}

/**
 * Default preferences for new users, computed once at module load from the
 * browser's `navigator.language`. Requires a browser environment; do not
 * import this module outside of a browser context.
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  uiDensity: "normal",
  hideUI: false,
  dateFormat: detectLocaleDateFormat(),
  firstDayOfWeek: detectLocaleFirstDayOfWeek(),
  weekNumberingSystem: detectLocaleWeekNumberingSystem(),
};
