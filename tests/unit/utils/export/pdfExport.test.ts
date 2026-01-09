/**
 * Unit tests for pdfExport.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Task } from "../../../../src/types/chart.types";
import type { ExportOptions, PdfExportOptions } from "../../../../src/utils/export/types";
import { DEFAULT_PDF_OPTIONS, DEFAULT_EXPORT_OPTIONS } from "../../../../src/utils/export/types";

// Mock functions for jsPDF
const mockSave = vi.fn();
const mockSetProperties = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockText = vi.fn();
const mockGetTextWidth = vi.fn(() => 50);
const mockSetFillColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetLineWidth = vi.fn();
const mockRect = vi.fn();
const mockRoundedRect = vi.fn();
const mockLine = vi.fn();
const mockTriangle = vi.fn();
const mockSetLineDashPattern = vi.fn();
const mockSetFont = vi.fn();

const mockAddFileToVFS = vi.fn();
const mockAddFont = vi.fn();
const mockSvg = vi.fn().mockResolvedValue(undefined);

const createMockJsPDF = () => ({
  save: mockSave,
  setProperties: mockSetProperties,
  setFontSize: mockSetFontSize,
  setTextColor: mockSetTextColor,
  text: mockText,
  getTextWidth: mockGetTextWidth,
  setFillColor: mockSetFillColor,
  setDrawColor: mockSetDrawColor,
  setLineWidth: mockSetLineWidth,
  rect: mockRect,
  roundedRect: mockRoundedRect,
  line: mockLine,
  triangle: mockTriangle,
  setLineDashPattern: mockSetLineDashPattern,
  setFont: mockSetFont,
  addFileToVFS: mockAddFileToVFS,
  addFont: mockAddFont,
  svg: mockSvg,
});

// Store constructor calls
const jsPDFConstructorCalls: unknown[][] = [];

vi.mock("jspdf", () => ({
  jsPDF: vi.fn((...args) => {
    jsPDFConstructorCalls.push(args);
    return createMockJsPDF();
  }),
}));


describe("pdfExport", () => {
  const createTestTask = (overrides: Partial<Task> = {}): Task => ({
    id: "task-1",
    name: "Test Task",
    startDate: "2024-01-01",
    endDate: "2024-01-15",
    progress: 50,
    type: "task",
    open: true,
    ...overrides,
  });

  const defaultExportOptions: ExportOptions = {
    ...DEFAULT_EXPORT_OPTIONS,
    selectedColumns: [],
  };

  const defaultPdfOptions: PdfExportOptions = {
    ...DEFAULT_PDF_OPTIONS,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    jsPDFConstructorCalls.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("exportToPdf", () => {
    it("should be importable", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");
      expect(typeof exportToPdf).toBe("function");
    });

    it("should create PDF with correct orientation", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: { ...defaultPdfOptions, orientation: "landscape" },
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
      });

      expect(jsPDFConstructorCalls.length).toBe(1);
      const constructorArg = jsPDFConstructorCalls[0][0] as Record<string, unknown>;
      expect(constructorArg.orientation).toBe("landscape");
      expect(constructorArg.unit).toBe("mm");
    });

    it("should create PDF with portrait orientation", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: { ...defaultPdfOptions, orientation: "portrait" },
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
      });

      expect(jsPDFConstructorCalls.length).toBe(1);
      const constructorArg = jsPDFConstructorCalls[0][0] as Record<string, unknown>;
      expect(constructorArg.orientation).toBe("portrait");
    });

    it("should save PDF with generated filename", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        projectName: "Test Project",
        dateFormat: "YYYY-MM-DD",
      });

      expect(mockSave).toHaveBeenCalledWith(
        expect.stringMatching(/^Test-Project-\d{8}-\d{6}\.pdf$/)
      );
    });

    it("should use default filename when no project name", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
      });

      expect(mockSave).toHaveBeenCalledWith(
        expect.stringMatching(/^gantt-chart-\d{8}-\d{6}\.pdf$/)
      );
    });

    it("should set PDF metadata from projectTitle and projectAuthor", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: {
          ...defaultPdfOptions,
          metadata: {
            subject: "Test Subject",
          },
        },
        columnWidths: {},
        currentAppZoom: 1,
        projectName: "My Project",
        projectTitle: "Custom Title",
        projectAuthor: "Test Author",
        dateFormat: "YYYY-MM-DD",
      });

      expect(mockSetProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Custom Title",
          author: "Test Author",
          subject: "Test Subject",
          creator: "OwnChart",
        })
      );
    });

    it("should call progress callback at various stages", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");
      const progressValues: number[] = [];

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        onProgress: (progress) => progressValues.push(progress),
      });

      // New SVG-to-PDF approach has different progress values
      expect(progressValues).toContain(5);
      expect(progressValues).toContain(10);
      expect(progressValues).toContain(25);
      expect(progressValues).toContain(100);
    });

    it("should render header when configured", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: {
          ...defaultPdfOptions,
          header: {
            showProjectName: true,
            showExportDate: true,
          },
        },
        columnWidths: {},
        currentAppZoom: 1,
        projectName: "Header Test",
        dateFormat: "DD/MM/YYYY",
      });

      // Header renders text
      expect(mockText).toHaveBeenCalled();
    });

    it("should render footer when configured", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: {
          ...defaultPdfOptions,
          footer: {
            showProjectName: true,
            showExportDate: true,
          },
        },
        columnWidths: {},
        currentAppZoom: 1,
        projectName: "Footer Test",
        dateFormat: "MM/DD/YYYY",
      });

      expect(mockText).toHaveBeenCalled();
    });

    it("should handle empty task list", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
      });

      expect(mockSave).toHaveBeenCalled();
    });

    it("should handle custom date range mode", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: {
          ...defaultExportOptions,
          dateRangeMode: "custom",
          customDateStart: "2024-01-01",
          customDateEnd: "2024-02-01",
        },
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
      });

      expect(mockSave).toHaveBeenCalled();
    });

    it("should handle visible date range mode", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: {
          ...defaultExportOptions,
          dateRangeMode: "visible",
        },
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        visibleDateRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-01-31"),
        },
      });

      expect(mockSave).toHaveBeenCalled();
    });

    it("should handle custom zoom mode", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: {
          ...defaultExportOptions,
          zoomMode: "custom",
          timelineZoom: 1.5,
        },
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
      });

      expect(mockSave).toHaveBeenCalled();
    });

    it("should use A4 page size correctly", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: { ...defaultPdfOptions, pageSize: "a4" },
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
      });

      expect(jsPDFConstructorCalls.length).toBe(1);
      const constructorArg = jsPDFConstructorCalls[0][0] as Record<string, unknown>;
      expect(constructorArg.format).toEqual([297, 210]); // A4 landscape
    });

    it("should use A3 page size correctly", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: { ...defaultPdfOptions, pageSize: "a3" },
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
      });

      expect(jsPDFConstructorCalls.length).toBe(1);
      const constructorArg = jsPDFConstructorCalls[0][0] as Record<string, unknown>;
      expect(constructorArg.format).toEqual([420, 297]); // A3 landscape
    });

    it("should include task table when columns selected", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: {
          ...defaultExportOptions,
          selectedColumns: ["name", "startDate"],
        },
        pdfOptions: defaultPdfOptions,
        columnWidths: { name: 150, startDate: 100 },
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
      });

      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe("filename generation", () => {
    it("generates filename with sanitized project name", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        projectName: "My Cool Project",
      });

      // sanitizeFilename preserves case
      expect(mockSave).toHaveBeenCalledWith(
        expect.stringMatching(/^My-Cool-Project-\d{8}-\d{6}\.pdf$/)
      );
    });

    it("handles special characters in project name", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        projectName: "Project: Test <>&",
      });

      // Should not throw and should sanitize
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe("dependencies handling", () => {
    it("exports with dependencies without errors", async () => {
      const { exportToPdf } = await import("../../../../src/utils/export/pdfExport");

      const dependencies = [
        { id: "dep-1", fromTaskId: "task-1", toTaskId: "task-2", type: "FS" as const },
      ];

      await exportToPdf({
        tasks: [createTestTask(), createTestTask({ id: "task-2", name: "Task 2" })],
        dependencies,
        options: {
          ...defaultExportOptions,
          includeDependencies: true,
        },
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
      });

      // SVG-to-PDF approach uses doc.svg() to embed the chart
      expect(mockSvg).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
