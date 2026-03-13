/**
 * Unit tests for export types and defaults
 */

import { describe, it, expect } from "vitest";
import {
  PDF_PAGE_SIZES,
  PDF_MARGIN_PRESETS,
  DEFAULT_PDF_OPTIONS,
  DEFAULT_SVG_OPTIONS,
  DEFAULT_EXPORT_OPTIONS,
  DEFAULT_CUSTOM_PAGE_SIZE,
  EXPORT_ZOOM_PRESETS,
  EXPORT_MAX_SAFE_WIDTH,
  EXPORT_ZOOM_MIN,
  EXPORT_ZOOM_MAX,
  DEFAULT_FIT_TO_WIDTH_PX,
  UHD_SCREEN_WIDTH_PX,
  type ExportBooleanKey,
} from "@/utils/export/types";
import { EXPORT_QUICK_PRESETS } from "@/utils/export/pagePresets";

// Compile-time guard: ExportBooleanKey must include exactly these keys.
// If a boolean field is renamed or its type changes, TypeScript will fail here.
type ExpectedBooleanKeys =
  | "includeHeader"
  | "includeTodayMarker"
  | "includeDependencies"
  | "includeGridLines"
  | "includeWeekends"
  | "includeHolidays";

// Both directions must hold for the sets to be equal.
type BooleanKeyCoversExpected = ExpectedBooleanKeys extends ExportBooleanKey
  ? true
  : false;
type ExpectedCoversBooleanKey = ExportBooleanKey extends ExpectedBooleanKeys
  ? true
  : false;

// These will produce a TypeScript error at compile time if the sets diverge.
const _booleanKeyCheck1: BooleanKeyCoversExpected = true;
const _booleanKeyCheck2: ExpectedCoversBooleanKey = true;
// Suppress "unused variable" warnings — the value is never read at runtime.
void _booleanKeyCheck1;
void _booleanKeyCheck2;

describe("export types", () => {
  describe("PDF_PAGE_SIZES", () => {
    it("contains A4 dimensions", () => {
      expect(PDF_PAGE_SIZES.a4).toEqual({ width: 297, height: 210 });
    });

    it("contains A3 dimensions", () => {
      expect(PDF_PAGE_SIZES.a3).toEqual({ width: 420, height: 297 });
    });

    it("contains Letter dimensions", () => {
      expect(PDF_PAGE_SIZES.letter).toEqual({ width: 279, height: 216 });
    });

    it("contains Legal dimensions", () => {
      expect(PDF_PAGE_SIZES.legal).toEqual({ width: 356, height: 216 });
    });

    it("contains Tabloid dimensions", () => {
      expect(PDF_PAGE_SIZES.tabloid).toEqual({ width: 432, height: 279 });
    });

    it("contains A2 dimensions", () => {
      expect(PDF_PAGE_SIZES.a2).toEqual({ width: 594, height: 420 });
    });

    it("contains A1 dimensions", () => {
      expect(PDF_PAGE_SIZES.a1).toEqual({ width: 841, height: 594 });
    });

    it("contains A0 dimensions", () => {
      expect(PDF_PAGE_SIZES.a0).toEqual({ width: 1189, height: 841 });
    });

    it("has all sizes in landscape orientation (width > height)", () => {
      Object.values(PDF_PAGE_SIZES).forEach((dims) => {
        expect(dims.width).toBeGreaterThan(dims.height);
      });
    });
  });

  describe("DEFAULT_CUSTOM_PAGE_SIZE", () => {
    it("has generous landscape canvas width of 500 mm", () => {
      expect(DEFAULT_CUSTOM_PAGE_SIZE.width).toBe(500);
    });

    it("has canvas height of 300 mm", () => {
      expect(DEFAULT_CUSTOM_PAGE_SIZE.height).toBe(300);
    });

    it("is larger than A4 landscape to serve as a wide canvas fallback", () => {
      expect(DEFAULT_CUSTOM_PAGE_SIZE.width).toBeGreaterThan(
        PDF_PAGE_SIZES.a4.width
      );
    });
  });

  describe("PDF_MARGIN_PRESETS", () => {
    it("contains normal margins", () => {
      expect(PDF_MARGIN_PRESETS.normal).toEqual({
        top: 10,
        bottom: 10,
        left: 15,
        right: 15,
      });
    });

    it("contains narrow margins", () => {
      expect(PDF_MARGIN_PRESETS.narrow).toEqual({
        top: 5,
        bottom: 5,
        left: 5,
        right: 5,
      });
    });

    it("contains wide margins", () => {
      expect(PDF_MARGIN_PRESETS.wide).toEqual({
        top: 20,
        bottom: 20,
        left: 25,
        right: 25,
      });
    });

    it("contains none (zero) margins", () => {
      expect(PDF_MARGIN_PRESETS.none).toEqual({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      });
    });

    it("contains custom default margins", () => {
      expect(PDF_MARGIN_PRESETS.custom).toBeDefined();
    });
  });

  describe("DEFAULT_PDF_OPTIONS", () => {
    it("has A4 as default page size", () => {
      expect(DEFAULT_PDF_OPTIONS.pageSize).toBe("a4");
    });

    it("has landscape as default orientation", () => {
      expect(DEFAULT_PDF_OPTIONS.orientation).toBe("landscape");
    });

    it("has default custom page size", () => {
      expect(DEFAULT_PDF_OPTIONS.customPageSize).toEqual({
        width: 500,
        height: 300,
      });
    });

    it("has normal as default margin preset", () => {
      expect(DEFAULT_PDF_OPTIONS.marginPreset).toBe("normal");
    });

    it("has header configuration", () => {
      expect(DEFAULT_PDF_OPTIONS.header).toBeDefined();
      expect(DEFAULT_PDF_OPTIONS.header.showProjectName).toBe(true);
      expect(DEFAULT_PDF_OPTIONS.header.showAuthor).toBe(false);
      expect(DEFAULT_PDF_OPTIONS.header.showExportDate).toBe(false);
    });

    it("has footer configuration", () => {
      expect(DEFAULT_PDF_OPTIONS.footer).toBeDefined();
      expect(DEFAULT_PDF_OPTIONS.footer.showProjectName).toBe(false);
      expect(DEFAULT_PDF_OPTIONS.footer.showAuthor).toBe(false);
      expect(DEFAULT_PDF_OPTIONS.footer.showExportDate).toBe(false);
    });

    it("has metadata object", () => {
      expect(DEFAULT_PDF_OPTIONS.metadata).toBeDefined();
    });
  });

  describe("DEFAULT_SVG_OPTIONS", () => {
    it("has auto as default dimension mode", () => {
      expect(DEFAULT_SVG_OPTIONS.dimensionMode).toBe("auto");
    });

    it("preserves aspect ratio by default", () => {
      expect(DEFAULT_SVG_OPTIONS.preserveAspectRatio).toBe(true);
    });

    it("uses text mode by default", () => {
      expect(DEFAULT_SVG_OPTIONS.textMode).toBe("text");
    });

    it("uses inline styles by default", () => {
      expect(DEFAULT_SVG_OPTIONS.styleMode).toBe("inline");
    });

    it("has optimization disabled by default", () => {
      expect(DEFAULT_SVG_OPTIONS.optimize).toBe(false);
    });

    it("has background disabled by default", () => {
      expect(DEFAULT_SVG_OPTIONS.includeBackground).toBe(false);
    });

    it("has responsive mode disabled by default", () => {
      expect(DEFAULT_SVG_OPTIONS.responsiveMode).toBe(false);
    });

    it("has accessibility enabled by default", () => {
      expect(DEFAULT_SVG_OPTIONS.includeAccessibility).toBe(true);
    });

    it("has copy to clipboard disabled by default", () => {
      expect(DEFAULT_SVG_OPTIONS.copyToClipboard).toBe(false);
    });
  });

  describe("DEFAULT_EXPORT_OPTIONS", () => {
    it("has currentView as default zoom mode", () => {
      expect(DEFAULT_EXPORT_OPTIONS.zoomMode).toBe("currentView");
    });

    it("has all as default date range mode", () => {
      expect(DEFAULT_EXPORT_OPTIONS.dateRangeMode).toBe("all");
    });

    it("has empty selected columns by default", () => {
      expect(DEFAULT_EXPORT_OPTIONS.selectedColumns).toEqual([]);
    });

    it("includes header by default", () => {
      expect(DEFAULT_EXPORT_OPTIONS.includeHeader).toBe(true);
    });

    it("includes today marker by default", () => {
      expect(DEFAULT_EXPORT_OPTIONS.includeTodayMarker).toBe(true);
    });

    it("includes dependencies by default", () => {
      expect(DEFAULT_EXPORT_OPTIONS.includeDependencies).toBe(true);
    });

    it("includes grid lines by default", () => {
      expect(DEFAULT_EXPORT_OPTIONS.includeGridLines).toBe(true);
    });

    it("includes weekends by default", () => {
      expect(DEFAULT_EXPORT_OPTIONS.includeWeekends).toBe(true);
    });

    it("includes holidays by default", () => {
      expect(DEFAULT_EXPORT_OPTIONS.includeHolidays).toBe(true);
    });

    it("has white background by default", () => {
      expect(DEFAULT_EXPORT_OPTIONS.background).toBe("white");
    });

    it("uses inside task label position", () => {
      expect(DEFAULT_EXPORT_OPTIONS.taskLabelPosition).toBe("inside");
    });

    it("uses comfortable density", () => {
      expect(DEFAULT_EXPORT_OPTIONS.density).toBe("comfortable");
    });
  });

  describe("EXPORT_ZOOM_PRESETS", () => {
    it("has compact preset at 0.5", () => {
      expect(EXPORT_ZOOM_PRESETS.COMPACT).toBe(0.5);
    });

    it("has standard preset at 1.0", () => {
      expect(EXPORT_ZOOM_PRESETS.STANDARD).toBe(1.0);
    });

    it("has detailed preset at 1.5", () => {
      expect(EXPORT_ZOOM_PRESETS.DETAILED).toBe(1.5);
    });

    it("has expanded preset at 2.0", () => {
      expect(EXPORT_ZOOM_PRESETS.EXPANDED).toBe(2.0);
    });
  });

  describe("export constants", () => {
    it("has reasonable max safe width", () => {
      expect(EXPORT_MAX_SAFE_WIDTH).toBe(16384);
    });

    it("has positive zoom min", () => {
      expect(EXPORT_ZOOM_MIN).toBeGreaterThan(0);
      expect(EXPORT_ZOOM_MIN).toBeLessThan(1);
    });

    it("has zoom max greater than 1", () => {
      expect(EXPORT_ZOOM_MAX).toBeGreaterThan(1);
    });

    it("has zoom min less than zoom max", () => {
      expect(EXPORT_ZOOM_MIN).toBeLessThan(EXPORT_ZOOM_MAX);
    });
  });

  describe("EXPORT_QUICK_PRESETS", () => {
    it("contains exactly 5 presets", () => {
      expect(EXPORT_QUICK_PRESETS).toHaveLength(5);
    });

    it("has unique keys across all presets", () => {
      const keys = EXPORT_QUICK_PRESETS.map((p) => p.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("all presets have positive targetWidth", () => {
      EXPORT_QUICK_PRESETS.forEach((preset) => {
        expect(preset.targetWidth).toBeGreaterThan(0);
      });
    });

    it("all presets have non-empty label and description", () => {
      EXPORT_QUICK_PRESETS.forEach((preset) => {
        expect(preset.label.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
      });
    });

    it("A4 landscape preset has wider targetWidth than A4 portrait would (landscape is wider)", () => {
      const a4 = EXPORT_QUICK_PRESETS.find((p) => p.key === "a4-landscape");
      expect(a4).toBeDefined();
      // A4 landscape at 150 DPI: (297 mm / 25.4) * 150 ≈ 1754 px
      expect(a4!.targetWidth).toBeGreaterThan(1700);
      expect(a4!.targetWidth).toBeLessThan(1800);
    });

    it("A3 landscape preset has larger targetWidth than A4 landscape (A3 is bigger)", () => {
      const a4 = EXPORT_QUICK_PRESETS.find((p) => p.key === "a4-landscape");
      const a3 = EXPORT_QUICK_PRESETS.find((p) => p.key === "a3-landscape");
      expect(a4).toBeDefined();
      expect(a3).toBeDefined();
      expect(a3!.targetWidth).toBeGreaterThan(a4!.targetWidth);
    });

    it("HD screen preset uses DEFAULT_FIT_TO_WIDTH_PX as targetWidth", () => {
      const hd = EXPORT_QUICK_PRESETS.find((p) => p.key === "hd-screen");
      expect(hd).toBeDefined();
      expect(hd!.targetWidth).toBe(DEFAULT_FIT_TO_WIDTH_PX);
    });

    it("4K screen preset uses UHD_SCREEN_WIDTH_PX as targetWidth", () => {
      const uhd = EXPORT_QUICK_PRESETS.find((p) => p.key === "4k-screen");
      expect(uhd).toBeDefined();
      expect(uhd!.targetWidth).toBe(UHD_SCREEN_WIDTH_PX);
    });

    it("screen presets have larger targetWidth than A4 landscape", () => {
      const a4 = EXPORT_QUICK_PRESETS.find((p) => p.key === "a4-landscape");
      const hd = EXPORT_QUICK_PRESETS.find((p) => p.key === "hd-screen");
      const uhd = EXPORT_QUICK_PRESETS.find((p) => p.key === "4k-screen");
      expect(a4).toBeDefined();
      expect(hd).toBeDefined();
      expect(uhd).toBeDefined();
      // 4K is wider than HD
      expect(uhd!.targetWidth).toBeGreaterThan(hd!.targetWidth);
      // HD is wider than A4 landscape at 150 DPI
      expect(hd!.targetWidth).toBeGreaterThan(a4!.targetWidth);
    });
  });
});
