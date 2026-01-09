/**
 * Unit tests for PdfExportOptions component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PdfExportOptions } from "../../../../src/components/Export/PdfExportOptions";
import {
  DEFAULT_PDF_OPTIONS,
  DEFAULT_EXPORT_OPTIONS,
} from "../../../../src/utils/export/types";

describe("PdfExportOptions", () => {
  const defaultProps = {
    options: { ...DEFAULT_PDF_OPTIONS },
    onChange: vi.fn(),
    exportOptions: { ...DEFAULT_EXPORT_OPTIONS },
    onExportOptionsChange: vi.fn(),
    currentAppZoom: 1,
    taskCount: 10,
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

    it("renders page setup section directly", () => {
      render(<PdfExportOptions {...defaultProps} />);
      expect(screen.getByText("Page Setup")).toBeInTheDocument();
    });

    it("renders header/footer section directly", () => {
      render(<PdfExportOptions {...defaultProps} />);
      expect(screen.getByText("Header / Footer")).toBeInTheDocument();
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

  describe("props handling", () => {
    it("renders with default props", () => {
      render(<PdfExportOptions {...defaultProps} />);
      // Component should render without issues
      expect(document.body).toBeInTheDocument();
    });
  });
});
