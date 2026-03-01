/**
 * Unit tests for PdfExportOptions component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PdfExportOptions } from "../../../../src/components/Export/PdfExportOptions";
import type { PdfExportOptionsProps } from "../../../../src/components/Export/PdfExportOptions";
import {
  DEFAULT_PDF_OPTIONS,
  DEFAULT_EXPORT_OPTIONS,
} from "../../../../src/utils/export/types";

// Mock ZoomModeSelector to isolate PdfExportOptions tests
vi.mock("../../../../src/components/Export/ZoomModeSelector", () => ({
  ZoomModeSelector: (): JSX.Element => <div data-testid="zoom-mode-selector" />,
}));

function createDefaultProps(
  overrides: Partial<PdfExportOptionsProps> = {}
): PdfExportOptionsProps {
  return {
    options: { ...DEFAULT_PDF_OPTIONS },
    onChange: vi.fn(),
    exportOptions: { ...DEFAULT_EXPORT_OPTIONS },
    onExportOptionsChange: vi.fn(),
    currentAppZoom: 1,
    projectAuthor: "",
    onProjectAuthorChange: vi.fn(),
    ...overrides,
  };
}

describe("PdfExportOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      expect(document.body).toBeInTheDocument();
    });

    it("renders zoom mode selector", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      expect(screen.getByTestId("zoom-mode-selector")).toBeInTheDocument();
    });

    it("renders page setup section", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      expect(screen.getByText("Page Setup")).toBeInTheDocument();
    });

    it("renders header/footer section", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      expect(screen.getByText("Header / Footer")).toBeInTheDocument();
    });

    it("renders orientation options", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      expect(screen.getByText("Landscape")).toBeInTheDocument();
      expect(screen.getByText("Portrait")).toBeInTheDocument();
    });

    it("renders margin presets", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      expect(screen.getByText("Normal")).toBeInTheDocument();
      expect(screen.getByText("Narrow")).toBeInTheDocument();
      expect(screen.getByText("Wide")).toBeInTheDocument();
      expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("displays page dimensions for standard page sizes", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      // A4 landscape: 297 × 210 mm
      expect(screen.getByText("297 × 210 mm")).toBeInTheDocument();
    });

    it("displays portrait dimensions when orientation is portrait", () => {
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_PDF_OPTIONS, orientation: "portrait" },
          })}
        />
      );
      // A4 portrait: 210 × 297 mm
      expect(screen.getByText("210 × 297 mm")).toBeInTheDocument();
    });

    it("does not display dimensions for custom page size", () => {
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_PDF_OPTIONS, pageSize: "custom" },
          })}
        />
      );
      expect(screen.queryByText(/× .* mm$/)).not.toBeInTheDocument();
    });
  });

  describe("orientation selection", () => {
    it("calls onChange when orientation is changed to portrait", () => {
      const onChange = vi.fn();
      render(<PdfExportOptions {...createDefaultProps({ onChange })} />);

      fireEvent.click(screen.getByText("Portrait"));
      expect(onChange).toHaveBeenCalledWith({ orientation: "portrait" });
    });

    it("calls onChange when orientation is changed to landscape", () => {
      const onChange = vi.fn();
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_PDF_OPTIONS, orientation: "portrait" },
            onChange,
          })}
        />
      );

      fireEvent.click(screen.getByText("Landscape"));
      expect(onChange).toHaveBeenCalledWith({ orientation: "landscape" });
    });
  });

  describe("page size selection", () => {
    it("calls onChange when page size changes", () => {
      const onChange = vi.fn();
      render(<PdfExportOptions {...createDefaultProps({ onChange })} />);

      const select = screen.getByDisplayValue(/A4/);
      fireEvent.change(select, { target: { value: "a3" } });
      expect(onChange).toHaveBeenCalledWith({ pageSize: "a3" });
    });

    it("shows custom size inputs when custom is selected", () => {
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_PDF_OPTIONS, pageSize: "custom" },
          })}
        />
      );

      expect(screen.getByLabelText("Width (mm)")).toBeInTheDocument();
      expect(screen.getByLabelText("Height (mm)")).toBeInTheDocument();
    });

    it("does not show custom size inputs for standard page sizes", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);

      expect(screen.queryByLabelText("Width (mm)")).not.toBeInTheDocument();
    });

    it("calls onChange with custom dimensions", () => {
      const onChange = vi.fn();
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_PDF_OPTIONS, pageSize: "custom" },
            onChange,
          })}
        />
      );

      fireEvent.change(screen.getByLabelText("Width (mm)"), {
        target: { value: "600" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          customPageSize: expect.objectContaining({ width: 600 }),
        })
      );
    });

    it("clamps custom dimensions to minimum", () => {
      const onChange = vi.fn();
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_PDF_OPTIONS, pageSize: "custom" },
            onChange,
          })}
        />
      );

      fireEvent.change(screen.getByLabelText("Width (mm)"), {
        target: { value: "10" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          customPageSize: expect.objectContaining({ width: 100 }),
        })
      );
    });

    it("clamps custom dimensions to maximum", () => {
      const onChange = vi.fn();
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_PDF_OPTIONS, pageSize: "custom" },
            onChange,
          })}
        />
      );

      fireEvent.change(screen.getByLabelText("Height (mm)"), {
        target: { value: "9999" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          customPageSize: expect.objectContaining({ height: 5000 }),
        })
      );
    });

    it("falls back to default for non-numeric custom input", () => {
      const onChange = vi.fn();
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_PDF_OPTIONS, pageSize: "custom" },
            onChange,
          })}
        />
      );

      fireEvent.change(screen.getByLabelText("Width (mm)"), {
        target: { value: "" },
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          customPageSize: expect.objectContaining({ width: 500 }),
        })
      );
    });
  });

  describe("margin presets", () => {
    it("calls onChange when margin preset changes", () => {
      const onChange = vi.fn();
      render(<PdfExportOptions {...createDefaultProps({ onChange })} />);

      fireEvent.click(screen.getByText("Narrow"));
      expect(onChange).toHaveBeenCalledWith({ marginPreset: "narrow" });
    });

    it("displays margin values for selected preset", () => {
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_PDF_OPTIONS, marginPreset: "normal" },
          })}
        />
      );

      expect(
        screen.getByText("10mm top/bottom, 15mm left/right")
      ).toBeInTheDocument();
    });

    it("hides margin values when none is selected", () => {
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: { ...DEFAULT_PDF_OPTIONS, marginPreset: "none" },
          })}
        />
      );

      expect(
        screen.queryByText(/mm top\/bottom/)
      ).not.toBeInTheDocument();
    });
  });

  describe("header/footer", () => {
    it("renders header and footer columns", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);

      expect(screen.getByText("Header")).toBeInTheDocument();
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("renders checkbox options in both columns", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);

      // Project title appears twice (header + footer)
      expect(screen.getAllByText("Project title")).toHaveLength(2);
      expect(screen.getAllByText("Author")).toHaveLength(2);
      expect(screen.getAllByText("Export date")).toHaveLength(2);
    });

    it("calls onChange when header checkbox is toggled", () => {
      const onChange = vi.fn();
      render(<PdfExportOptions {...createDefaultProps({ onChange })} />);

      // Click first "Export date" checkbox (header)
      const exportDateLabels = screen.getAllByText("Export date");
      fireEvent.click(exportDateLabels[0]);
      expect(onChange).toHaveBeenCalledWith({
        header: expect.objectContaining({ showExportDate: true }),
      });
    });

    it("calls onChange when footer checkbox is toggled", () => {
      const onChange = vi.fn();
      render(<PdfExportOptions {...createDefaultProps({ onChange })} />);

      // Click second "Export date" checkbox (footer)
      const exportDateLabels = screen.getAllByText("Export date");
      fireEvent.click(exportDateLabels[1]);
      expect(onChange).toHaveBeenCalledWith({
        footer: expect.objectContaining({ showExportDate: true }),
      });
    });
  });

  describe("author input", () => {
    it("hides author input when no author checkbox is checked", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      expect(screen.queryByPlaceholderText("Your name")).not.toBeInTheDocument();
    });

    it("shows author input when header author is checked", () => {
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: {
              ...DEFAULT_PDF_OPTIONS,
              header: {
                ...DEFAULT_PDF_OPTIONS.header,
                showAuthor: true,
              },
            },
          })}
        />
      );

      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    });

    it("shows author input when footer author is checked", () => {
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: {
              ...DEFAULT_PDF_OPTIONS,
              footer: {
                ...DEFAULT_PDF_OPTIONS.footer,
                showAuthor: true,
              },
            },
          })}
        />
      );

      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    });

    it("calls onProjectAuthorChange when author input changes", () => {
      const onProjectAuthorChange = vi.fn();
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: {
              ...DEFAULT_PDF_OPTIONS,
              header: {
                ...DEFAULT_PDF_OPTIONS.header,
                showAuthor: true,
              },
            },
            onProjectAuthorChange,
          })}
        />
      );

      fireEvent.change(screen.getByPlaceholderText("Your name"), {
        target: { value: "Martin" },
      });
      expect(onProjectAuthorChange).toHaveBeenCalledWith("Martin");
    });
  });

  describe("accessibility", () => {
    it("has role=group on orientation control", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      expect(
        screen.getByRole("group", { name: "Page orientation" })
      ).toBeInTheDocument();
    });

    it("has role=group on margin control", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      expect(
        screen.getByRole("group", { name: "Margin preset" })
      ).toBeInTheDocument();
    });

    it("uses semantic heading for section titles", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      const pageSetup = screen.getByText("Page Setup");
      expect(pageSetup.tagName).toBe("H3");
    });

    it("has accessible label on page size select", () => {
      render(<PdfExportOptions {...createDefaultProps()} />);
      expect(screen.getByLabelText("Page Size")).toBeInTheDocument();
    });

    it("has accessible label on author input", () => {
      render(
        <PdfExportOptions
          {...createDefaultProps({
            options: {
              ...DEFAULT_PDF_OPTIONS,
              header: {
                ...DEFAULT_PDF_OPTIONS.header,
                showAuthor: true,
              },
            },
          })}
        />
      );
      // Use role query to target the text input specifically (not checkbox labels)
      expect(
        screen.getByRole("textbox", { name: "Author" })
      ).toBeInTheDocument();
    });
  });
});
