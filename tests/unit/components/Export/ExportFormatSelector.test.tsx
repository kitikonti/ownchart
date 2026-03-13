/**
 * Unit tests for ExportFormatSelector component
 * Updated for Figma-style design with solid brand-600 selected state
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportFormatSelector } from "@/components/Export/ExportFormatSelector";

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

    it("renders radio buttons with correct aria-checked state", () => {
      render(<ExportFormatSelector {...defaultProps} selectedFormat="png" />);

      const radios = screen.getAllByRole("radio");
      expect(radios[0]).toHaveAttribute("aria-checked", "true"); // PNG
      expect(radios[1]).toHaveAttribute("aria-checked", "false"); // PDF
      expect(radios[2]).toHaveAttribute("aria-checked", "false"); // SVG
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

  describe("keyboard navigation", () => {
    it("moves selection to PDF on ArrowRight from PNG", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector selectedFormat="png" onFormatChange={onFormatChange} />
      );

      fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight" });
      expect(onFormatChange).toHaveBeenCalledWith("pdf");
    });

    it("moves selection to SVG on ArrowRight from PDF", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector selectedFormat="pdf" onFormatChange={onFormatChange} />
      );

      fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight" });
      expect(onFormatChange).toHaveBeenCalledWith("svg");
    });

    it("wraps from SVG back to PNG on ArrowRight", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector selectedFormat="svg" onFormatChange={onFormatChange} />
      );

      fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight" });
      expect(onFormatChange).toHaveBeenCalledWith("png");
    });

    it("moves selection to PNG on ArrowLeft from PDF", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector selectedFormat="pdf" onFormatChange={onFormatChange} />
      );

      fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowLeft" });
      expect(onFormatChange).toHaveBeenCalledWith("png");
    });

    it("wraps from PNG to SVG on ArrowLeft", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector selectedFormat="png" onFormatChange={onFormatChange} />
      );

      fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowLeft" });
      expect(onFormatChange).toHaveBeenCalledWith("svg");
    });

    it("also navigates on ArrowDown (same as ArrowRight)", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector selectedFormat="png" onFormatChange={onFormatChange} />
      );

      fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowDown" });
      expect(onFormatChange).toHaveBeenCalledWith("pdf");
    });

    it("also navigates on ArrowUp (same as ArrowLeft)", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector selectedFormat="pdf" onFormatChange={onFormatChange} />
      );

      fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowUp" });
      expect(onFormatChange).toHaveBeenCalledWith("png");
    });

    it("does not call onFormatChange for non-navigation keys", () => {
      const onFormatChange = vi.fn();
      render(
        <ExportFormatSelector selectedFormat="png" onFormatChange={onFormatChange} />
      );

      fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "Enter" });
      fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "Tab" });
      fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "Space" });
      expect(onFormatChange).not.toHaveBeenCalled();
    });
  });
});
