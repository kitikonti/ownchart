/**
 * Unit tests for ExportPreview component.
 * Verifies that the correct preview component is rendered for each export format.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExportPreview } from "../../../../src/components/Export/ExportPreview";
import { DEFAULT_PDF_OPTIONS } from "../../../../src/utils/export/types";

// Mock child components to isolate routing logic
vi.mock("../../../../src/components/Export/PdfPreview", () => ({
  PdfPreview: ({ isRendering }: { isRendering: boolean }) => (
    <div data-testid="pdf-preview">{isRendering ? "rendering" : "ready"}</div>
  ),
}));

vi.mock("../../../../src/components/Export/ChartPreview", () => ({
  ChartPreview: ({ formatType }: { formatType: string }) => (
    <div data-testid="chart-preview" data-format={formatType} />
  ),
}));

const baseDimensions = { width: 1000, height: 500 };

describe("ExportPreview", () => {
  describe("format routing", () => {
    it("renders PdfPreview when format is pdf and pdfOptions are provided", () => {
      render(
        <ExportPreview
          format="pdf"
          previewDataUrl={null}
          dimensions={baseDimensions}
          isRendering={false}
          error={null}
          isTransparent={false}
          pdfOptions={DEFAULT_PDF_OPTIONS}
        />
      );

      expect(screen.getByTestId("pdf-preview")).toBeInTheDocument();
      expect(screen.queryByTestId("chart-preview")).not.toBeInTheDocument();
    });

    it("renders ChartPreview when format is png", () => {
      render(
        <ExportPreview
          format="png"
          previewDataUrl={null}
          dimensions={baseDimensions}
          isRendering={false}
          error={null}
          isTransparent={false}
        />
      );

      expect(screen.getByTestId("chart-preview")).toBeInTheDocument();
      expect(screen.queryByTestId("pdf-preview")).not.toBeInTheDocument();
    });

    it("renders ChartPreview when format is svg", () => {
      render(
        <ExportPreview
          format="svg"
          previewDataUrl={null}
          dimensions={baseDimensions}
          isRendering={false}
          error={null}
          isTransparent={false}
        />
      );

      expect(screen.getByTestId("chart-preview")).toBeInTheDocument();
      expect(screen.queryByTestId("pdf-preview")).not.toBeInTheDocument();
    });

    it("passes formatType='svg' to ChartPreview for svg format", () => {
      render(
        <ExportPreview
          format="svg"
          previewDataUrl={null}
          dimensions={baseDimensions}
          isRendering={false}
          error={null}
          isTransparent={false}
        />
      );

      expect(screen.getByTestId("chart-preview")).toHaveAttribute(
        "data-format",
        "svg"
      );
    });

    it("passes formatType='png' to ChartPreview for png format", () => {
      render(
        <ExportPreview
          format="png"
          previewDataUrl={null}
          dimensions={baseDimensions}
          isRendering={false}
          error={null}
          isTransparent={false}
        />
      );

      expect(screen.getByTestId("chart-preview")).toHaveAttribute(
        "data-format",
        "png"
      );
    });

    it("falls through to ChartPreview when format is pdf but pdfOptions is undefined", () => {
      render(
        <ExportPreview
          format="pdf"
          previewDataUrl={null}
          dimensions={baseDimensions}
          isRendering={false}
          error={null}
          isTransparent={false}
          pdfOptions={undefined}
        />
      );

      // pdfOptions undefined → loading-state fallback to ChartPreview
      expect(screen.getByTestId("chart-preview")).toBeInTheDocument();
      expect(screen.queryByTestId("pdf-preview")).not.toBeInTheDocument();
    });
  });
});
