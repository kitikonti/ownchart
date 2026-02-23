/**
 * Smoke tests for ExportDialog component.
 * Verifies rendering, sub-component wiring, and conditional UI.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExportDialog } from "../../../../src/components/Export/ExportDialog";
import type { UseExportDialogResult } from "../../../../src/hooks/useExportDialog";
import {
  DEFAULT_EXPORT_OPTIONS,
  DEFAULT_PDF_OPTIONS,
} from "../../../../src/utils/export/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockCloseExportDialog = vi.fn();
const mockSetExportFormat = vi.fn();
const mockSetExportOptions = vi.fn();
const mockSetPdfExportOptions = vi.fn();
const mockHandleExport = vi.fn();
const mockSetProjectAuthor = vi.fn();

function createMockDialogResult(
  overrides: Partial<UseExportDialogResult> = {}
): UseExportDialogResult {
  return {
    isExportDialogOpen: true,
    closeExportDialog: mockCloseExportDialog,
    selectedExportFormat: "png",
    setExportFormat: mockSetExportFormat,
    exportOptions: DEFAULT_EXPORT_OPTIONS,
    setExportOptions: mockSetExportOptions,
    pdfExportOptions: DEFAULT_PDF_OPTIONS,
    setPdfExportOptions: mockSetPdfExportOptions,
    isExporting: false,
    exportProgress: 0,
    exportError: null,
    handleExport: mockHandleExport,
    tasks: [],
    columnWidths: {},
    currentAppZoom: 1,
    projectTitle: "Test Project",
    projectAuthor: "",
    setProjectAuthor: mockSetProjectAuthor,
    effectiveExportOptions: DEFAULT_EXPORT_OPTIONS,
    estimatedDimensions: { width: 1920, height: 1080, effectiveZoom: 1 },
    taskTableWidth: 400,
    effectiveZoom: 1,
    readabilityStatus: { level: "good", message: "Labels clearly readable" },
    projectDateRange: undefined,
    visibleDateRange: undefined,
    showDimensions: false,
    hasWarning: false,
    hasInfo: false,
    ...overrides,
  };
}

let mockDialogResult = createMockDialogResult();

vi.mock("../../../../src/hooks/useExportDialog", () => ({
  useExportDialog: (): UseExportDialogResult => mockDialogResult,
}));

vi.mock("../../../../src/hooks/useExportPreview", () => ({
  useExportPreview: (): {
    previewDataUrl: string | null;
    previewDimensions: { width: number; height: number };
    isRendering: boolean;
    error: string | null;
  } => ({
    previewDataUrl: null,
    previewDimensions: { width: 0, height: 0 },
    isRendering: false,
    error: null,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockDialogResult = createMockDialogResult();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ExportDialog", () => {
  describe("rendering", () => {
    it("renders the modal with title and subtitle", () => {
      render(<ExportDialog />);

      expect(screen.getByText("Export Gantt Chart")).toBeInTheDocument();
      expect(
        screen.getByText("Choose format and customize your export")
      ).toBeInTheDocument();
    });

    it("renders the format selector", () => {
      render(<ExportDialog />);

      expect(screen.getByText("Format")).toBeInTheDocument();
    });

    it("renders the tip alert", () => {
      render(<ExportDialog />);

      expect(screen.getByText(/Tip:/)).toBeInTheDocument();
    });

    it("renders Cancel and Export buttons in footer", () => {
      render(<ExportDialog />);

      expect(
        screen.getByRole("button", { name: /Cancel/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Export PNG/ })
      ).toBeInTheDocument();
    });
  });

  describe("format-specific options", () => {
    it("renders ScaleOptions for PNG format", () => {
      mockDialogResult = createMockDialogResult({
        selectedExportFormat: "png",
      });
      render(<ExportDialog />);

      expect(screen.getByText("Timeline Scale")).toBeInTheDocument();
    });

    it("renders Export PDF button for PDF format", () => {
      mockDialogResult = createMockDialogResult({
        selectedExportFormat: "pdf",
      });
      render(<ExportDialog />);

      expect(
        screen.getByRole("button", { name: /Export PDF/ })
      ).toBeInTheDocument();
    });

    it("renders Export SVG button for SVG format", () => {
      mockDialogResult = createMockDialogResult({
        selectedExportFormat: "svg",
      });
      render(<ExportDialog />);

      expect(
        screen.getByRole("button", { name: /Export SVG/ })
      ).toBeInTheDocument();
    });
  });

  describe("export status", () => {
    it("shows progress bar when exporting", () => {
      mockDialogResult = createMockDialogResult({
        isExporting: true,
        exportProgress: 42,
      });
      render(<ExportDialog />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute("aria-valuenow", "42");
      expect(screen.getByText("42%")).toBeInTheDocument();
    });

    it("does not show progress bar when not exporting", () => {
      render(<ExportDialog />);

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("shows Exporting... text on button during export", () => {
      mockDialogResult = createMockDialogResult({
        isExporting: true,
        exportProgress: 10,
      });
      render(<ExportDialog />);

      expect(
        screen.getByRole("button", { name: /Exporting/ })
      ).toBeInTheDocument();
    });

    it("disables buttons during export", () => {
      mockDialogResult = createMockDialogResult({
        isExporting: true,
        exportProgress: 50,
      });
      render(<ExportDialog />);

      expect(screen.getByRole("button", { name: /Cancel/ })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /Exporting/ })
      ).toBeDisabled();
    });
  });

  describe("alerts", () => {
    it("shows warning alert when export exceeds safe width", () => {
      mockDialogResult = createMockDialogResult({
        showDimensions: true,
        hasWarning: true,
      });
      render(<ExportDialog />);

      expect(screen.getByText(/may cause issues/)).toBeInTheDocument();
    });

    it("shows info alert for large exports without warning", () => {
      mockDialogResult = createMockDialogResult({
        showDimensions: true,
        hasInfo: true,
        hasWarning: false,
      });
      render(<ExportDialog />);

      expect(
        screen.getByText(/generation may take a moment/)
      ).toBeInTheDocument();
    });

    it("shows warning instead of info when both flags are set", () => {
      mockDialogResult = createMockDialogResult({
        showDimensions: true,
        hasWarning: true,
        hasInfo: true,
      });
      render(<ExportDialog />);

      expect(screen.getByText(/may cause issues/)).toBeInTheDocument();
      expect(
        screen.queryByText(/generation may take a moment/)
      ).not.toBeInTheDocument();
    });

    it("hides dimension alerts when showDimensions is false", () => {
      mockDialogResult = createMockDialogResult({
        showDimensions: false,
        hasWarning: true,
      });
      render(<ExportDialog />);

      expect(screen.queryByText(/may cause issues/)).not.toBeInTheDocument();
    });

    it("shows export error alert", () => {
      mockDialogResult = createMockDialogResult({
        exportError: "Something went wrong",
      });
      render(<ExportDialog />);

      expect(
        screen.getByText("Something went wrong")
      ).toBeInTheDocument();
    });
  });
});
