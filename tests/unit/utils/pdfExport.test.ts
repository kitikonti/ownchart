/**
 * Tests for pdfExport.ts pure helper functions.
 */

import { describe, it, expect, vi } from "vitest";
import {
  resolvePdfMetadata,
  resolveEffectiveOptions,
  computeChartPlacement,
  type ReservedSpace,
} from "../../../src/utils/export/pdfExport";
import { pxToMm } from "../../../src/utils/export/pdfLayout";
import type { ExportOptions, PdfExportOptions, PdfMargins } from "../../../src/utils/export/types";
import { DEFAULT_EXPORT_OPTIONS, DEFAULT_PDF_OPTIONS } from "../../../src/utils/export/types";

// ---------------------------------------------------------------------------
// resolvePdfMetadata
// ---------------------------------------------------------------------------

describe("resolvePdfMetadata", () => {
  it("uses projectTitle when provided", () => {
    const result = resolvePdfMetadata("My Title", "My Project", "Alice");
    expect(result.title).toBe("My Title");
  });

  it("falls back to projectName when projectTitle is undefined", () => {
    const result = resolvePdfMetadata(undefined, "My Project", "Alice");
    expect(result.title).toBe("My Project");
  });

  it("falls back to default when both title and name are undefined", () => {
    const result = resolvePdfMetadata(undefined, undefined, "Alice");
    expect(result.title).toBe("Project Timeline");
  });

  it("falls back to default when projectTitle is empty string", () => {
    const result = resolvePdfMetadata("", "", "Alice");
    expect(result.title).toBe("Project Timeline");
  });

  it("uses projectAuthor when provided", () => {
    const result = resolvePdfMetadata("Title", "Project", "Bob");
    expect(result.author).toBe("Bob");
  });

  it("returns empty string for author when projectAuthor is undefined", () => {
    const result = resolvePdfMetadata("Title", "Project", undefined);
    expect(result.author).toBe("");
  });

  it("returns empty string for author when projectAuthor is null-ish via ??", () => {
    // ?? only guards undefined/null — empty string author is preserved
    const result = resolvePdfMetadata("Title", "Project", "");
    expect(result.author).toBe("");
  });
});

// ---------------------------------------------------------------------------
// resolveEffectiveOptions
// ---------------------------------------------------------------------------

// calculatePdfFitToWidth performs DOM/DPI calculations — mock it so tests
// stay pure without needing a browser environment.
vi.mock("../../../src/utils/export/pdfLayout", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/utils/export/pdfLayout")>();
  return {
    ...actual,
    calculatePdfFitToWidth: vi.fn(() => 1234),
  };
});

describe("resolveEffectiveOptions", () => {
  const baseOptions: ExportOptions = {
    ...DEFAULT_EXPORT_OPTIONS,
    zoomMode: "custom",
    fitToWidth: 1920,
  };

  it("returns options unchanged when zoomMode is not fitToWidth", () => {
    const result = resolveEffectiveOptions([], baseOptions, DEFAULT_PDF_OPTIONS);
    expect(result).toBe(baseOptions);
  });

  it("returns options unchanged for currentView mode", () => {
    const options = { ...baseOptions, zoomMode: "currentView" as const };
    const result = resolveEffectiveOptions([], options, DEFAULT_PDF_OPTIONS);
    expect(result).toBe(options);
  });

  it("calculates fitToWidth when zoomMode is fitToWidth", () => {
    const options: ExportOptions = { ...baseOptions, zoomMode: "fitToWidth" };
    const result = resolveEffectiveOptions([], options, DEFAULT_PDF_OPTIONS);
    expect(result).not.toBe(options);
    expect(result.fitToWidth).toBe(1234);
    expect(result.zoomMode).toBe("fitToWidth");
  });

  it("preserves all other option fields when recalculating fitToWidth", () => {
    const options: ExportOptions = {
      ...baseOptions,
      zoomMode: "fitToWidth",
      includeHeader: false,
      density: "compact",
    };
    const result = resolveEffectiveOptions([], options, DEFAULT_PDF_OPTIONS);
    expect(result.includeHeader).toBe(false);
    expect(result.density).toBe("compact");
  });

  it("passes tasks and pdfOptions through to calculatePdfFitToWidth", async () => {
    const { calculatePdfFitToWidth } = await import(
      "../../../src/utils/export/pdfLayout"
    );
    const options: ExportOptions = { ...baseOptions, zoomMode: "fitToWidth" };
    const pdfOptions: PdfExportOptions = {
      ...DEFAULT_PDF_OPTIONS,
      pageSize: "a3",
    };
    const tasks = [{ id: "t1" }] as never;

    resolveEffectiveOptions(tasks, options, pdfOptions);

    expect(calculatePdfFitToWidth).toHaveBeenCalledWith(tasks, options, pdfOptions);
  });
});

// ---------------------------------------------------------------------------
// computeChartPlacement
// ---------------------------------------------------------------------------

describe("computeChartPlacement", () => {
  const margins: PdfMargins = { top: 10, bottom: 10, left: 10, right: 10 };
  const noReserved: ReservedSpace = { header: 0, footer: 0 };

  // A4 landscape: 297 × 210 mm; content area with 10mm margins = 277 × 190 mm
  const a4Landscape = { width: 297, height: 210 };

  it("centers chart horizontally when it is narrower than the content area", () => {
    // Tall, narrow SVG — height is the binding constraint
    const dimensions = { width: 100, height: 500 };
    const svgWidthMm = pxToMm(100);
    const svgHeightMm = pxToMm(500);
    const contentWidth = 277;
    const contentHeight = 190;
    const scale = Math.min(contentWidth / svgWidthMm, contentHeight / svgHeightMm);
    const finalWidthMm = svgWidthMm * scale;

    const result = computeChartPlacement(dimensions, a4Landscape, margins, noReserved);

    expect(result.offsetX).toBeCloseTo(10 + (contentWidth - finalWidthMm) / 2);
    expect(result.finalWidthMm).toBeCloseTo(finalWidthMm);
  });

  it("pins chart vertically to top margin when there is no reserved header space", () => {
    const result = computeChartPlacement(
      { width: 500, height: 300 },
      a4Landscape,
      margins,
      noReserved
    );
    expect(result.offsetY).toBe(10); // top margin only
  });

  it("offsets chart vertically by reserved header space", () => {
    const result = computeChartPlacement(
      { width: 500, height: 300 },
      a4Landscape,
      margins,
      { header: 15, footer: 0 }
    );
    expect(result.offsetY).toBe(10 + 15); // top margin + header reserved
  });

  it("scales down when SVG is larger than content area", () => {
    const result = computeChartPlacement(
      { width: 10000, height: 5000 },
      a4Landscape,
      margins,
      noReserved
    );
    // Final dimensions must fit within content area (277 × 190 mm)
    expect(result.finalWidthMm).toBeLessThanOrEqual(277 + 0.001);
    expect(result.finalHeightMm).toBeLessThanOrEqual(190 + 0.001);
  });

  it("is width-limited when the SVG is very wide relative to its height", () => {
    // Wide SVG — width ratio is the binding constraint
    const result = computeChartPlacement(
      { width: 5000, height: 100 },
      a4Landscape,
      margins,
      noReserved
    );
    expect(result.finalWidthMm).toBeCloseTo(277, 1);
  });

  it("is height-limited when the SVG is very tall relative to its width", () => {
    // Tall SVG — height ratio is the binding constraint
    const result = computeChartPlacement(
      { width: 100, height: 5000 },
      a4Landscape,
      margins,
      noReserved
    );
    expect(result.finalHeightMm).toBeCloseTo(190, 1);
  });

  it("scales up when SVG is smaller than content area", () => {
    // Tiny SVG — should fill either the full width or full height
    const result = computeChartPlacement(
      { width: 10, height: 10 },
      a4Landscape,
      margins,
      noReserved
    );
    const fillsWidth = Math.abs(result.finalWidthMm - 277) < 0.1;
    const fillsHeight = Math.abs(result.finalHeightMm - 190) < 0.1;
    expect(fillsWidth || fillsHeight).toBe(true);
  });

  it("reduces available height when both header and footer are reserved", () => {
    const withReserved = computeChartPlacement(
      { width: 500, height: 1000 },
      a4Landscape,
      margins,
      { header: 10, footer: 10 }
    );
    const withoutReserved = computeChartPlacement(
      { width: 500, height: 1000 },
      a4Landscape,
      margins,
      noReserved
    );
    // Less vertical space → chart must be shorter after placement
    expect(withReserved.finalHeightMm).toBeLessThan(withoutReserved.finalHeightMm);
  });

  it("returns exact values with zero margins and no reserved space", () => {
    const dimensions = { width: 500, height: 300 };
    const noMargins: PdfMargins = { top: 0, bottom: 0, left: 0, right: 0 };
    const svgWidthMm = pxToMm(500);
    const svgHeightMm = pxToMm(300);
    const scale = Math.min(297 / svgWidthMm, 210 / svgHeightMm);

    const result = computeChartPlacement(dimensions, a4Landscape, noMargins, noReserved);

    expect(result.offsetX).toBeCloseTo((297 - svgWidthMm * scale) / 2);
    expect(result.offsetY).toBe(0);
    expect(result.finalWidthMm).toBeCloseTo(svgWidthMm * scale);
    expect(result.finalHeightMm).toBeCloseTo(svgHeightMm * scale);
  });

  it("preserves aspect ratio after scaling", () => {
    const dimensions = { width: 800, height: 400 }; // 2:1 aspect ratio
    const result = computeChartPlacement(dimensions, a4Landscape, margins, noReserved);
    expect(result.finalWidthMm / result.finalHeightMm).toBeCloseTo(2, 5);
  });
});
