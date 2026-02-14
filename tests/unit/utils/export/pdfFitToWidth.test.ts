/**
 * Unit tests for calculatePdfFitToWidth.
 */

import { describe, it, expect } from "vitest";
import {
  calculatePdfFitToWidth,
  getPageDimensions,
} from "../../../../src/utils/export/pdfLayout";
import { PNG_EXPORT_DPI, MM_PER_INCH } from "../../../../src/utils/export/dpi";
import type { PdfExportOptions } from "../../../../src/utils/export/types";
import { DEFAULT_EXPORT_OPTIONS } from "../../../../src/utils/export/types";
import type { ExportOptions } from "../../../../src/utils/export/types";
import type { Task } from "../../../../src/types/chart.types";
import { DENSITY_CONFIG } from "../../../../src/types/preferences.types";

const defaultPdfOptions: PdfExportOptions = {
  pageSize: "a4",
  orientation: "landscape",
  marginPreset: "normal",
  header: { showProjectName: false, showExportDate: false },
  footer: { showProjectName: false, showExportDate: false },
  metadata: {},
};

const defaultExportOptions: ExportOptions = {
  ...DEFAULT_EXPORT_OPTIONS,
};

function createTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    name: `Task ${i}`,
    startDate: "2025-01-01",
    endDate: "2025-01-15",
    duration: 14,
    progress: 0,
    type: "task" as const,
    color: "#4299e1",
  }));
}

describe("calculatePdfFitToWidth", () => {
  it("returns baseWidthPx when content fits on page (few tasks)", () => {
    const tasks = createTasks(3);
    const result = calculatePdfFitToWidth(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    // baseWidthPx = (297 / 25.4) * 150 = 1753.54...
    const pageDims = getPageDimensions(defaultPdfOptions);
    const baseWidthPx = (pageDims.width / MM_PER_INCH) * PNG_EXPORT_DPI;

    expect(result).toBeCloseTo(baseWidthPx, 0);
  });

  it("returns larger width when content is taller than page (many tasks)", () => {
    const tasks = createTasks(50);
    const result = calculatePdfFitToWidth(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const pageDims = getPageDimensions(defaultPdfOptions);
    const baseWidthPx = (pageDims.width / MM_PER_INCH) * PNG_EXPORT_DPI;

    // With 50 tasks, content should be taller than page, requiring wider width
    expect(result).toBeGreaterThan(baseWidthPx);
  });

  it("respects page size changes (A4 vs A3)", () => {
    const tasks = createTasks(30);

    const a4Result = calculatePdfFitToWidth(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const a3Result = calculatePdfFitToWidth(tasks, defaultExportOptions, {
      ...defaultPdfOptions,
      pageSize: "a3",
    });

    // A3 is bigger, so either both fit (base width difference) or A3 needs less expansion
    const a4PageWidth = getPageDimensions(defaultPdfOptions).width;
    const a3PageWidth = getPageDimensions({
      ...defaultPdfOptions,
      pageSize: "a3",
    }).width;

    // A3 base width should be bigger
    expect(a3PageWidth).toBeGreaterThan(a4PageWidth);

    // The results should differ
    expect(a3Result).not.toBe(a4Result);
  });

  it("respects orientation changes (landscape vs portrait)", () => {
    const tasks = createTasks(30);

    const landscapeResult = calculatePdfFitToWidth(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const portraitResult = calculatePdfFitToWidth(
      tasks,
      defaultExportOptions,
      { ...defaultPdfOptions, orientation: "portrait" }
    );

    // Portrait has narrower width, so fitToWidth should differ
    expect(landscapeResult).not.toBe(portraitResult);
  });

  it("accounts for header/footer reserved space", () => {
    const tasks = createTasks(30);

    const withoutHeaderFooter = calculatePdfFitToWidth(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const withHeaderFooter = calculatePdfFitToWidth(
      tasks,
      defaultExportOptions,
      {
        ...defaultPdfOptions,
        header: { showProjectName: true, showExportDate: true },
        footer: { showProjectName: true, showExportDate: true },
      }
    );

    // With header/footer, less vertical space is available, so more width is needed
    // (or they're equal if content already fits)
    expect(withHeaderFooter).toBeGreaterThanOrEqual(withoutHeaderFooter);
  });

  it("accounts for margins", () => {
    const tasks = createTasks(30);

    const normalMargins = calculatePdfFitToWidth(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const wideMargins = calculatePdfFitToWidth(tasks, defaultExportOptions, {
      ...defaultPdfOptions,
      marginPreset: "wide",
    });

    // Wide margins reduce available space — may need different fitToWidth
    // With less available space, content is more constrained
    expect(wideMargins).not.toBe(normalMargins);
  });

  it("accounts for includeHeader option", () => {
    const tasks = createTasks(30);

    const withHeader = calculatePdfFitToWidth(
      tasks,
      { ...defaultExportOptions, includeHeader: true },
      defaultPdfOptions
    );

    const withoutHeader = calculatePdfFitToWidth(
      tasks,
      { ...defaultExportOptions, includeHeader: false },
      defaultPdfOptions
    );

    // With header, content is taller (adds HEADER_HEIGHT), may need more width
    expect(withHeader).toBeGreaterThanOrEqual(withoutHeader);
  });

  it("accounts for density setting", () => {
    const tasks = createTasks(30);

    const compactResult = calculatePdfFitToWidth(
      tasks,
      { ...defaultExportOptions, density: "compact" },
      defaultPdfOptions
    );

    const comfortableResult = calculatePdfFitToWidth(
      tasks,
      { ...defaultExportOptions, density: "comfortable" },
      defaultPdfOptions
    );

    // Comfortable has larger rows → taller content → may need wider fitToWidth
    const compactRowHeight = DENSITY_CONFIG.compact.rowHeight;
    const comfortableRowHeight = DENSITY_CONFIG.comfortable.rowHeight;
    expect(comfortableRowHeight).toBeGreaterThan(compactRowHeight);

    // Comfortable should need at least as much width
    expect(comfortableResult).toBeGreaterThanOrEqual(compactResult);
  });
});
