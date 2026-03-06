import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  detectLocaleDateFormat,
  detectLocaleFirstDayOfWeek,
  detectLocaleWeekNumberingSystem,
  detectLocaleHolidayRegion,
} from "../../../src/utils/localeDetection";

function setLanguage(lang: string): void {
  Object.defineProperty(navigator, "language", {
    get: () => lang,
    configurable: true,
  });
}

// ─── detectLocaleHolidayRegion ────────────────────────────────────────────────
// Pure region-parsing logic; no Intl dependency — straightforward to test.

describe("detectLocaleHolidayRegion", () => {
  it("extracts region from a full locale (en-US → US)", () => {
    setLanguage("en-US");
    expect(detectLocaleHolidayRegion()).toBe("US");
  });

  it("extracts region from a full locale (de-AT → AT)", () => {
    setLanguage("de-AT");
    expect(detectLocaleHolidayRegion()).toBe("AT");
  });

  it("maps bare language to country (de → DE)", () => {
    setLanguage("de");
    expect(detectLocaleHolidayRegion()).toBe("DE");
  });

  it("maps bare language to country (ja → JP)", () => {
    setLanguage("ja");
    expect(detectLocaleHolidayRegion()).toBe("JP");
  });

  it("maps bare language to country (zh → CN)", () => {
    setLanguage("zh");
    expect(detectLocaleHolidayRegion()).toBe("CN");
  });

  it("skips BCP 47 script subtag and extracts region (zh-Hans-CN → CN)", () => {
    setLanguage("zh-Hans-CN");
    expect(detectLocaleHolidayRegion()).toBe("CN");
  });

  it("skips BCP 47 script subtag (zh-Hant-TW → TW)", () => {
    setLanguage("zh-Hant-TW");
    expect(detectLocaleHolidayRegion()).toBe("TW");
  });

  it("defaults to US for an unknown bare language", () => {
    setLanguage("xx");
    expect(detectLocaleHolidayRegion()).toBe("US");
  });
});

// ─── Fallback-path helpers ────────────────────────────────────────────────────

/**
 * Force the Intl.DateTimeFormat fallback by making formatToParts throw.
 * Returns a restore function.
 */
function mockFormatToPartsThrowing(): () => void {
  const spy = vi
    .spyOn(Intl.DateTimeFormat.prototype, "formatToParts")
    .mockImplementation(() => {
      throw new Error("formatToParts unavailable");
    });
  return () => spy.mockRestore();
}

/**
 * Replace Intl.Locale with a constructor that always throws.
 * Returns a restore function.
 */
function mockIntlLocaleThrowing(): () => void {
  const original = Intl.Locale;
  (globalThis.Intl as Record<string, unknown>).Locale = class {
    constructor() {
      throw new Error("Intl.Locale unavailable");
    }
  };
  return () => {
    (globalThis.Intl as Record<string, unknown>).Locale = original;
  };
}

// ─── detectLocaleDateFormat (fallback path) ───────────────────────────────────

describe("detectLocaleDateFormat (fallback path)", () => {
  let restore: () => void;

  beforeEach(() => {
    restore = mockFormatToPartsThrowing();
  });

  afterEach(() => {
    restore();
  });

  it("returns MM/DD/YYYY for en-US", () => {
    setLanguage("en-US");
    expect(detectLocaleDateFormat()).toBe("MM/DD/YYYY");
  });

  it("returns MM/DD/YYYY for bare en (maps to US via language map)", () => {
    setLanguage("en");
    expect(detectLocaleDateFormat()).toBe("MM/DD/YYYY");
  });

  it("returns YYYY-MM-DD for ja-JP", () => {
    setLanguage("ja-JP");
    expect(detectLocaleDateFormat()).toBe("YYYY-MM-DD");
  });

  it("returns YYYY-MM-DD for bare ja (maps to JP via language map)", () => {
    setLanguage("ja");
    expect(detectLocaleDateFormat()).toBe("YYYY-MM-DD");
  });

  it("returns YYYY-MM-DD for zh-Hans-CN (skips script subtag)", () => {
    setLanguage("zh-Hans-CN");
    expect(detectLocaleDateFormat()).toBe("YYYY-MM-DD");
  });

  it("returns YYYY-MM-DD for ko-KR", () => {
    setLanguage("ko-KR");
    expect(detectLocaleDateFormat()).toBe("YYYY-MM-DD");
  });

  it("returns DD/MM/YYYY for de-DE", () => {
    setLanguage("de-DE");
    expect(detectLocaleDateFormat()).toBe("DD/MM/YYYY");
  });

  it("returns DD/MM/YYYY for en-GB (not US, not Asian)", () => {
    setLanguage("en-GB");
    expect(detectLocaleDateFormat()).toBe("DD/MM/YYYY");
  });

  it("returns DD/MM/YYYY for unknown locale", () => {
    setLanguage("xx-XX");
    expect(detectLocaleDateFormat()).toBe("DD/MM/YYYY");
  });
});

// ─── detectLocaleFirstDayOfWeek (fallback path) ───────────────────────────────

describe("detectLocaleFirstDayOfWeek (fallback path)", () => {
  let restore: () => void;

  beforeEach(() => {
    restore = mockIntlLocaleThrowing();
  });

  afterEach(() => {
    restore();
  });

  it("returns sunday for en-US", () => {
    setLanguage("en-US");
    expect(detectLocaleFirstDayOfWeek()).toBe("sunday");
  });

  it("returns sunday for en-CA", () => {
    setLanguage("en-CA");
    expect(detectLocaleFirstDayOfWeek()).toBe("sunday");
  });

  it("returns sunday for ja-JP", () => {
    setLanguage("ja-JP");
    expect(detectLocaleFirstDayOfWeek()).toBe("sunday");
  });

  it("returns sunday for bare ja (maps to JP via language map)", () => {
    setLanguage("ja");
    expect(detectLocaleFirstDayOfWeek()).toBe("sunday");
  });

  it("returns sunday for zh-Hans-TW (script subtag skipped, TW is Sunday-first)", () => {
    setLanguage("zh-Hans-TW");
    expect(detectLocaleFirstDayOfWeek()).toBe("sunday");
  });

  it("returns monday for de-DE", () => {
    setLanguage("de-DE");
    expect(detectLocaleFirstDayOfWeek()).toBe("monday");
  });

  it("returns monday for en-GB", () => {
    setLanguage("en-GB");
    expect(detectLocaleFirstDayOfWeek()).toBe("monday");
  });

  it("does NOT treat Catalan (ca) as Canada — returns monday", () => {
    // Old substring-matching bug: 'ca'.includes('ca') was true, making Catalan
    // users appear to be in Canada. Now we use explicit region/language mapping.
    setLanguage("ca");
    expect(detectLocaleFirstDayOfWeek()).toBe("monday");
  });

  it("does NOT treat ca-ES (Catalan in Spain) as Canada — returns monday", () => {
    setLanguage("ca-ES");
    expect(detectLocaleFirstDayOfWeek()).toBe("monday");
  });

  it("returns monday for unknown locale", () => {
    setLanguage("xx");
    expect(detectLocaleFirstDayOfWeek()).toBe("monday");
  });
});

// ─── detectLocaleWeekNumberingSystem (fallback path) ─────────────────────────

describe("detectLocaleWeekNumberingSystem (fallback path)", () => {
  let restore: () => void;

  beforeEach(() => {
    restore = mockIntlLocaleThrowing();
  });

  afterEach(() => {
    restore();
  });

  it("returns us for en-US", () => {
    setLanguage("en-US");
    expect(detectLocaleWeekNumberingSystem()).toBe("us");
  });

  it("returns us for en-CA", () => {
    setLanguage("en-CA");
    expect(detectLocaleWeekNumberingSystem()).toBe("us");
  });

  it("returns iso for de-DE", () => {
    setLanguage("de-DE");
    expect(detectLocaleWeekNumberingSystem()).toBe("iso");
  });

  it("returns iso for en-GB", () => {
    setLanguage("en-GB");
    expect(detectLocaleWeekNumberingSystem()).toBe("iso");
  });

  it("returns iso for ja-JP", () => {
    setLanguage("ja-JP");
    expect(detectLocaleWeekNumberingSystem()).toBe("iso");
  });

  it("returns iso for unknown locale", () => {
    setLanguage("xx");
    expect(detectLocaleWeekNumberingSystem()).toBe("iso");
  });
});
