/**
 * Unit tests for preferencesOptions config.
 * Verifies that derived DropdownOption arrays are consistent with their
 * extended counterparts and that format examples are correctly constructed.
 */

import { describe, it, expect } from "vitest";
import {
  DENSITY_OPTIONS,
  DENSITY_OPTIONS_EXTENDED,
  DATE_FORMAT_OPTIONS,
  DATE_FORMAT_OPTIONS_EXTENDED,
  FIRST_DAY_OF_WEEK_OPTIONS,
  FIRST_DAY_OF_WEEK_OPTIONS_EXTENDED,
  WEEK_NUMBERING_OPTIONS,
  WEEK_NUMBERING_OPTIONS_EXTENDED,
  LABEL_OPTIONS,
} from "../../../src/config/preferencesOptions";
import type { TaskLabelPosition } from "../../../src/types/preferences.types";

describe("DENSITY_OPTIONS", () => {
  it("should contain the same number of entries as DENSITY_OPTIONS_EXTENDED", () => {
    expect(DENSITY_OPTIONS.length).toBe(DENSITY_OPTIONS_EXTENDED.length);
  });

  it("should contain compact, normal, and comfortable", () => {
    const values = DENSITY_OPTIONS.map((o) => o.value);
    expect(values).toContain("compact");
    expect(values).toContain("normal");
    expect(values).toContain("comfortable");
  });

  it("should have matching value/label pairs with extended options", () => {
    DENSITY_OPTIONS.forEach((opt, i) => {
      expect(opt.value).toBe(DENSITY_OPTIONS_EXTENDED[i].value);
      expect(opt.label).toBe(DENSITY_OPTIONS_EXTENDED[i].label);
    });
  });

  it("should include rowsExample with px unit in extended options", () => {
    DENSITY_OPTIONS_EXTENDED.forEach((opt) => {
      expect(opt.rowsExample).toMatch(/^\d+px rows$/);
    });
  });
});

describe("DATE_FORMAT_OPTIONS", () => {
  it("should contain the same number of entries as DATE_FORMAT_OPTIONS_EXTENDED", () => {
    expect(DATE_FORMAT_OPTIONS.length).toBe(DATE_FORMAT_OPTIONS_EXTENDED.length);
  });

  it("should contain DD/MM/YYYY, MM/DD/YYYY, and YYYY-MM-DD", () => {
    const values = DATE_FORMAT_OPTIONS.map((o) => o.value);
    expect(values).toContain("DD/MM/YYYY");
    expect(values).toContain("MM/DD/YYYY");
    expect(values).toContain("YYYY-MM-DD");
  });

  it("should have matching value/label pairs with extended options", () => {
    DATE_FORMAT_OPTIONS.forEach((opt, i) => {
      expect(opt.value).toBe(DATE_FORMAT_OPTIONS_EXTENDED[i].value);
      expect(opt.label).toBe(DATE_FORMAT_OPTIONS_EXTENDED[i].label);
    });
  });

  it("should produce unambiguous examples (day 31 ≠ month 12)", () => {
    // Dec 31, 2026 — the sentinel date used in the module
    const ddMmYyyyOpt = DATE_FORMAT_OPTIONS_EXTENDED.find(
      (o) => o.value === "DD/MM/YYYY"
    )!;
    const mmDdYyyyOpt = DATE_FORMAT_OPTIONS_EXTENDED.find(
      (o) => o.value === "MM/DD/YYYY"
    )!;
    const isoOpt = DATE_FORMAT_OPTIONS_EXTENDED.find(
      (o) => o.value === "YYYY-MM-DD"
    )!;

    expect(ddMmYyyyOpt.example).toBe("31/12/2026");
    expect(mmDdYyyyOpt.example).toBe("12/31/2026");
    expect(isoOpt.example).toBe("2026-12-31");
  });
});

describe("FIRST_DAY_OF_WEEK_OPTIONS", () => {
  it("should contain the same number of entries as FIRST_DAY_OF_WEEK_OPTIONS_EXTENDED", () => {
    expect(FIRST_DAY_OF_WEEK_OPTIONS.length).toBe(
      FIRST_DAY_OF_WEEK_OPTIONS_EXTENDED.length
    );
  });

  it("should contain sunday and monday", () => {
    const values = FIRST_DAY_OF_WEEK_OPTIONS.map((o) => o.value);
    expect(values).toContain("sunday");
    expect(values).toContain("monday");
  });
});

describe("WEEK_NUMBERING_OPTIONS", () => {
  it("should contain the same number of entries as WEEK_NUMBERING_OPTIONS_EXTENDED", () => {
    expect(WEEK_NUMBERING_OPTIONS.length).toBe(
      WEEK_NUMBERING_OPTIONS_EXTENDED.length
    );
  });

  it("should contain iso and us", () => {
    const values = WEEK_NUMBERING_OPTIONS.map((o) => o.value);
    expect(values).toContain("iso");
    expect(values).toContain("us");
  });
});

describe("LABEL_OPTIONS", () => {
  it("should contain all four TaskLabelPosition values", () => {
    const expectedValues: TaskLabelPosition[] = [
      "before",
      "inside",
      "after",
      "none",
    ];
    const values = LABEL_OPTIONS.map((o) => o.value);
    expectedValues.forEach((v) => {
      expect(values).toContain(v);
    });
  });

  it("should have exactly 4 options", () => {
    expect(LABEL_OPTIONS.length).toBe(4);
  });

  it("should have non-empty labels for all options", () => {
    LABEL_OPTIONS.forEach((opt) => {
      expect(opt.label.length).toBeGreaterThan(0);
    });
  });
});
