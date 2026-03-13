/**
 * Unit tests for ScaleOptions component.
 * Verifies prop wiring to ZoomModeSelector.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScaleOptions } from "@/components/Export/ScaleOptions";
import { DEFAULT_EXPORT_OPTIONS } from "@/utils/export/types";

// Mock ZoomModeSelector to isolate ScaleOptions prop-wiring
vi.mock("../../../../src/components/Export/ZoomModeSelector", () => ({
  ZoomModeSelector: (props: Record<string, unknown>) => (
    <div
      data-testid="zoom-mode-selector"
      data-format={props.format as string}
      data-zoom-mode={props.zoomMode as string}
    />
  ),
}));

const defaultProps = {
  options: { ...DEFAULT_EXPORT_OPTIONS },
  onChange: vi.fn(),
  currentAppZoom: 1,
  format: "png" as const,
};

describe("ScaleOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ZoomModeSelector", () => {
    render(<ScaleOptions {...defaultProps} />);
    expect(screen.getByTestId("zoom-mode-selector")).toBeInTheDocument();
  });

  it("passes format='png' to ZoomModeSelector", () => {
    render(<ScaleOptions {...defaultProps} format="png" />);
    expect(screen.getByTestId("zoom-mode-selector")).toHaveAttribute(
      "data-format",
      "png"
    );
  });

  it("passes format='svg' to ZoomModeSelector", () => {
    render(<ScaleOptions {...defaultProps} format="svg" />);
    expect(screen.getByTestId("zoom-mode-selector")).toHaveAttribute(
      "data-format",
      "svg"
    );
  });

  it("passes zoomMode from options to ZoomModeSelector", () => {
    render(
      <ScaleOptions
        {...defaultProps}
        options={{ ...DEFAULT_EXPORT_OPTIONS, zoomMode: "custom" }}
      />
    );
    expect(screen.getByTestId("zoom-mode-selector")).toHaveAttribute(
      "data-zoom-mode",
      "custom"
    );
  });
});
