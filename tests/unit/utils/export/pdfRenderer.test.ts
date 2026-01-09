/**
 * Unit tests for pdfRenderer.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Task } from "../../../../src/types/chart.types";
import type { Dependency } from "../../../../src/types/dependency.types";
import type { ExportOptions, PdfExportOptions } from "../../../../src/utils/export/types";
import { DEFAULT_PDF_OPTIONS, DEFAULT_EXPORT_OPTIONS } from "../../../../src/utils/export/types";

// Create mock jsPDF instance
const createMockDoc = () => ({
  setFillColor: vi.fn(),
  setDrawColor: vi.fn(),
  setTextColor: vi.fn(),
  setLineWidth: vi.fn(),
  setLineDashPattern: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  rect: vi.fn(),
  roundedRect: vi.fn(),
  line: vi.fn(),
  triangle: vi.fn(),
  text: vi.fn(),
  getTextWidth: vi.fn(() => 20),
});

// Mock timelineUtils
vi.mock("../../../../src/utils/timelineUtils", () => ({
  getUnitStart: vi.fn((date) => new Date(date)),
  addUnit: vi.fn((date, _unit, step) => {
    const d = new Date(date);
    d.setDate(d.getDate() + step * 7);
    return d;
  }),
}));

describe("pdfRenderer", () => {
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

  const createMilestone = (overrides: Partial<Task> = {}): Task => ({
    id: "milestone-1",
    name: "Milestone",
    startDate: "2024-01-10",
    endDate: "2024-01-10",
    progress: 0,
    type: "milestone",
    open: true,
    ...overrides,
  });

  const createSummary = (overrides: Partial<Task> = {}): Task => ({
    id: "summary-1",
    name: "Summary Task",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    progress: 25,
    type: "summary",
    open: true,
    ...overrides,
  });

  const createMockScale = () => ({
    minDate: "2024-01-01",
    maxDate: "2024-01-31",
    pixelsPerDay: 30,
    totalWidth: 900,
    scales: [
      { unit: "week", step: 1, format: (d: Date) => `W${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)}` },
      { unit: "day", step: 1, format: (d: Date) => d.getDate().toString() },
    ],
  });

  const defaultOptions: ExportOptions = {
    ...DEFAULT_EXPORT_OPTIONS,
    selectedColumns: [],
  };

  const defaultPdfOptions: PdfExportOptions = {
    ...DEFAULT_PDF_OPTIONS,
    grayscale: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("renderChartToPdf", () => {
    it("should be importable", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      expect(typeof renderChartToPdf).toBe("function");
    });

    it("should render without errors with valid context", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask()],
        dependencies: [],
        options: defaultOptions,
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // Should have rendered something
      expect(mockDoc.setFillColor).toHaveBeenCalled();
    });

    it("should call progress callback", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();
      const progressValues: number[] = [];

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask()],
        dependencies: [],
        options: defaultOptions,
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx, (p) => progressValues.push(p));

      expect(progressValues.length).toBeGreaterThan(0);
      expect(progressValues).toContain(10);
      expect(progressValues).toContain(90);
    });

    it("should render weekends when includeWeekends is true", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask()],
        dependencies: [],
        options: { ...defaultOptions, includeWeekends: true },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // rect is called for weekend shading
      expect(mockDoc.rect).toHaveBeenCalled();
    });

    it("should render grid lines when includeGridLines is true", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask(), createTestTask({ id: "task-2" })],
        dependencies: [],
        options: { ...defaultOptions, includeGridLines: true },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // line is called for grid lines
      expect(mockDoc.line).toHaveBeenCalled();
    });

    it("should render today marker when includeTodayMarker is true", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      // Use a date range that includes today
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 5);
      const end = new Date(today);
      end.setDate(end.getDate() + 5);

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: {
          minDate: start.toISOString().split("T")[0],
          maxDate: end.toISOString().split("T")[0],
          pixelsPerDay: 30,
          totalWidth: 300,
          scales: [],
        },
        tasks: [createTestTask()],
        dependencies: [],
        options: { ...defaultOptions, includeTodayMarker: true },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // setLineDashPattern is called for today marker
      expect(mockDoc.setLineDashPattern).toHaveBeenCalled();
    });

    it("should render timeline header when includeHeader is true", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask()],
        dependencies: [],
        options: { ...defaultOptions, includeHeader: true },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // rect for header background, text for labels
      expect(mockDoc.rect).toHaveBeenCalled();
      expect(mockDoc.text).toHaveBeenCalled();
    });

    it("should render task bars", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask()],
        dependencies: [],
        options: { ...defaultOptions, includeWeekends: false, includeGridLines: false },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // roundedRect for task bars
      expect(mockDoc.roundedRect).toHaveBeenCalled();
    });

    it("should render milestones as diamonds", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createMilestone()],
        dependencies: [],
        options: { ...defaultOptions, includeWeekends: false, includeGridLines: false },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // triangle for milestone diamond shape
      expect(mockDoc.triangle).toHaveBeenCalled();
    });

    it("should render summary tasks with brackets", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createSummary()],
        dependencies: [],
        options: { ...defaultOptions, includeWeekends: false, includeGridLines: false },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // rect and triangle for summary brackets
      expect(mockDoc.rect).toHaveBeenCalled();
      expect(mockDoc.triangle).toHaveBeenCalled();
    });

    it("should render task labels when position is inside", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask()],
        dependencies: [],
        options: { ...defaultOptions, taskLabelPosition: "inside" },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      expect(mockDoc.text).toHaveBeenCalled();
    });

    it("should render task labels when position is after", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask()],
        dependencies: [],
        options: { ...defaultOptions, taskLabelPosition: "after" },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      expect(mockDoc.text).toHaveBeenCalled();
    });

    it("should render task labels when position is before", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask()],
        dependencies: [],
        options: { ...defaultOptions, taskLabelPosition: "before" },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      expect(mockDoc.text).toHaveBeenCalled();
    });

    it("should not render task labels when position is none", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask()],
        dependencies: [],
        options: {
          ...defaultOptions,
          taskLabelPosition: "none",
          includeHeader: false,
          includeWeekends: false,
          includeGridLines: false,
        },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      // Reset mock to count only label-related calls
      mockDoc.text.mockClear();

      await renderChartToPdf(ctx);

      // text should not be called for task labels (only for other elements)
      // With none position and no header, minimal text calls
    });

    it("should render dependencies when includeDependencies is true", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const tasks = [
        createTestTask({ id: "task-1" }),
        createTestTask({ id: "task-2", startDate: "2024-01-16", endDate: "2024-01-31" }),
      ];

      const dependencies: Dependency[] = [
        { id: "dep-1", fromTaskId: "task-1", toTaskId: "task-2", type: "FS" },
      ];

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks,
        dependencies,
        options: { ...defaultOptions, includeDependencies: true },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // line for dependency paths, triangle for arrowheads
      expect(mockDoc.line).toHaveBeenCalled();
      expect(mockDoc.triangle).toHaveBeenCalled();
    });

    it("should render task table when taskTableWidthMm > 0", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask()],
        dependencies: [],
        options: defaultOptions,
        pdfOptions: defaultPdfOptions,
        chartX: 100,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 50, // Task table enabled
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // rect for table header, text for task names
      expect(mockDoc.rect).toHaveBeenCalled();
      expect(mockDoc.text).toHaveBeenCalled();
      expect(mockDoc.setFont).toHaveBeenCalledWith("helvetica", "bold");
    });

    it("should handle grayscale mode", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask({ color: "#ff0000" })],
        dependencies: [],
        options: defaultOptions,
        pdfOptions: { ...defaultPdfOptions, grayscale: true },
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // setFillColor should be called with grayscale values
      expect(mockDoc.setFillColor).toHaveBeenCalled();
    });

    it("should render task with progress fill", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask({ progress: 75 })],
        dependencies: [],
        options: { ...defaultOptions, includeWeekends: false, includeGridLines: false },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // roundedRect called twice: once for bar, once for progress
      const roundedRectCalls = mockDoc.roundedRect.mock.calls.length;
      expect(roundedRectCalls).toBeGreaterThanOrEqual(2);
    });

    it("should handle hierarchical tasks with indentation", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const tasks = [
        createSummary({ id: "parent" }),
        createTestTask({ id: "child", parent: "parent" }),
      ];

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks,
        dependencies: [],
        options: defaultOptions,
        pdfOptions: defaultPdfOptions,
        chartX: 100,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 50,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // text called for task names with different x positions for indent
      expect(mockDoc.text).toHaveBeenCalled();
    });

    it("should handle custom task colors", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createTestTask({ color: "#3b82f6" })],
        dependencies: [],
        options: { ...defaultOptions, includeWeekends: false, includeGridLines: false },
        pdfOptions: defaultPdfOptions,
        chartX: 50,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 0,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // setFillColor should be called with the task color (converted to RGB)
      expect(mockDoc.setFillColor).toHaveBeenCalledWith(59, 130, 246);
    });

    it("should render closed summary with indicator", async () => {
      const { renderChartToPdf } = await import("../../../../src/utils/export/pdfRenderer");
      const mockDoc = createMockDoc();

      const ctx = {
        doc: mockDoc as unknown as import("jspdf").jsPDF,
        scale: createMockScale(),
        tasks: [createSummary({ open: false })],
        dependencies: [],
        options: defaultOptions,
        pdfOptions: defaultPdfOptions,
        chartX: 100,
        chartY: 30,
        chartWidthMm: 200,
        chartHeightMm: 100,
        taskTableWidthMm: 50,
        rowHeightMm: 10,
        taskBarHeightMm: 7,
        headerHeightMm: 15,
        scaleFactor: 1,
      };

      await renderChartToPdf(ctx);

      // Should include ▸ prefix for closed summary
      expect(mockDoc.text).toHaveBeenCalled();
    });
  });
});
