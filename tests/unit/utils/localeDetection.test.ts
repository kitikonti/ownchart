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

// ─── Primary (Intl API) path helpers ─────────────────────────────────────────

/**
 * Mock formatToParts to return a controlled part ordering.
 * Returns a restore function.
 */
function mockFormatToPartsReturning(parts: Intl.DateTimeFormatPart[]): () => void {
  const spy = vi
    .spyOn(Intl.DateTimeFormat.prototype, "formatToParts")
    .mockReturnValue(parts);
  return () => spy.mockRestore();
}

/**
 * Replace Intl.Locale with a class whose instances expose getWeekInfo() as a
 * function — the modern API path in getLocaleWeekInfo().
 * Returns a restore function.
 */
function mockIntlLocaleGetWeekInfo(weekInfo: {
  firstDay?: number;
  minimalDays?: number;
}): () => void {
  const original = Intl.Locale;
  (globalThis.Intl as Record<string, unknown>).Locale = class {
    constructor() {}
    getWeekInfo() {
      return weekInfo;
    }
  };
  return () => {
    (globalThis.Intl as Record<string, unknown>).Locale = original;
  };
}

/**
 * Replace Intl.Locale with a class whose instances expose weekInfo as a
 * property — the legacy API path in getLocaleWeekInfo().
 * Returns a restore function.
 */
function mockIntlLocaleWeekInfoProp(weekInfo: {
  firstDay?: number;
  minimalDays?: number;
}): () => void {
  const original = Intl.Locale;
  (globalThis.Intl as Record<string, unknown>).Locale = class {
    constructor() {}
    weekInfo = weekInfo;
  };
  return () => {
    (globalThis.Intl as Record<string, unknown>).Locale = original;
  };
}

// ─── detectLocaleDateFormat (primary Intl path) ───────────────────────────────

describe("detectLocaleDateFormat (primary Intl path)", () => {
  let restore: () => void;
  afterEach(() => restore());

  it("returns MM/DD/YYYY when Intl reports month-first ordering", () => {
    restore = mockFormatToPartsReturning([
      { type: "month", value: "01" },
      { type: "literal", value: "/" },
      { type: "day", value: "02" },
      { type: "literal", value: "/" },
      { type: "year", value: "2026" },
    ]);
    setLanguage("en-US");
    expect(detectLocaleDateFormat()).toBe("MM/DD/YYYY");
  });

  it("returns YYYY-MM-DD when Intl reports year-first ordering", () => {
    restore = mockFormatToPartsReturning([
      { type: "year", value: "2026" },
      { type: "literal", value: "-" },
      { type: "month", value: "01" },
      { type: "literal", value: "-" },
      { type: "day", value: "02" },
    ]);
    setLanguage("ja-JP");
    expect(detectLocaleDateFormat()).toBe("YYYY-MM-DD");
  });

  it("returns DD/MM/YYYY when Intl reports day-first ordering", () => {
    restore = mockFormatToPartsReturning([
      { type: "day", value: "02" },
      { type: "literal", value: "." },
      { type: "month", value: "01" },
      { type: "literal", value: "." },
      { type: "year", value: "2026" },
    ]);
    setLanguage("de-DE");
    expect(detectLocaleDateFormat()).toBe("DD/MM/YYYY");
  });
});

// ─── detectLocaleFirstDayOfWeek (primary Intl path) ───────────────────────────

describe("detectLocaleFirstDayOfWeek (primary Intl path — getWeekInfo function)", () => {
  let restore: () => void;
  afterEach(() => restore());

  it("returns sunday when getWeekInfo().firstDay === 7", () => {
    setLanguage("en-US");
    restore = mockIntlLocaleGetWeekInfo({ firstDay: 7 });
    expect(detectLocaleFirstDayOfWeek()).toBe("sunday");
  });

  it("returns monday when getWeekInfo().firstDay === 1", () => {
    setLanguage("de-DE");
    restore = mockIntlLocaleGetWeekInfo({ firstDay: 1 });
    expect(detectLocaleFirstDayOfWeek()).toBe("monday");
  });

  it("falls back to region when getWeekInfo().firstDay is neither 1 nor 7", () => {
    // firstDay 6 = Saturday-first; falls through to region check (us → sunday)
    setLanguage("en-US");
    restore = mockIntlLocaleGetWeekInfo({ firstDay: 6 });
    expect(detectLocaleFirstDayOfWeek()).toBe("sunday");
  });
});

describe("detectLocaleFirstDayOfWeek (primary Intl path — weekInfo property)", () => {
  let restore: () => void;
  afterEach(() => restore());

  it("returns sunday when weekInfo.firstDay === 7 (property API)", () => {
    setLanguage("en-US");
    restore = mockIntlLocaleWeekInfoProp({ firstDay: 7 });
    expect(detectLocaleFirstDayOfWeek()).toBe("sunday");
  });

  it("returns monday when weekInfo.firstDay === 1 (property API)", () => {
    setLanguage("de-DE");
    restore = mockIntlLocaleWeekInfoProp({ firstDay: 1 });
    expect(detectLocaleFirstDayOfWeek()).toBe("monday");
  });
});

// ─── detectLocaleWeekNumberingSystem (primary Intl path) ─────────────────────

describe("detectLocaleWeekNumberingSystem (primary Intl path — getWeekInfo function)", () => {
  let restore: () => void;
  afterEach(() => restore());

  it("returns us when getWeekInfo().minimalDays === 1", () => {
    setLanguage("en-US");
    restore = mockIntlLocaleGetWeekInfo({ minimalDays: 1 });
    expect(detectLocaleWeekNumberingSystem()).toBe("us");
  });

  it("returns iso when getWeekInfo().minimalDays === 4", () => {
    setLanguage("de-DE");
    restore = mockIntlLocaleGetWeekInfo({ minimalDays: 4 });
    expect(detectLocaleWeekNumberingSystem()).toBe("iso");
  });

  it("falls back to region when minimalDays is neither 1 nor 4", () => {
    // minimalDays=2 is not a standard value; falls through to region (us → us)
    setLanguage("en-US");
    restore = mockIntlLocaleGetWeekInfo({ minimalDays: 2 });
    expect(detectLocaleWeekNumberingSystem()).toBe("us");
  });
});

describe("detectLocaleWeekNumberingSystem (primary Intl path — weekInfo property)", () => {
  let restore: () => void;
  afterEach(() => restore());

  it("returns us when weekInfo.minimalDays === 1 (property API)", () => {
    setLanguage("en-US");
    restore = mockIntlLocaleWeekInfoProp({ minimalDays: 1 });
    expect(detectLocaleWeekNumberingSystem()).toBe("us");
  });

  it("returns iso when weekInfo.minimalDays === 4 (property API)", () => {
    setLanguage("de-DE");
    restore = mockIntlLocaleWeekInfoProp({ minimalDays: 4 });
    expect(detectLocaleWeekNumberingSystem()).toBe("iso");
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
