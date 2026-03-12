/**
 * Unit tests for pagePresets.ts — EXPORT_QUICK_PRESETS.
 */

import { describe, it, expect } from "vitest";
import {
  EXPORT_QUICK_PRESETS,
  formatResolutionDescription,
} from "../../../../src/utils/export/pagePresets";
import {
  PNG_EXPORT_DPI,
  calculatePixelDimensions,
} from "../../../../src/utils/export/dpi";
import { PDF_PAGE_SIZES } from "../../../../src/utils/export/types";

describe("EXPORT_QUICK_PRESETS", () => {
  it("contains at least one preset", () => {
    expect(EXPORT_QUICK_PRESETS.length).toBeGreaterThan(0);
  });

  it("all preset keys are unique", () => {
    const keys = EXPORT_QUICK_PRESETS.map((p) => p.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("all presets have a positive targetWidth", () => {
    for (const preset of EXPORT_QUICK_PRESETS) {
      expect(preset.targetWidth).toBeGreaterThan(0);
    }
  });

  it("all presets have non-empty label and description", () => {
    for (const preset of EXPORT_QUICK_PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });

  it("A4 landscape preset has the correct pixel width at PNG_EXPORT_DPI", () => {
    const a4Preset = EXPORT_QUICK_PRESETS.find((p) => p.key === "a4-landscape");
    expect(a4Preset).toBeDefined();
    const a4Size = PDF_PAGE_SIZES["a4"];
    // landscape: width = a4.width (297mm), height = a4.height (210mm)
    const expectedDims = calculatePixelDimensions(
      a4Size.width,
      a4Size.height,
      PNG_EXPORT_DPI
    );
    expect(a4Preset!.targetWidth).toBe(expectedDims.width);
  });

  it("A3 landscape preset has a wider targetWidth than A4 landscape", () => {
    const a4 = EXPORT_QUICK_PRESETS.find((p) => p.key === "a4-landscape");
    const a3 = EXPORT_QUICK_PRESETS.find((p) => p.key === "a3-landscape");
    expect(a3).toBeDefined();
    expect(a4).toBeDefined();
    expect(a3!.targetWidth).toBeGreaterThan(a4!.targetWidth);
  });

  it("HD screen preset matches DEFAULT_FIT_TO_WIDTH_PX (1920)", () => {
    const hd = EXPORT_QUICK_PRESETS.find((p) => p.key === "hd-screen");
    expect(hd).toBeDefined();
    expect(hd!.targetWidth).toBe(1920);
  });

  it("4K screen preset has a wider targetWidth than HD screen", () => {
    const hd = EXPORT_QUICK_PRESETS.find((p) => p.key === "hd-screen");
    const uhd = EXPORT_QUICK_PRESETS.find((p) => p.key === "4k-screen");
    expect(uhd).toBeDefined();
    expect(uhd!.targetWidth).toBeGreaterThan(hd!.targetWidth);
  });

  it("screen preset descriptions use the × multiplication sign (not ASCII x)", () => {
    const hd = EXPORT_QUICK_PRESETS.find((p) => p.key === "hd-screen");
    const uhd = EXPORT_QUICK_PRESETS.find((p) => p.key === "4k-screen");
    expect(hd!.description).toContain("×");
    expect(uhd!.description).toContain("×");
    expect(hd!.description).not.toMatch(/\d x \d/);
  });
});

describe("formatResolutionDescription", () => {
  it("formats dimensions as W × H px", () => {
    expect(formatResolutionDescription(1920, 1080)).toBe("1920 × 1080 px");
  });

  it("uses the Unicode multiplication sign ×, not ASCII x", () => {
    const result = formatResolutionDescription(3840, 2160);
    expect(result).toContain("×");
    expect(result).not.toMatch(/\d x \d/);
  });

  it("includes both width and height values in the output", () => {
    const result = formatResolutionDescription(800, 600);
    expect(result).toContain("800");
    expect(result).toContain("600");
    expect(result).toContain("px");
  });
});
