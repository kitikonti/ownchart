/**
 * Unit tests for PdfPreview component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PdfPreview } from "../../../../src/components/Export/PdfPreview";
import type { PdfPreviewProps } from "../../../../src/components/Export/PdfPreview";
import { DEFAULT_PDF_OPTIONS } from "../../../../src/utils/export/types";
import type { ReadabilityStatus } from "../../../../src/utils/export/types";

const baseProps: PdfPreviewProps = {
  previewDataUrl: null,
  chartDimensions: { width: 1000, height: 500 },
  pdfOptions: { ...DEFAULT_PDF_OPTIONS },
  projectTitle: "Test Project",
  projectAuthor: "Test Author",
  isRendering: false,
  error: null,
  effectiveZoom: 1,
};

describe("PdfPreview", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<PdfPreview {...baseProps} />);
      expect(screen.getByText("PDF Preview")).toBeInTheDocument();
      expect(
        screen.getByText("Page layout visualization")
      ).toBeInTheDocument();
    });

    it("shows placeholder when no preview image", () => {
      render(<PdfPreview {...baseProps} previewDataUrl={null} />);
      expect(screen.getByText("Chart content")).toBeInTheDocument();
    });

    it("renders preview image when provided", () => {
      render(
        <PdfPreview
          {...baseProps}
          previewDataUrl="data:image/png;base64,abc"
        />
      );
      const img = screen.getByAltText("Export preview");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "data:image/png;base64,abc");
    });

    it("shows loading spinner when rendering", () => {
      render(<PdfPreview {...baseProps} isRendering={true} />);
      expect(screen.getByText("Rendering...")).toBeInTheDocument();
    });

    it("shows error message when error is set", () => {
      render(
        <PdfPreview {...baseProps} error="Something went wrong" />
      );
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("does not show error while rendering", () => {
      render(
        <PdfPreview
          {...baseProps}
          isRendering={true}
          error="Something went wrong"
        />
      );
      expect(screen.getByText("Rendering...")).toBeInTheDocument();
      // Error should be hidden during rendering
      expect(
        screen.queryByText("Something went wrong")
      ).not.toBeInTheDocument();
    });
  });

  describe("info panel", () => {
    it("shows zoom percentage when effectiveZoom is provided", () => {
      render(<PdfPreview {...baseProps} effectiveZoom={0.75} />);
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("shows dash when effectiveZoom is undefined", () => {
      render(<PdfPreview {...baseProps} effectiveZoom={undefined} />);
      expect(screen.getByText("\u2014")).toBeInTheDocument();
    });

    it("shows page size and orientation", () => {
      render(<PdfPreview {...baseProps} />);
      // Default is A4 Landscape
      expect(screen.getByText(/A4/)).toBeInTheDocument();
      expect(screen.getByText(/Landscape/)).toBeInTheDocument();
    });

    it("shows portrait for portrait orientation", () => {
      render(
        <PdfPreview
          {...baseProps}
          pdfOptions={{ ...DEFAULT_PDF_OPTIONS, orientation: "portrait" }}
        />
      );
      expect(screen.getByText(/Portrait/)).toBeInTheDocument();
    });

    it("shows page dimensions in mm", () => {
      render(<PdfPreview {...baseProps} />);
      // A4 landscape: 297×210
      expect(screen.getByText("297\u00d7210")).toBeInTheDocument();
    });
  });

  describe("header/footer", () => {
    it("shows header strip when header content is enabled", () => {
      const options = {
        ...DEFAULT_PDF_OPTIONS,
        header: {
          showProjectName: true,
          showAuthor: false,
          showExportDate: false,
        },
      };
      render(
        <PdfPreview {...baseProps} pdfOptions={options} />
      );
      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });

    it("shows author in header when enabled", () => {
      const options = {
        ...DEFAULT_PDF_OPTIONS,
        header: {
          showProjectName: false,
          showAuthor: true,
          showExportDate: false,
        },
      };
      render(
        <PdfPreview {...baseProps} pdfOptions={options} />
      );
      expect(screen.getByText("Test Author")).toBeInTheDocument();
    });

    it("does not show header when all header fields are disabled", () => {
      const options = {
        ...DEFAULT_PDF_OPTIONS,
        header: {
          showProjectName: false,
          showAuthor: false,
          showExportDate: false,
        },
        footer: {
          showProjectName: false,
          showAuthor: false,
          showExportDate: false,
        },
      };
      render(
        <PdfPreview {...baseProps} pdfOptions={options} />
      );
      // Neither title nor author should appear in header/footer strips
      expect(screen.queryByText("Test Project")).not.toBeInTheDocument();
    });
  });

  describe("warnings", () => {
    it("shows readability warning when level is warning", () => {
      const readabilityStatus: ReadabilityStatus = {
        level: "warning",
        message: "Text may be small",
      };
      render(
        <PdfPreview {...baseProps} readabilityStatus={readabilityStatus} />
      );
      expect(screen.getByText("Text may be small")).toBeInTheDocument();
    });

    it("shows readability critical message when level is critical", () => {
      const readabilityStatus: ReadabilityStatus = {
        level: "critical",
        message: "Text too small to read",
      };
      render(
        <PdfPreview {...baseProps} readabilityStatus={readabilityStatus} />
      );
      expect(screen.getByText("Text too small to read")).toBeInTheDocument();
    });

    it("does not show readability indicator when level is good", () => {
      const readabilityStatus: ReadabilityStatus = {
        level: "good",
        message: "All good",
      };
      render(
        <PdfPreview {...baseProps} readabilityStatus={readabilityStatus} />
      );
      expect(screen.queryByText("All good")).not.toBeInTheDocument();
    });

    it("shows scale warning when chart needs >50% scaling", () => {
      // Very large chart that needs heavy scaling to fit A4
      render(
        <PdfPreview
          {...baseProps}
          chartDimensions={{ width: 10000, height: 5000 }}
        />
      );
      expect(
        screen.getByText(/Content scaled to.*consider larger page size/)
      ).toBeInTheDocument();
    });

    it("does not show scale warning when chart fits well", () => {
      // Small chart that fits easily
      render(
        <PdfPreview
          {...baseProps}
          chartDimensions={{ width: 100, height: 50 }}
        />
      );
      expect(
        screen.queryByText(/Content scaled to/)
      ).not.toBeInTheDocument();
    });
  });
});
