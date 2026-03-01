/**
 * Unit tests for SharedExportOptions component.
 * Tests date range, background, layout, and display option controls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SharedExportOptions } from "../../../../src/components/Export/SharedExportOptions";
import type { SharedExportOptionsProps } from "../../../../src/components/Export/SharedExportOptions";
import { DEFAULT_EXPORT_OPTIONS } from "../../../../src/utils/export/types";

function createDefaultProps(
  overrides: Partial<SharedExportOptionsProps> = {}
): SharedExportOptionsProps {
  return {
    options: { ...DEFAULT_EXPORT_OPTIONS },
    onChange: vi.fn(),
    format: "png",
    ...overrides,
  };
}

describe("SharedExportOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);
      expect(document.body).toBeInTheDocument();
    });

    it("renders date range section", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);
      expect(screen.getByText("Date Range")).toBeInTheDocument();
    });

    it("renders all date range modes", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);
      expect(screen.getByText("Entire project")).toBeInTheDocument();
      expect(screen.getByText("Visible range")).toBeInTheDocument();
      expect(screen.getByText("Custom range")).toBeInTheDocument();
    });

    it("renders collapsible sections", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);
      expect(screen.getByText("Layout Options")).toBeInTheDocument();
      expect(screen.getByText("Display Options")).toBeInTheDocument();
    });
  });

  describe("date range", () => {
    it("calls onChange with dateRangeMode all", () => {
      const onChange = vi.fn();
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_EXPORT_OPTIONS, dateRangeMode: "visible" },
            onChange,
          })}
        />
      );

      fireEvent.click(screen.getByText("Entire project"));
      expect(onChange).toHaveBeenCalledWith({ dateRangeMode: "all" });
    });

    it("calls onChange with dateRangeMode visible", () => {
      const onChange = vi.fn();
      render(<SharedExportOptions {...createDefaultProps({ onChange })} />);

      fireEvent.click(screen.getByText("Visible range"));
      expect(onChange).toHaveBeenCalledWith({ dateRangeMode: "visible" });
    });

    it("calls onChange with dateRangeMode custom", () => {
      const onChange = vi.fn();
      render(<SharedExportOptions {...createDefaultProps({ onChange })} />);

      fireEvent.click(screen.getByText("Custom range"));
      expect(onChange).toHaveBeenCalledWith({ dateRangeMode: "custom" });
    });

    it("displays project date range when provided", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({
            projectDateRange: {
              start: new Date(2025, 0, 1), // Jan 1, 2025 local
              end: new Date(2025, 11, 31), // Dec 31, 2025 local
            },
          })}
        />
      );

      expect(screen.getByText(/2025-01-01/)).toBeInTheDocument();
      expect(screen.getByText(/2025-12-31/)).toBeInTheDocument();
    });

    it("formats dates using local time, not UTC", () => {
      // Use a date at midnight local time — toISOString() would shift to previous day in positive UTC offsets
      render(
        <SharedExportOptions
          {...createDefaultProps({
            projectDateRange: {
              start: new Date(2025, 5, 15), // June 15, 2025 local
              end: new Date(2025, 5, 30), // June 30, 2025 local
            },
          })}
        />
      );

      expect(screen.getByText(/2025-06-15/)).toBeInTheDocument();
      expect(screen.getByText(/2025-06-30/)).toBeInTheDocument();
    });

    it("shows custom date inputs when custom range is selected", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_EXPORT_OPTIONS, dateRangeMode: "custom" },
          })}
        />
      );

      expect(screen.getByLabelText("Custom start date")).toBeInTheDocument();
      expect(screen.getByLabelText("Custom end date")).toBeInTheDocument();
    });

    it("calls onChange when custom start date changes", () => {
      const onChange = vi.fn();
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_EXPORT_OPTIONS, dateRangeMode: "custom" },
            onChange,
          })}
        />
      );

      fireEvent.change(screen.getByLabelText("Custom start date"), {
        target: { value: "2025-06-01" },
      });
      expect(onChange).toHaveBeenCalledWith({
        customDateStart: "2025-06-01",
      });
    });

    it("calls onChange when custom end date changes", () => {
      const onChange = vi.fn();
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_EXPORT_OPTIONS, dateRangeMode: "custom" },
            onChange,
          })}
        />
      );

      fireEvent.change(screen.getByLabelText("Custom end date"), {
        target: { value: "2025-12-31" },
      });
      expect(onChange).toHaveBeenCalledWith({
        customDateEnd: "2025-12-31",
      });
    });
  });

  describe("background (PNG/SVG only)", () => {
    it("shows background option for PNG format", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({ format: "png" })}
        />
      );
      expect(screen.getByText("Transparent background")).toBeInTheDocument();
    });

    it("shows background option for SVG format", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({ format: "svg" })}
        />
      );
      expect(screen.getByText("Transparent background")).toBeInTheDocument();
    });

    it("hides background option for PDF format", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({ format: "pdf" })}
        />
      );
      expect(
        screen.queryByText("Transparent background")
      ).not.toBeInTheDocument();
    });

    it("calls onChange to toggle transparency", () => {
      const onChange = vi.fn();
      render(
        <SharedExportOptions
          {...createDefaultProps({ format: "png", onChange })}
        />
      );

      fireEvent.click(screen.getByText("Transparent background"));
      expect(onChange).toHaveBeenCalledWith({ background: "transparent" });
    });
  });

  describe("layout options", () => {
    it("shows density options after expanding Layout Options", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);

      // Expand collapsible section
      fireEvent.click(screen.getByText("Layout Options"));

      expect(screen.getByText("Compact")).toBeInTheDocument();
      expect(screen.getByText("Normal")).toBeInTheDocument();
      expect(screen.getByText("Comfortable")).toBeInTheDocument();
    });

    it("calls onChange when density changes", () => {
      const onChange = vi.fn();
      render(<SharedExportOptions {...createDefaultProps({ onChange })} />);

      fireEvent.click(screen.getByText("Layout Options"));
      fireEvent.click(screen.getByText("Compact"));
      expect(onChange).toHaveBeenCalledWith({ density: "compact" });
    });

    it("shows column checkboxes after expanding Layout Options", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);

      fireEvent.click(screen.getByText("Layout Options"));

      expect(screen.getByText("Color")).toBeInTheDocument();
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Start Date")).toBeInTheDocument();
      expect(screen.getByText("End Date")).toBeInTheDocument();
      expect(screen.getByText("Duration")).toBeInTheDocument();
      expect(screen.getByText("Progress")).toBeInTheDocument();
    });

    it("calls onChange when a column is toggled on", () => {
      const onChange = vi.fn();
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_EXPORT_OPTIONS, selectedColumns: [] },
            onChange,
          })}
        />
      );

      fireEvent.click(screen.getByText("Layout Options"));
      fireEvent.click(screen.getByText("Name"));
      expect(onChange).toHaveBeenCalledWith({
        selectedColumns: ["name"],
      });
    });

    it("preserves column order when toggling", () => {
      const onChange = vi.fn();
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: {
              ...DEFAULT_EXPORT_OPTIONS,
              selectedColumns: ["name", "progress"],
            },
            onChange,
          })}
        />
      );

      fireEvent.click(screen.getByText("Layout Options"));
      fireEvent.click(screen.getByText("Start Date"));
      expect(onChange).toHaveBeenCalledWith({
        selectedColumns: ["name", "startDate", "progress"],
      });
    });

    it("calls onChange when a column is toggled off", () => {
      const onChange = vi.fn();
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: {
              ...DEFAULT_EXPORT_OPTIONS,
              selectedColumns: ["name", "startDate"],
            },
            onChange,
          })}
        />
      );

      fireEvent.click(screen.getByText("Layout Options"));
      fireEvent.click(screen.getByText("Start Date"));
      expect(onChange).toHaveBeenCalledWith({
        selectedColumns: ["name"],
      });
    });
  });

  describe("display options", () => {
    it("shows timeline options after expanding Display Options", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);

      fireEvent.click(screen.getByText("Display Options"));

      expect(screen.getByText("Header row")).toBeInTheDocument();
      expect(screen.getByText("Grid lines")).toBeInTheDocument();
      expect(screen.getByText("Weekend shading")).toBeInTheDocument();
      expect(screen.getByText("Today marker")).toBeInTheDocument();
      expect(screen.getByText("Dependencies")).toBeInTheDocument();
      expect(screen.getByText("Holidays")).toBeInTheDocument();
    });

    it("calls onChange when a timeline option is toggled", () => {
      const onChange = vi.fn();
      render(<SharedExportOptions {...createDefaultProps({ onChange })} />);

      fireEvent.click(screen.getByText("Display Options"));
      fireEvent.click(screen.getByText("Grid lines"));
      expect(onChange).toHaveBeenCalledWith({ includeGridLines: false });
    });

    it("shows label position options after expanding Display Options", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);

      fireEvent.click(screen.getByText("Display Options"));

      expect(screen.getByText("Before")).toBeInTheDocument();
      expect(screen.getByText("Inside")).toBeInTheDocument();
      expect(screen.getByText("After")).toBeInTheDocument();
    });

    it("calls onChange when label position changes", () => {
      const onChange = vi.fn();
      render(<SharedExportOptions {...createDefaultProps({ onChange })} />);

      fireEvent.click(screen.getByText("Display Options"));
      fireEvent.click(screen.getByText("After"));
      expect(onChange).toHaveBeenCalledWith({ taskLabelPosition: "after" });
    });

    it("shows note when inside label position is selected", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: {
              ...DEFAULT_EXPORT_OPTIONS,
              taskLabelPosition: "inside",
            },
          })}
        />
      );

      fireEvent.click(screen.getByText("Display Options"));
      expect(
        screen.getByText(/Milestones and summary tasks/)
      ).toBeInTheDocument();
    });

    it("hides note for non-inside label positions", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: {
              ...DEFAULT_EXPORT_OPTIONS,
              taskLabelPosition: "after",
            },
          })}
        />
      );

      fireEvent.click(screen.getByText("Display Options"));
      expect(
        screen.queryByText(/Milestones and summary tasks/)
      ).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("uses semantic heading for Date Range section", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);
      const heading = screen.getByText("Date Range");
      expect(heading.tagName).toBe("H3");
    });

    it("has role=group on density control", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);
      fireEvent.click(screen.getByText("Layout Options"));
      expect(
        screen.getByRole("group", { name: "Row density" })
      ).toBeInTheDocument();
    });

    it("has role=group on label position control", () => {
      render(<SharedExportOptions {...createDefaultProps()} />);
      fireEvent.click(screen.getByText("Display Options"));
      expect(
        screen.getByRole("group", { name: "Task label position" })
      ).toBeInTheDocument();
    });

    it("has aria-label on custom date inputs", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_EXPORT_OPTIONS, dateRangeMode: "custom" },
          })}
        />
      );
      expect(screen.getByLabelText("Custom start date")).toBeInTheDocument();
      expect(screen.getByLabelText("Custom end date")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles undefined project date range", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({ projectDateRange: undefined })}
        />
      );
      // Should render without the description
      expect(screen.getByText("Entire project")).toBeInTheDocument();
    });

    it("handles undefined visible date range", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({ visibleDateRange: undefined })}
        />
      );
      expect(screen.getByText("Visible range")).toBeInTheDocument();
    });

    it("handles empty selected columns", () => {
      render(
        <SharedExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_EXPORT_OPTIONS, selectedColumns: [] },
          })}
        />
      );
      // Should render and show "timeline-only export" hint
      fireEvent.click(screen.getByText("Layout Options"));
      expect(
        screen.getByText("Uncheck all for timeline-only export")
      ).toBeInTheDocument();
    });
  });
});
