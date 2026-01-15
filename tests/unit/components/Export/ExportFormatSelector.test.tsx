/**
 * Unit tests for ExportFormatSelector component
 * Updated for Figma-style design with solid brand-600 selected state
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportFormatSelector } from "../../../../src/components/Export/ExportFormatSelector";

describe("ExportFormatSelector", () => {
  const defaultProps = {
    selectedFormat: "png" as const,
    onFormatChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders three format options", () => {
      render(<ExportFormatSelector {...defaultProps} />);

      expect(screen.getByText("PNG")).toBeInTheDocument();
      expect(screen.getByText("PDF")).toBeInTheDocument();
      expect(screen.getByText("SVG")).toBeInTheDocument();
    });

    it("displays Format section header", () => {
      render(<ExportFormatSelector {...defaultProps} />);

      expect(screen.getByText("Format")).toBeInTheDocument();
    });

    it("renders buttons with correct aria-pressed state", () => {
      render(<ExportFormatSelector {...defaultProps} selectedFormat="png" />);

      const buttons = screen.getAllByRole("button");
      expect(buttons[0]).toHaveAttribute("aria-pressed", "true"); // PNG
      expect(buttons[1]).toHaveAttribute("aria-pressed", "false"); // PDF
      expect(buttons[2]).toHaveAttribute("aria-pressed", "false"); // SVG
    });

    it("shows help text for selected format", () => {
      render(<ExportFormatSelector {...defaultProps} selectedFormat="png" />);

      expect(
        screen.getByText(/Best for presentations and sharing/i)
      ).toBeInTheDocument();
    });
  });

  describe("selection behavior", () => {
    it("calls onFormatChange when PNG is clicked", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector
          selectedFormat="pdf"
          onFormatChange={onFormatChange}
        />
      );

      fireEvent.click(screen.getByText("PNG"));
      expect(onFormatChange).toHaveBeenCalledWith("png");
    });

    it("calls onFormatChange when PDF is clicked", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector
          selectedFormat="png"
          onFormatChange={onFormatChange}
        />
      );

      fireEvent.click(screen.getByText("PDF"));
      expect(onFormatChange).toHaveBeenCalledWith("pdf");
    });

    it("calls onFormatChange when SVG is clicked", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector
          selectedFormat="png"
          onFormatChange={onFormatChange}
        />
      );

      fireEvent.click(screen.getByText("SVG"));
      expect(onFormatChange).toHaveBeenCalledWith("svg");
    });

    it("allows clicking already selected format", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector
          selectedFormat="png"
          onFormatChange={onFormatChange}
        />
      );

      fireEvent.click(screen.getByText("PNG"));
      expect(onFormatChange).toHaveBeenCalledWith("png");
    });
  });

  describe("visual state", () => {
    it("shows PNG as selected when selectedFormat is png", () => {
      render(<ExportFormatSelector {...defaultProps} selectedFormat="png" />);

      const pngButton = screen.getByText("PNG").closest("button");
      expect(pngButton).toHaveClass("border-brand-600");
      expect(pngButton).toHaveClass("bg-brand-600");
    });

    it("shows PDF as selected when selectedFormat is pdf", () => {
      render(<ExportFormatSelector {...defaultProps} selectedFormat="pdf" />);

      const pdfButton = screen.getByText("PDF").closest("button");
      expect(pdfButton).toHaveClass("border-brand-600");
      expect(pdfButton).toHaveClass("bg-brand-600");
    });

    it("shows SVG as selected when selectedFormat is svg", () => {
      render(<ExportFormatSelector {...defaultProps} selectedFormat="svg" />);

      const svgButton = screen.getByText("SVG").closest("button");
      expect(svgButton).toHaveClass("border-brand-600");
      expect(svgButton).toHaveClass("bg-brand-600");
    });

    it("shows unselected buttons with neutral styling", () => {
      render(<ExportFormatSelector {...defaultProps} selectedFormat="png" />);

      const pdfButton = screen.getByText("PDF").closest("button");
      expect(pdfButton).toHaveClass("border-neutral-200");
      expect(pdfButton).not.toHaveClass("bg-brand-600");
    });
  });
});
