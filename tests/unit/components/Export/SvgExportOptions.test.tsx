/**
 * Unit tests for SvgExportOptions component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SvgExportOptions } from "../../../../src/components/Export/SvgExportOptions";
import { DEFAULT_SVG_OPTIONS } from "../../../../src/utils/export/types";

describe("SvgExportOptions", () => {
  const defaultProps = {
    options: { ...DEFAULT_SVG_OPTIONS },
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<SvgExportOptions {...defaultProps} />);
      expect(document.body).toBeInTheDocument();
    });

    it("renders dimensions section", () => {
      render(<SvgExportOptions {...defaultProps} />);
      expect(screen.getByText("Dimensions")).toBeInTheDocument();
    });

    it("renders custom size option", () => {
      render(<SvgExportOptions {...defaultProps} />);
      expect(screen.getByText("Custom size")).toBeInTheDocument();
    });

    it("renders advanced options section", () => {
      render(<SvgExportOptions {...defaultProps} />);
      expect(screen.getByText("Advanced Options")).toBeInTheDocument();
    });
  });

  describe("advanced options", () => {
    it("shows advanced options when expanded", () => {
      render(<SvgExportOptions {...defaultProps} />);

      fireEvent.click(screen.getByText("Advanced Options"));

      expect(screen.getByText("Include background")).toBeInTheDocument();
    });

    it("renders responsive mode option", () => {
      render(<SvgExportOptions {...defaultProps} />);

      fireEvent.click(screen.getByText("Advanced Options"));

      expect(screen.getByText("Responsive mode")).toBeInTheDocument();
    });

    it("renders optimize option", () => {
      render(<SvgExportOptions {...defaultProps} />);

      fireEvent.click(screen.getByText("Advanced Options"));

      expect(screen.getByText("Optimize SVG")).toBeInTheDocument();
    });
  });

  describe("props handling", () => {
    it("accepts different options", () => {
      render(
        <SvgExportOptions
          {...defaultProps}
          options={{ ...DEFAULT_SVG_OPTIONS, dimensionMode: "custom" }}
        />
      );
      expect(document.body).toBeInTheDocument();
    });

    it("handles responsive mode enabled", () => {
      render(
        <SvgExportOptions
          {...defaultProps}
          options={{ ...DEFAULT_SVG_OPTIONS, responsiveMode: true }}
        />
      );
      expect(document.body).toBeInTheDocument();
    });
  });
});
