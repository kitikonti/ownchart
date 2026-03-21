/**
 * Unit tests for pdfExport.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Task } from "@/types/chart.types";
import type {
  ExportOptions,
  PdfExportOptions,
  PdfMargins,
} from "@/utils/export/types";
import { DEFAULT_PDF_OPTIONS, DEFAULT_EXPORT_OPTIONS } from "@/utils/export/types";
import { DEFAULT_COLOR_MODE_STATE } from "@/config/colorModeDefaults";
import { tid } from "../../../helpers/branded";
import {
  resolvePdfMetadata,
  resolveEffectiveOptions,
  computeChartPlacement,
  type ReservedSpace,
} from "@/utils/export/pdfExport";
import { pxToMm } from "@/utils/export/pdfLayout";

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

const createMockJsPDF = (): Record<string, unknown> => ({
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

// Keep real pdfLayout implementations except calculatePdfFitToWidth, which
// performs DOM/DPI calculations incompatible with the test environment.
vi.mock("@/utils/export/pdfLayout", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/utils/export/pdfLayout")>();
  return {
    ...actual,
    calculatePdfFitToWidth: vi.fn(() => 1234),
  };
});


describe("pdfExport", () => {
  const createTestTask = (overrides: Partial<Task> & { id?: string } = {}): Task => {
    const { id = "task-1", ...rest } = overrides;
    return {
      id: tid(id),
      name: "Test Task",
      startDate: "2024-01-01",
      endDate: "2024-01-15",
      progress: 50,
      type: "task",
      open: true,
      ...rest,
    };
  };

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
    // Suppress React "not wrapped in act(...)" warnings from exportToPdf's
    // internal createRoot().render() calls. These renders happen inside the
    // export pipeline (not test code) and cannot be wrapped in act() without
    // breaking the mock-based test strategy.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("exportToPdf", () => {
    it("should be importable", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");
      expect(typeof exportToPdf).toBe("function");
    }, 15000); // Longer timeout due to large font base64 data loading

    it("should create PDF with correct orientation", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: { ...defaultPdfOptions, orientation: "landscape" },
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      expect(jsPDFConstructorCalls.length).toBe(1);
      const constructorArg = jsPDFConstructorCalls[0][0] as Record<string, unknown>;
      expect(constructorArg.orientation).toBe("landscape");
      expect(constructorArg.unit).toBe("mm");
    });

    it("should create PDF with portrait orientation", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: { ...defaultPdfOptions, orientation: "portrait" },
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      expect(jsPDFConstructorCalls.length).toBe(1);
      const constructorArg = jsPDFConstructorCalls[0][0] as Record<string, unknown>;
      expect(constructorArg.orientation).toBe("portrait");
    });

    it("should save PDF with generated filename", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        projectName: "Test Project",
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      expect(mockSave).toHaveBeenCalledWith(
        expect.stringMatching(/^Test-Project-\d{8}-\d{6}\.pdf$/)
      );
    });

    it("should use default filename when no project name", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      expect(mockSave).toHaveBeenCalledWith(
        expect.stringMatching(/^gantt-chart-\d{8}-\d{6}\.pdf$/)
      );
    });

    it("should set PDF metadata from projectTitle and projectAuthor", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

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
        colorModeState: DEFAULT_COLOR_MODE_STATE,
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
      const { exportToPdf } = await import("@/utils/export/pdfExport");
      const progressValues: number[] = [];

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
        onProgress: (progress) => progressValues.push(progress),
      });

      expect(progressValues).toContain(5);
      expect(progressValues).toContain(10);
      expect(progressValues).toContain(25);
      expect(progressValues).toContain(100);
    });

    it("should render header project name when showProjectName is enabled", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: {
          ...defaultPdfOptions,
          header: {
            showProjectName: true,
            showAuthor: false,
            showExportDate: false,
            showLogo: false,
          },
          // Disable default footer to isolate assertions
          footer: { showProjectName: false, showAuthor: false, showExportDate: false, showLogo: false },
        },
        columnWidths: {},
        currentAppZoom: 1,
        projectName: "Header Test",
        dateFormat: "DD/MM/YYYY",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      // Header renders the project name as left-aligned text
      expect(mockText).toHaveBeenCalledWith(
        "Header Test",
        expect.any(Number),
        expect.any(Number)
      );
      // Header separator line is drawn
      expect(mockLine).toHaveBeenCalled();
    });

    it("should render footer project name when showProjectName is enabled", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: {
          ...defaultPdfOptions,
          // Disable default header to isolate footer assertions
          header: { showProjectName: false, showAuthor: false, showExportDate: false, showLogo: false },
          footer: {
            showProjectName: true,
            showAuthor: false,
            showExportDate: false,
            showLogo: false,
          },
        },
        columnWidths: {},
        currentAppZoom: 1,
        projectName: "Footer Test",
        dateFormat: "MM/DD/YYYY",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      // Footer renders the project name
      expect(mockText).toHaveBeenCalledWith(
        "Footer Test",
        expect.any(Number),
        expect.any(Number)
      );
      // Footer separator line is drawn
      expect(mockLine).toHaveBeenCalled();
    });

    it("should handle empty task list", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      expect(mockSave).toHaveBeenCalled();
    });

    it("should handle custom date range mode", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

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
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      expect(mockSave).toHaveBeenCalled();
    });

    it("should handle visible date range mode", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: {
          ...defaultExportOptions,
          dateRangeMode: "visible",
        },
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
        visibleDateRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-01-31"),
        },
      });

      expect(mockSave).toHaveBeenCalled();
    });

    it("should handle custom zoom mode", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

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
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      expect(mockSave).toHaveBeenCalled();
    });

    it("should use A4 page size correctly", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: { ...defaultPdfOptions, pageSize: "a4" },
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      expect(jsPDFConstructorCalls.length).toBe(1);
      const constructorArg = jsPDFConstructorCalls[0][0] as Record<string, unknown>;
      expect(constructorArg.format).toEqual([297, 210]); // A4 landscape
    });

    it("should use A3 page size correctly", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: { ...defaultPdfOptions, pageSize: "a3" },
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      expect(jsPDFConstructorCalls.length).toBe(1);
      const constructorArg = jsPDFConstructorCalls[0][0] as Record<string, unknown>;
      expect(constructorArg.format).toEqual([420, 297]); // A3 landscape
    });

    it("should include task table when columns selected", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

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
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe("filename generation", () => {
    it("generates filename with sanitized project name", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
        projectName: "My Cool Project",
      });

      // sanitizeFilename preserves case
      expect(mockSave).toHaveBeenCalledWith(
        expect.stringMatching(/^My-Cool-Project-\d{8}-\d{6}\.pdf$/)
      );
    });

    it("handles special characters in project name", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask()],
        options: defaultExportOptions,
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
        projectName: "Project: Test <>&",
      });

      // Should not throw and should sanitize
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe("dependencies handling", () => {
    it("exports with includeDependencies flag enabled without errors", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");

      await exportToPdf({
        tasks: [createTestTask(), createTestTask({ id: "task-2", name: "Task 2" })],
        options: {
          ...defaultExportOptions,
          includeDependencies: true,
        },
        pdfOptions: defaultPdfOptions,
        columnWidths: {},
        currentAppZoom: 1,
        dateFormat: "YYYY-MM-DD",
        colorModeState: DEFAULT_COLOR_MODE_STATE,
      });

      // SVG-to-PDF approach uses doc.svg() to embed the chart
      expect(mockSvg).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
    });

    it("throws descriptive error when SVG embedding fails", async () => {
      const { exportToPdf } = await import("@/utils/export/pdfExport");
      mockSvg.mockRejectedValueOnce(new Error("svg2pdf internal failure"));

      await expect(
        exportToPdf({
          tasks: [createTestTask()],
          options: defaultExportOptions,
          pdfOptions: defaultPdfOptions,
          columnWidths: {},
          currentAppZoom: 1,
          dateFormat: "YYYY-MM-DD",
          colorModeState: DEFAULT_COLOR_MODE_STATE,
        })
      ).rejects.toThrow("PDF rendering failed");
    });
  });
});

// =============================================================================
// Pure helper functions
// =============================================================================

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

  it("preserves empty string author (??  only guards undefined/null)", () => {
    const result = resolvePdfMetadata("Title", "Project", "");
    expect(result.author).toBe("");
  });
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
      "../../../../src/utils/export/pdfLayout"
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
    const result = computeChartPlacement(
      { width: 5000, height: 100 },
      a4Landscape,
      margins,
      noReserved
    );
    expect(result.finalWidthMm).toBeCloseTo(277, 1);
  });

  it("is height-limited when the SVG is very tall relative to its width", () => {
    const result = computeChartPlacement(
      { width: 100, height: 5000 },
      a4Landscape,
      margins,
      noReserved
    );
    expect(result.finalHeightMm).toBeCloseTo(190, 1);
  });

  it("scales up when SVG is smaller than content area", () => {
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
