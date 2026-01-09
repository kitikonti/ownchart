/**
 * Unit tests for pdfLayout.ts
 */

import { describe, it, expect } from "vitest";
import {
  mmToPt,
  ptToMm,
  pxToPt,
  ptToPx,
  pxToMm,
  mmToPx,
  getPageDimensions,
  getMargins,
  getPrintableArea,
  calculateScale,
  hexToRgb,
  toGrayscale,
  getColor,
  truncateText,
  PT_PER_MM,
  PT_PER_PX,
  MM_PER_PX,
} from "../../../../src/utils/export/pdfLayout";
import type { PdfExportOptions } from "../../../../src/utils/export/types";

// Default options for testing
const defaultOptions: PdfExportOptions = {
  pageSize: "a4",
  orientation: "landscape",
  marginPreset: "normal",
  header: { showProjectName: false, showExportDate: false },
  footer: { showProjectName: false, showExportDate: false },
  grayscale: false,
  metadata: {},
};

describe("pdfLayout", () => {
  describe("unit conversion functions", () => {
    describe("mmToPt", () => {
      it("converts 0 mm to 0 pt", () => {
        expect(mmToPt(0)).toBe(0);
      });

      it("converts 25.4 mm (1 inch) to 72 pt", () => {
        expect(mmToPt(25.4)).toBeCloseTo(72, 5);
      });

      it("converts 10 mm correctly", () => {
        expect(mmToPt(10)).toBeCloseTo(10 * PT_PER_MM, 5);
      });
    });

    describe("ptToMm", () => {
      it("converts 0 pt to 0 mm", () => {
        expect(ptToMm(0)).toBe(0);
      });

      it("converts 72 pt (1 inch) to 25.4 mm", () => {
        expect(ptToMm(72)).toBeCloseTo(25.4, 5);
      });

      it("is inverse of mmToPt", () => {
        const mm = 42.5;
        expect(ptToMm(mmToPt(mm))).toBeCloseTo(mm, 5);
      });
    });

    describe("pxToPt", () => {
      it("converts 0 px to 0 pt", () => {
        expect(pxToPt(0)).toBe(0);
      });

      it("converts 96 px (1 inch at 96 DPI) to 72 pt", () => {
        expect(pxToPt(96)).toBeCloseTo(72, 5);
      });

      it("converts pixels correctly", () => {
        expect(pxToPt(100)).toBeCloseTo(100 * PT_PER_PX, 5);
      });
    });

    describe("ptToPx", () => {
      it("converts 0 pt to 0 px", () => {
        expect(ptToPx(0)).toBe(0);
      });

      it("converts 72 pt (1 inch) to 96 px", () => {
        expect(ptToPx(72)).toBeCloseTo(96, 5);
      });

      it("is inverse of pxToPt", () => {
        const px = 150;
        expect(ptToPx(pxToPt(px))).toBeCloseTo(px, 5);
      });
    });

    describe("pxToMm", () => {
      it("converts 0 px to 0 mm", () => {
        expect(pxToMm(0)).toBe(0);
      });

      it("converts 96 px (1 inch at 96 DPI) to 25.4 mm", () => {
        expect(pxToMm(96)).toBeCloseTo(25.4, 5);
      });

      it("converts pixels correctly", () => {
        expect(pxToMm(100)).toBeCloseTo(100 * MM_PER_PX, 5);
      });
    });

    describe("mmToPx", () => {
      it("converts 0 mm to 0 px", () => {
        expect(mmToPx(0)).toBe(0);
      });

      it("converts 25.4 mm (1 inch) to 96 px", () => {
        expect(mmToPx(25.4)).toBeCloseTo(96, 5);
      });

      it("is inverse of pxToMm", () => {
        const mm = 50;
        expect(pxToMm(mmToPx(mm))).toBeCloseTo(mm, 5);
      });
    });
  });

  describe("getPageDimensions", () => {
    it("returns A4 landscape dimensions", () => {
      const dims = getPageDimensions(defaultOptions);
      expect(dims.width).toBe(297);
      expect(dims.height).toBe(210);
    });

    it("returns A4 portrait dimensions", () => {
      const dims = getPageDimensions({
        ...defaultOptions,
        orientation: "portrait",
      });
      expect(dims.width).toBe(210);
      expect(dims.height).toBe(297);
    });

    it("returns A3 landscape dimensions", () => {
      const dims = getPageDimensions({
        ...defaultOptions,
        pageSize: "a3",
      });
      expect(dims.width).toBe(420);
      expect(dims.height).toBe(297);
    });

    it("returns Letter landscape dimensions", () => {
      const dims = getPageDimensions({
        ...defaultOptions,
        pageSize: "letter",
      });
      expect(dims.width).toBe(279);
      expect(dims.height).toBe(216);
    });

    it("returns Legal landscape dimensions", () => {
      const dims = getPageDimensions({
        ...defaultOptions,
        pageSize: "legal",
      });
      expect(dims.width).toBe(356);
      expect(dims.height).toBe(216);
    });

    it("returns Tabloid landscape dimensions", () => {
      const dims = getPageDimensions({
        ...defaultOptions,
        pageSize: "tabloid",
      });
      expect(dims.width).toBe(432);
      expect(dims.height).toBe(279);
    });

    it("returns custom page dimensions in landscape", () => {
      const dims = getPageDimensions({
        ...defaultOptions,
        pageSize: "custom",
        customPageSize: { width: 800, height: 400 },
      });
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(400);
    });

    it("returns custom page dimensions in portrait", () => {
      const dims = getPageDimensions({
        ...defaultOptions,
        pageSize: "custom",
        customPageSize: { width: 800, height: 400 },
        orientation: "portrait",
      });
      expect(dims.width).toBe(400);
      expect(dims.height).toBe(800);
    });

    it("returns default custom size when customPageSize is not provided", () => {
      const dims = getPageDimensions({
        ...defaultOptions,
        pageSize: "custom",
      });
      expect(dims.width).toBe(500);
      expect(dims.height).toBe(300);
    });
  });

  describe("getMargins", () => {
    it("returns normal margins", () => {
      const margins = getMargins(defaultOptions);
      expect(margins.top).toBe(10);
      expect(margins.bottom).toBe(10);
      expect(margins.left).toBe(15);
      expect(margins.right).toBe(15);
    });

    it("returns narrow margins", () => {
      const margins = getMargins({ ...defaultOptions, marginPreset: "narrow" });
      expect(margins.top).toBe(5);
      expect(margins.bottom).toBe(5);
      expect(margins.left).toBe(5);
      expect(margins.right).toBe(5);
    });

    it("returns wide margins", () => {
      const margins = getMargins({ ...defaultOptions, marginPreset: "wide" });
      expect(margins.top).toBe(20);
      expect(margins.bottom).toBe(20);
      expect(margins.left).toBe(25);
      expect(margins.right).toBe(25);
    });

    it("returns zero margins for none preset", () => {
      const margins = getMargins({ ...defaultOptions, marginPreset: "none" });
      expect(margins.top).toBe(0);
      expect(margins.bottom).toBe(0);
      expect(margins.left).toBe(0);
      expect(margins.right).toBe(0);
    });

    it("returns custom margins when provided", () => {
      const customMargins = { top: 5, bottom: 15, left: 10, right: 20 };
      const margins = getMargins({
        ...defaultOptions,
        marginPreset: "custom",
        customMargins,
      });
      expect(margins).toEqual(customMargins);
    });

    it("falls back to preset when custom margins not provided", () => {
      const margins = getMargins({
        ...defaultOptions,
        marginPreset: "custom",
        // No customMargins provided
      });
      // Should use the default for "custom" preset
      expect(margins.top).toBe(10);
    });
  });

  describe("getPrintableArea", () => {
    it("calculates printable area for A4 landscape with normal margins", () => {
      const area = getPrintableArea(defaultOptions);
      expect(area.x).toBe(15); // left margin
      expect(area.y).toBe(10); // top margin
      expect(area.width).toBe(297 - 15 - 15); // 267
      expect(area.height).toBe(210 - 10 - 10); // 190
    });

    it("calculates full page area with no margins", () => {
      const area = getPrintableArea({
        ...defaultOptions,
        marginPreset: "none",
      });
      expect(area.x).toBe(0);
      expect(area.y).toBe(0);
      expect(area.width).toBe(297);
      expect(area.height).toBe(210);
    });
  });

  describe("calculateScale", () => {
    it("calculates fit-to-page scale correctly", () => {
      // Content 1000px x 500px on A4 landscape
      const result = calculateScale(1000, 500, defaultOptions);

      expect(result.scale).toBeGreaterThan(0);
      expect(result.chartWidth).toBeLessThanOrEqual(267); // printable width
      expect(result.chartHeight).toBeLessThanOrEqual(190); // printable height
    });

    it("reserves space for header and footer", () => {
      // Use tall content where height is the limiting factor
      const withoutReserved = calculateScale(500, 2000, defaultOptions, 0, 0);
      const withReserved = calculateScale(500, 2000, defaultOptions, 20, 20);

      // Scale should be smaller when reserving space (height-constrained)
      expect(withReserved.scale).toBeLessThan(withoutReserved.scale);
    });

    it("centers content horizontally", () => {
      const result = calculateScale(100, 100, defaultOptions);

      // offsetX should center the chart
      const expectedCenter = (267 - result.chartWidth) / 2;
      expect(result.offsetX).toBeCloseTo(expectedCenter, 5);
    });

    it("scales chart to fit on custom page size", () => {
      const customOptions: PdfExportOptions = {
        ...defaultOptions,
        pageSize: "custom",
        customPageSize: { width: 1000, height: 500 },
      };
      const result = calculateScale(2000, 1000, customOptions);

      expect(result.scale).toBeGreaterThan(0);
      // Should fit within the custom page
      expect(result.chartWidth).toBeLessThanOrEqual(1000 - 15 - 15); // width - margins
    });
  });

  describe("hexToRgb", () => {
    it("converts black (#000000)", () => {
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("converts white (#ffffff)", () => {
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    });

    it("converts red (#ff0000)", () => {
      expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("converts green (#00ff00)", () => {
      expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
    });

    it("converts blue (#0000ff)", () => {
      expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
    });

    it("handles hex without # prefix", () => {
      expect(hexToRgb("ff5500")).toEqual({ r: 255, g: 85, b: 0 });
    });

    it("handles uppercase hex", () => {
      expect(hexToRgb("#FF5500")).toEqual({ r: 255, g: 85, b: 0 });
    });

    it("returns gray for invalid hex", () => {
      expect(hexToRgb("invalid")).toEqual({ r: 128, g: 128, b: 128 });
    });

    it("returns gray for short hex format (not supported)", () => {
      expect(hexToRgb("#f00")).toEqual({ r: 128, g: 128, b: 128 });
    });
  });

  describe("toGrayscale", () => {
    it("converts black to black", () => {
      expect(toGrayscale({ r: 0, g: 0, b: 0 })).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("converts white to white", () => {
      expect(toGrayscale({ r: 255, g: 255, b: 255 })).toEqual({
        r: 255,
        g: 255,
        b: 255,
      });
    });

    it("converts pure red using luminosity formula", () => {
      const gray = toGrayscale({ r: 255, g: 0, b: 0 });
      // 0.21 * 255 = 53.55 → 54
      expect(gray.r).toBeCloseTo(54, 0);
      expect(gray.g).toBe(gray.r);
      expect(gray.b).toBe(gray.r);
    });

    it("converts pure green using luminosity formula", () => {
      const gray = toGrayscale({ r: 0, g: 255, b: 0 });
      // 0.72 * 255 = 183.6 → 184
      expect(gray.r).toBeCloseTo(184, 0);
      expect(gray.g).toBe(gray.r);
      expect(gray.b).toBe(gray.r);
    });

    it("converts pure blue using luminosity formula", () => {
      const gray = toGrayscale({ r: 0, g: 0, b: 255 });
      // 0.07 * 255 = 17.85 → 18
      expect(gray.r).toBeCloseTo(18, 0);
      expect(gray.g).toBe(gray.r);
      expect(gray.b).toBe(gray.r);
    });
  });

  describe("getColor", () => {
    it("returns original color when grayscale is false", () => {
      const color = getColor("#ff5500", false);
      expect(color).toEqual({ r: 255, g: 85, b: 0 });
    });

    it("returns grayscale color when grayscale is true", () => {
      const color = getColor("#ff5500", true);
      // All RGB values should be equal
      expect(color.r).toBe(color.g);
      expect(color.g).toBe(color.b);
    });
  });

  describe("truncateText", () => {
    it("returns text unchanged if it fits", () => {
      expect(truncateText("Short", 100, 12)).toBe("Short");
    });

    it("truncates long text with ellipsis", () => {
      const result = truncateText("This is a very long text that should be truncated", 20, 12);
      expect(result.endsWith("...")).toBe(true);
      expect(result.length).toBeLessThan(50);
    });

    it("handles empty string", () => {
      expect(truncateText("", 100, 12)).toBe("");
    });

    it("handles very small maxWidth", () => {
      const result = truncateText("Hello World", 5, 12);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });
});
