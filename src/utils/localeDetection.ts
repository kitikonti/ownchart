/**
 * Locale detection utilities for user preferences.
 * Detects date format, first day of week, week numbering system,
 * and holiday region from the browser locale.
 */

import type {
  DateFormat,
  FirstDayOfWeek,
  WeekNumberingSystem,
  UserPreferences,
} from "../types/preferences.types";

/**
 * Detect locale-based date format from browser.
 * Uses Intl.DateTimeFormat.formatToParts() with hardcoded fallback.
 */
export function detectLocaleDateFormat(): DateFormat {
  // Modern: analyze Intl.DateTimeFormat part order
  try {
    const parts = new Intl.DateTimeFormat(navigator.language, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(2026, 0, 2));
    const order = parts
      .filter((p) => ["year", "month", "day"].includes(p.type))
      .map((p) => p.type);
    if (order[0] === "month") return "MM/DD/YYYY";
    if (order[0] === "year") return "YYYY-MM-DD";
    return "DD/MM/YYYY";
  } catch {
    // Intl.DateTimeFormat.formatToParts() unavailable; fall through to hardcoded mapping
  }

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
 * Detect first day of week from browser locale.
 * Uses Intl.Locale.getWeekInfo() with hardcoded fallback.
 */
export function detectLocaleFirstDayOfWeek(): FirstDayOfWeek {
  // Modern: use Intl.Locale weekInfo (not yet in all TS lib types)
  try {
    const localeObj = new Intl.Locale(navigator.language) as unknown as Record<
      string,
      unknown
    >;
    const weekInfo =
      typeof localeObj.getWeekInfo === "function"
        ? (localeObj.getWeekInfo as () => Record<string, unknown>)()
        : (localeObj.weekInfo as Record<string, unknown> | undefined);
    if (weekInfo && typeof weekInfo === "object") {
      const firstDay = weekInfo.firstDay as number | undefined;
      if (firstDay === 7) return "sunday";
      if (firstDay === 1) return "monday";
    }
  } catch {
    // Intl.Locale.getWeekInfo() unavailable; fall through to hardcoded mapping
  }

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
 * Detect week numbering system from browser locale.
 * Uses Intl.Locale.getWeekInfo().minimalDays with hardcoded fallback.
 */
export function detectLocaleWeekNumberingSystem(): WeekNumberingSystem {
  // Modern: use Intl.Locale weekInfo (not yet in all TS lib types)
  try {
    const localeObj = new Intl.Locale(navigator.language) as unknown as Record<
      string,
      unknown
    >;
    const weekInfo =
      typeof localeObj.getWeekInfo === "function"
        ? (localeObj.getWeekInfo as () => Record<string, unknown>)()
        : (localeObj.weekInfo as Record<string, unknown> | undefined);
    if (weekInfo && typeof weekInfo === "object") {
      const minimalDays = weekInfo.minimalDays as number | undefined;
      if (minimalDays === 1) return "us";
      if (minimalDays === 4) return "iso";
    }
  } catch {
    // Intl.Locale.getWeekInfo() unavailable; fall through to hardcoded mapping
  }

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
 * @returns ISO 3166-1 alpha-2 country code
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
 * Default preferences for new users.
 * Uses locale detection for regional settings.
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  uiDensity: "normal",
  dateFormat: detectLocaleDateFormat(),
  firstDayOfWeek: detectLocaleFirstDayOfWeek(),
  weekNumberingSystem: detectLocaleWeekNumberingSystem(),
};
