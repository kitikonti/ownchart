/**
 * Unit tests for SvgExportOptions component
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
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
    it("renders without crashing (returns null)", () => {
      const { container } = render(<SvgExportOptions {...defaultProps} />);
      // Component returns null - no SVG-specific options currently
      expect(container.firstChild).toBeNull();
    });
  });

  describe("props handling", () => {
    it("accepts options prop", () => {
      const { container } = render(
        <SvgExportOptions
          {...defaultProps}
          options={{ ...DEFAULT_SVG_OPTIONS, responsiveMode: true }}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("accepts onChange prop", () => {
      const onChange = vi.fn();
      const { container } = render(<SvgExportOptions {...defaultProps} onChange={onChange} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
