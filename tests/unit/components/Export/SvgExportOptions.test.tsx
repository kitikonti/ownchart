/**
 * Unit tests for SvgExportOptions component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

    it("renders SVG hint text", () => {
      render(<SvgExportOptions {...defaultProps} />);
      expect(
        screen.getByText(/SVG files can be edited in Illustrator/i)
      ).toBeInTheDocument();
    });

    it("mentions Figma and Inkscape", () => {
      render(<SvgExportOptions {...defaultProps} />);
      expect(screen.getByText(/Figma/i)).toBeInTheDocument();
      expect(screen.getByText(/Inkscape/i)).toBeInTheDocument();
    });
  });

  describe("props handling", () => {
    it("accepts options prop", () => {
      render(
        <SvgExportOptions
          {...defaultProps}
          options={{ ...DEFAULT_SVG_OPTIONS, responsiveMode: true }}
        />
      );
      expect(document.body).toBeInTheDocument();
    });

    it("accepts onChange prop", () => {
      const onChange = vi.fn();
      render(<SvgExportOptions {...defaultProps} onChange={onChange} />);
      expect(document.body).toBeInTheDocument();
    });
  });
});
