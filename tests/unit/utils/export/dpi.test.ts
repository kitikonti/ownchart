/**
 * Unit tests for dpi.ts
 *
 * Covers DPI constants, unit conversions, pixel dimension calculations,
 * and the display formatting helper.
 */

import { describe, it, expect } from "vitest";
import {
  INTERNAL_DPI,
  PNG_EXPORT_DPI,
  MM_PER_INCH,
  mmToPxAtDpi,
  pxToMmAtDpi,
  calculatePixelDimensions,
  formatDpiDescription,
} from "@/utils/export/dpi";

// ---------------------------------------------------------------------------
// Constants sanity
// ---------------------------------------------------------------------------

describe("DPI constants", () => {
  it("INTERNAL_DPI is 96 (CSS/browser standard)", () => {
    expect(INTERNAL_DPI).toBe(96);
  });

  it("PNG_EXPORT_DPI is 150 (print quality)", () => {
    expect(PNG_EXPORT_DPI).toBe(150);
  });

  it("MM_PER_INCH is 25.4", () => {
    expect(MM_PER_INCH).toBe(25.4);
  });
});

// ---------------------------------------------------------------------------
// mmToPxAtDpi
// ---------------------------------------------------------------------------

describe("mmToPxAtDpi", () => {
  it("converts 25.4 mm to exactly dpi pixels at any DPI", () => {
    expect(mmToPxAtDpi(25.4, 96)).toBeCloseTo(96);
    expect(mmToPxAtDpi(25.4, 150)).toBeCloseTo(150);
    expect(mmToPxAtDpi(25.4, 72)).toBeCloseTo(72);
  });

  it("returns 0 for 0 mm", () => {
    expect(mmToPxAtDpi(0, 96)).toBe(0);
  });

  it("scales linearly — doubling mm doubles pixels", () => {
    const half = mmToPxAtDpi(50, 96);
    const full = mmToPxAtDpi(100, 96);
    expect(full).toBeCloseTo(half * 2);
  });

  it("handles fractional mm values", () => {
    expect(mmToPxAtDpi(12.7, 96)).toBeCloseTo(48);
  });

  it("throws RangeError for negative mm", () => {
    expect(() => mmToPxAtDpi(-1, 96)).toThrow(RangeError);
  });

  it("throws RangeError for NaN mm", () => {
    expect(() => mmToPxAtDpi(NaN, 96)).toThrow(RangeError);
  });

  it("throws RangeError for Infinity mm", () => {
    expect(() => mmToPxAtDpi(Infinity, 96)).toThrow(RangeError);
  });

  it("throws RangeError for zero dpi", () => {
    expect(() => mmToPxAtDpi(25.4, 0)).toThrow(RangeError);
  });

  it("throws RangeError for negative dpi", () => {
    expect(() => mmToPxAtDpi(25.4, -1)).toThrow(RangeError);
  });

  it("throws RangeError for NaN dpi", () => {
    expect(() => mmToPxAtDpi(25.4, NaN)).toThrow(RangeError);
  });

  it("throws RangeError for Infinity dpi", () => {
    expect(() => mmToPxAtDpi(25.4, Infinity)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// pxToMmAtDpi
// ---------------------------------------------------------------------------

describe("pxToMmAtDpi", () => {
  it("is the inverse of mmToPxAtDpi (round-trip)", () => {
    const mm = 210; // A4 width
    const dpi = 150;
    const px = mmToPxAtDpi(mm, dpi);
    expect(pxToMmAtDpi(px, dpi)).toBeCloseTo(mm);
  });

  it("returns 0 for 0 px", () => {
    expect(pxToMmAtDpi(0, 96)).toBe(0);
  });

  it("converts dpi pixels to 25.4 mm (1 inch) at any DPI", () => {
    expect(pxToMmAtDpi(96, 96)).toBeCloseTo(25.4);
    expect(pxToMmAtDpi(150, 150)).toBeCloseTo(25.4);
  });

  it("throws RangeError for negative px", () => {
    expect(() => pxToMmAtDpi(-1, 96)).toThrow(RangeError);
  });

  it("throws RangeError for NaN px", () => {
    expect(() => pxToMmAtDpi(NaN, 96)).toThrow(RangeError);
  });

  it("throws RangeError for Infinity px", () => {
    expect(() => pxToMmAtDpi(Infinity, 96)).toThrow(RangeError);
  });

  it("throws RangeError for zero dpi", () => {
    expect(() => pxToMmAtDpi(96, 0)).toThrow(RangeError);
  });

  it("throws RangeError for negative dpi", () => {
    expect(() => pxToMmAtDpi(96, -1)).toThrow(RangeError);
  });

  it("throws RangeError for NaN dpi", () => {
    expect(() => pxToMmAtDpi(96, NaN)).toThrow(RangeError);
  });

  it("throws RangeError for Infinity dpi", () => {
    expect(() => pxToMmAtDpi(96, Infinity)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// calculatePixelDimensions
// ---------------------------------------------------------------------------

describe("calculatePixelDimensions", () => {
  it("returns integer pixel dimensions (rounded)", () => {
    const { width, height } = calculatePixelDimensions(210, 297, 150);
    expect(Number.isInteger(width)).toBe(true);
    expect(Number.isInteger(height)).toBe(true);
  });

  it("calculates A4 portrait dimensions at 150 DPI correctly", () => {
    // A4: 210 × 297 mm → at 150 DPI
    // 210/25.4 * 150 ≈ 1240.16 → 1240
    // 297/25.4 * 150 ≈ 1754.33 → 1754
    const { width, height } = calculatePixelDimensions(210, 297, 150);
    expect(width).toBe(1240);
    expect(height).toBe(1754);
  });

  it("uses PNG_EXPORT_DPI as default when dpi not provided", () => {
    const withDefault = calculatePixelDimensions(210, 297);
    const withExplicit = calculatePixelDimensions(210, 297, PNG_EXPORT_DPI);
    expect(withDefault.width).toBe(withExplicit.width);
    expect(withDefault.height).toBe(withExplicit.height);
  });

  it("returns { width: 0, height: 0 } for zero dimensions", () => {
    const { width, height } = calculatePixelDimensions(0, 0, 150);
    expect(width).toBe(0);
    expect(height).toBe(0);
  });

  it("width and height are independent", () => {
    const { width, height } = calculatePixelDimensions(100, 200, 96);
    expect(height).toBeCloseTo(width * 2, 0);
  });

  it("throws RangeError for negative widthMm", () => {
    expect(() => calculatePixelDimensions(-1, 297, 150)).toThrow(RangeError);
  });

  it("throws RangeError for negative heightMm", () => {
    expect(() => calculatePixelDimensions(210, -1, 150)).toThrow(RangeError);
  });

  it("throws RangeError for NaN widthMm", () => {
    expect(() => calculatePixelDimensions(NaN, 297, 150)).toThrow(RangeError);
  });

  it("throws RangeError for Infinity widthMm", () => {
    expect(() => calculatePixelDimensions(Infinity, 297, 150)).toThrow(
      RangeError
    );
  });

  it("throws RangeError for NaN heightMm", () => {
    expect(() => calculatePixelDimensions(210, NaN, 150)).toThrow(RangeError);
  });

  it("throws RangeError for Infinity heightMm", () => {
    expect(() => calculatePixelDimensions(210, Infinity, 150)).toThrow(
      RangeError
    );
  });
});

// ---------------------------------------------------------------------------
// formatDpiDescription
// ---------------------------------------------------------------------------

describe("formatDpiDescription", () => {
  it("includes width and height in the output", () => {
    const result = formatDpiDescription(1240, 1754, 150);
    expect(result).toContain("1240");
    expect(result).toContain("1754");
  });

  it("includes DPI value in the output", () => {
    const result = formatDpiDescription(800, 600, 96);
    expect(result).toContain("96");
  });

  it("uses × as the dimension separator", () => {
    const result = formatDpiDescription(100, 200, 72);
    expect(result).toContain("×");
  });

  it("is a display-only formatter — returns a non-empty string for any numeric inputs including zero", () => {
    expect(formatDpiDescription(0, 0, 0).length).toBeGreaterThan(0);
  });

  it("matches the expected format string", () => {
    expect(formatDpiDescription(1240, 1754, 150)).toBe(
      "1240 × 1754 px (150 DPI)"
    );
  });
});
