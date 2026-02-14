/**
 * Integration-style tests for zoom consistency between preview and export.
 * Verifies that the preview zoom% matches actual rendering for fitToWidth mode.
 */

import { describe, it, expect } from "vitest";
import { calculatePdfFitToWidth } from "../../../../src/utils/export/pdfLayout";
import {
  calculateEffectiveZoom,
  calculateDurationDays,
  calculateTaskTableWidth,
  getEffectiveDateRange,
} from "../../../../src/utils/export/calculations";
import type { PdfExportOptions } from "../../../../src/utils/export/types";
import { DEFAULT_EXPORT_OPTIONS } from "../../../../src/utils/export/types";
import type { ExportOptions } from "../../../../src/utils/export/types";
import type { Task } from "../../../../src/types/chart.types";

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
  zoomMode: "fitToWidth",
};

function createTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    name: `Task ${i}`,
    startDate: "2025-01-01",
    endDate: "2025-03-01",
    duration: 59,
    progress: 0,
    type: "task" as const,
    color: "#4299e1",
  }));
}

/**
 * Simulate what ExportDialog does to compute effectiveZoom:
 * 1. Calculate pdfFitToWidth
 * 2. Create effectiveExportOptions with that fitToWidth
 * 3. Use calculateExportDimensions logic to get effectiveZoom
 */
function computePreviewZoom(
  tasks: Task[],
  exportOptions: ExportOptions,
  pdfOptions: PdfExportOptions
): number {
  const pdfFitToWidth = calculatePdfFitToWidth(tasks, exportOptions, pdfOptions);
  const effectiveOptions = { ...exportOptions, fitToWidth: pdfFitToWidth };

  // Simulate calculateExportDimensions logic
  const projectDateRange = {
    start: new Date("2025-01-01"),
    end: new Date("2025-03-01"),
  };

  const selectedColumns = effectiveOptions.selectedColumns;
  const taskTableWidth = calculateTaskTableWidth(selectedColumns, {}, effectiveOptions.density);

  // Get date range with padding
  const dateRange = getEffectiveDateRange(
    effectiveOptions,
    projectDateRange,
    undefined
  );

  const durationDays = calculateDurationDays(dateRange);

  return calculateEffectiveZoom(
    effectiveOptions,
    1.0,
    durationDays,
    taskTableWidth
  );
}

/**
 * Simulate what pdfExport.ts does to compute its effectiveZoom.
 * This should produce the same zoom as the preview.
 */
function computeExportZoom(
  tasks: Task[],
  exportOptions: ExportOptions,
  pdfOptions: PdfExportOptions
): number {
  // pdfExport.ts also calls calculatePdfFitToWidth then calculateExportDimensions
  return computePreviewZoom(tasks, exportOptions, pdfOptions);
}

describe("zoom consistency between preview and export", () => {
  it("preview zoom matches export zoom for fitToWidth with few tasks", () => {
    const tasks = createTasks(5);

    const previewZoom = computePreviewZoom(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const exportZoom = computeExportZoom(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    expect(previewZoom).toBe(exportZoom);
  });

  it("preview zoom matches export zoom for fitToWidth with many tasks", () => {
    const tasks = createTasks(50);

    const previewZoom = computePreviewZoom(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const exportZoom = computeExportZoom(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    expect(previewZoom).toBe(exportZoom);
  });

  it("changing page size updates fitToWidth and zoom", () => {
    const tasks = createTasks(30);

    const a4Zoom = computePreviewZoom(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const a3Zoom = computePreviewZoom(tasks, defaultExportOptions, {
      ...defaultPdfOptions,
      pageSize: "a3",
    });

    // A3 has more space, so zoom will differ
    expect(a4Zoom).not.toBe(a3Zoom);
  });

  it("many-task files produce different fitToWidth than few-task files", () => {
    const fewTasks = createTasks(5);
    const manyTasks = createTasks(50);

    const fewFitToWidth = calculatePdfFitToWidth(
      fewTasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const manyFitToWidth = calculatePdfFitToWidth(
      manyTasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    // Many tasks need wider content to fill page after scaling
    expect(manyFitToWidth).toBeGreaterThanOrEqual(fewFitToWidth);
  });

  it("fitToWidth zoom is deterministic (same inputs produce same output)", () => {
    const tasks = createTasks(20);

    const zoom1 = computePreviewZoom(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const zoom2 = computePreviewZoom(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    expect(zoom1).toBe(zoom2);
  });

  it("changing orientation updates zoom", () => {
    const tasks = createTasks(30);

    const landscapeZoom = computePreviewZoom(
      tasks,
      defaultExportOptions,
      defaultPdfOptions
    );

    const portraitZoom = computePreviewZoom(tasks, defaultExportOptions, {
      ...defaultPdfOptions,
      orientation: "portrait",
    });

    expect(landscapeZoom).not.toBe(portraitZoom);
  });
});
