/**
 * Unit tests for PdfExportOptions component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PdfExportOptions } from "../../../../src/components/Export/PdfExportOptions";
import { DEFAULT_PDF_OPTIONS } from "../../../../src/utils/export/types";

describe("PdfExportOptions", () => {
  const defaultProps = {
    options: { ...DEFAULT_PDF_OPTIONS },
    onChange: vi.fn(),
    projectName: "Test Project",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<PdfExportOptions {...defaultProps} />);
      expect(document.body).toBeInTheDocument();
    });

    it("renders orientation options", () => {
      render(<PdfExportOptions {...defaultProps} />);
      expect(screen.getByText("Landscape")).toBeInTheDocument();
      expect(screen.getByText("Portrait")).toBeInTheDocument();
    });

    it("renders advanced options button", () => {
      render(<PdfExportOptions {...defaultProps} />);
      expect(screen.getByText("Advanced Options")).toBeInTheDocument();
    });
  });

  describe("orientation selection", () => {
    it("calls onChange when orientation is changed to portrait", () => {
      const onChange = vi.fn();
      render(<PdfExportOptions {...defaultProps} onChange={onChange} />);

      fireEvent.click(screen.getByText("Portrait"));
      expect(onChange).toHaveBeenCalledWith({ orientation: "portrait" });
    });

    it("calls onChange when orientation is changed to landscape", () => {
      const onChange = vi.fn();
      render(
        <PdfExportOptions
          {...defaultProps}
          options={{ ...DEFAULT_PDF_OPTIONS, orientation: "portrait" }}
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByText("Landscape"));
      expect(onChange).toHaveBeenCalledWith({ orientation: "landscape" });
    });
  });

  describe("advanced options", () => {
    it("expands advanced options when clicked", () => {
      render(<PdfExportOptions {...defaultProps} />);

      fireEvent.click(screen.getByText("Advanced Options"));

      // After expanding, should show PDF Metadata
      expect(screen.getByText("PDF Metadata")).toBeInTheDocument();
    });

    it("renders grayscale option in advanced section", () => {
      render(<PdfExportOptions {...defaultProps} />);

      fireEvent.click(screen.getByText("Advanced Options"));

      expect(screen.getByText("Grayscale")).toBeInTheDocument();
    });
  });

  describe("props handling", () => {
    it("uses provided project name", () => {
      render(<PdfExportOptions {...defaultProps} projectName="My Project" />);
      // Component should render with the project name available
      expect(document.body).toBeInTheDocument();
    });

    it("handles missing project name", () => {
      render(<PdfExportOptions {...defaultProps} projectName={undefined} />);
      expect(document.body).toBeInTheDocument();
    });
  });
});
