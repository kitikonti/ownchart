/**
 * Unit tests for pagePresets.ts — EXPORT_QUICK_PRESETS.
 */

import { describe, it, expect } from "vitest";
import { EXPORT_QUICK_PRESETS } from "@/utils/export/pagePresets";
import {
  PNG_EXPORT_DPI,
  calculatePixelDimensions,
} from "@/utils/export/dpi";
import { PDF_PAGE_SIZES } from "@/utils/export/types";

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

  it("screen preset descriptions include width, height and 'px' suffix", () => {
    const hd = EXPORT_QUICK_PRESETS.find((p) => p.key === "hd-screen");
    const uhd = EXPORT_QUICK_PRESETS.find((p) => p.key === "4k-screen");
    expect(hd!.description).toContain("1920");
    expect(hd!.description).toContain("1080");
    expect(hd!.description).toContain("px");
    expect(uhd!.description).toContain("3840");
    expect(uhd!.description).toContain("2160");
    expect(uhd!.description).toContain("px");
  });

  it("landscape paper presets produce a wider targetWidth than portrait would at the same paper size", () => {
    // Verify that the landscape orientation convention (width = long dimension) is
    // applied: for every paper preset the targetWidth must equal the landscape pixel
    // width (long side at PNG_EXPORT_DPI), not the portrait pixel width (short side).
    const a4Preset = EXPORT_QUICK_PRESETS.find((p) => p.key === "a4-landscape");
    const a4Size = PDF_PAGE_SIZES["a4"];
    // landscape → long dimension first; portrait would swap them
    const landscapeDims = calculatePixelDimensions(
      a4Size.width,
      a4Size.height,
      PNG_EXPORT_DPI
    );
    const portraitDims = calculatePixelDimensions(
      a4Size.height,
      a4Size.width,
      PNG_EXPORT_DPI
    );
    // Landscape width > portrait width for a non-square page
    expect(landscapeDims.width).toBeGreaterThan(portraitDims.width);
    // The preset must use the landscape (wider) value, not the portrait (narrower) value
    expect(a4Preset!.targetWidth).toBe(landscapeDims.width);
    expect(a4Preset!.targetWidth).not.toBe(portraitDims.width);
  });
});
