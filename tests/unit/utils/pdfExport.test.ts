/**
 * Tests for pdfExport.ts pure helper functions.
 */

import { describe, it, expect, vi } from "vitest";
import {
  resolvePdfMetadata,
  resolveEffectiveOptions,
} from "../../../src/utils/export/pdfExport";
import type { ExportOptions, PdfExportOptions } from "../../../src/utils/export/types";
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
