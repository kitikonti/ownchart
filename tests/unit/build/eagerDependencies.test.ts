/**
 * Build guard tests: Eager dependency chain verification
 *
 * date-holidays is a large library (1.3 MB) used synchronously in store actions
 * (chartSlice), useMemo hooks (GridLines), and working days calculation.
 * It MUST be loaded eagerly at app startup — lazy-loading it would cause race
 * conditions and break synchronous consumers.
 *
 * These tests verify the static import chain that guarantees eager loading:
 *   App entry → chartSlice → holidayService → date-holidays
 *
 * If any link becomes a dynamic import(), the chunk moves to lazy loading
 * and holiday-dependent features break silently at runtime.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../../..");

function readSource(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf-8");
}

describe("date-holidays eager loading chain", () => {
  it("holidayService.ts must statically import date-holidays", () => {
    const source = readSource("src/services/holidayService.ts");

    // Must have a static import (top-level `import ... from "date-holidays"`)
    expect(source).toMatch(/^import\s+.+from\s+["']date-holidays["']/m);

    // Must NOT use dynamic import() for date-holidays
    expect(source).not.toMatch(/import\(\s*["']date-holidays["']\s*\)/);
  });

  it("chartSlice.ts must statically import holidayService", () => {
    const source = readSource("src/store/slices/chartSlice.ts");

    // chartSlice is loaded at app startup — if it statically imports
    // holidayService, the entire chain is eagerly loaded
    expect(source).toMatch(
      /^import\s+.*holidayService.*from\s+["'].*holidayService["']/m
    );

    // Must NOT dynamically import holidayService
    expect(source).not.toMatch(/import\(\s*["'].*holidayService["']\s*\)/);
  });

  it("no source file should dynamically import holidayService", () => {
    // These are all files that import holidayService — if any switches to
    // dynamic import(), the service may not be ready when needed synchronously
    const consumers = [
      "src/store/slices/chartSlice.ts",
      "src/components/GanttChart/GridLines.tsx",
      "src/components/Ribbon/HolidayRegionPopover.tsx",
      "src/components/Ribbon/WorkingDaysDropdown.tsx",
      "src/utils/workingDaysCalculator.ts",
    ];

    for (const file of consumers) {
      const source = readSource(file);
      expect(source, `${file} must not dynamically import holidayService`).not.toMatch(
        /import\(\s*["'].*holidayService["']\s*\)/
      );
    }
  });

  it("vite.config.ts must include date-holidays in manualChunks", () => {
    const source = readSource("vite.config.ts");

    // date-holidays should be in a named chunk to prevent Rollup from
    // accidentally merging it into a lazy chunk
    expect(source).toMatch(/manualChunks/);
    expect(source).toMatch(/['"]date-holidays['"]/);
  });
});
