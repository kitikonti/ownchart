/**
 * Unit tests for ZoomControls component.
 * Covers slider interaction, zoom in/out disabled states, fit-to-view,
 * zoom dialog open/close, and zoom dialog selection.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ZoomControls } from "../../../../src/components/StatusBar/ZoomControls";
import { useChartStore } from "../../../../src/store/slices/chartSlice";
import { useTaskStore } from "../../../../src/store/slices/taskSlice";
import { MIN_ZOOM, MAX_ZOOM } from "../../../../src/utils/timelineUtils";

// Stub DOM-dependent helpers that rely on layout measurements unavailable in jsdom.
vi.mock("../../../../src/hooks/useZoom", () => ({
  computeViewportCenterAnchor: vi.fn(() => ({
    date: new Date("2024-01-15"),
    offsetPx: 0,
  })),
  applyScrollLeft: vi.fn(),
}));

// Avoid rendering ZoomDialog's portal/focus-trap in these unit tests.
vi.mock("../../../../src/components/StatusBar/ZoomDialog", () => ({
  ZoomDialog: ({
    isOpen,
    onClose,
    onSelect,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (v: number | "fit") => void;
  }) =>
    isOpen ? (
      <div data-testid="zoom-dialog">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSelect(0.5)}>Select 50%</button>
        <button onClick={() => onSelect("fit")}>Select Fit</button>
      </div>
    ) : null,
}));

function setup(zoom = 1.0) {
  useChartStore.setState({
    zoom,
    setZoom: vi.fn(() => ({ newScrollLeft: 0 })),
    zoomIn: vi.fn(() => ({ newScrollLeft: 0 })),
    zoomOut: vi.fn(() => ({ newScrollLeft: 0 })),
    fitToView: vi.fn(),
  } as Partial<ReturnType<typeof useChartStore.getState>> as ReturnType<typeof useChartStore.getState>);
  useTaskStore.setState({ tasks: [] });
}

describe("ZoomControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it("renders zoom out, slider, zoom in, percentage button, and fit-to-view button", () => {
    render(<ZoomControls />);

    expect(screen.getByRole("button", { name: "Zoom out" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Zoom level" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fit to view" })).toBeInTheDocument();
  });

  it("displays the current zoom percentage", () => {
    setup(1.5);
    render(<ZoomControls />);
    expect(screen.getByText("150%")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Disabled states at zoom bounds
  // -------------------------------------------------------------------------
  // Buttons use aria-disabled (not native disabled) to keep them in the tab
  // order for keyboard users. Tests check aria-disabled and verify clicks are
  // suppressed rather than using toBeDisabled() which only matches native disabled.

  it("marks zoom out button as aria-disabled at MIN_ZOOM", () => {
    setup(MIN_ZOOM);
    render(<ZoomControls />);
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("marks zoom in button as aria-disabled at MAX_ZOOM", () => {
    setup(MAX_ZOOM);
    render(<ZoomControls />);
    expect(screen.getByRole("button", { name: "Zoom in" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("does not mark zoom buttons as aria-disabled at mid-range zoom", () => {
    setup(1.0);
    render(<ZoomControls />);
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveAttribute(
      "aria-disabled",
      "false"
    );
    expect(screen.getByRole("button", { name: "Zoom in" })).toHaveAttribute(
      "aria-disabled",
      "false"
    );
  });

  it("does not call zoomOut when zoom out button is clicked at MIN_ZOOM", () => {
    setup(MIN_ZOOM);
    render(<ZoomControls />);
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(useChartStore.getState().zoomOut).not.toHaveBeenCalled();
  });

  it("does not call zoomIn when zoom in button is clicked at MAX_ZOOM", () => {
    setup(MAX_ZOOM);
    render(<ZoomControls />);
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(useChartStore.getState().zoomIn).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Slider
  // -------------------------------------------------------------------------

  it("calls setZoom when the slider changes", async () => {
    render(<ZoomControls />);
    const slider = screen.getByRole("slider", { name: "Zoom level" });
    fireEvent.change(slider, { target: { value: "150" } });
    expect(useChartStore.getState().setZoom).toHaveBeenCalledWith(
      1.5,
      expect.objectContaining({ date: expect.any(Date) })
    );
  });

  // -------------------------------------------------------------------------
  // Zoom in / Zoom out buttons
  // -------------------------------------------------------------------------

  it("calls zoomIn when zoom in button is clicked", () => {
    render(<ZoomControls />);
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(useChartStore.getState().zoomIn).toHaveBeenCalledOnce();
  });

  it("calls zoomOut when zoom out button is clicked", () => {
    render(<ZoomControls />);
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(useChartStore.getState().zoomOut).toHaveBeenCalledOnce();
  });

  // -------------------------------------------------------------------------
  // Fit to view
  // -------------------------------------------------------------------------

  it("calls fitToView with task list when fit-to-view button is clicked", () => {
    render(<ZoomControls />);
    fireEvent.click(screen.getByRole("button", { name: "Fit to view" }));
    expect(useChartStore.getState().fitToView).toHaveBeenCalledWith([]);
  });

  // -------------------------------------------------------------------------
  // Zoom dialog
  // -------------------------------------------------------------------------

  it("opens zoom dialog when percentage button is clicked", () => {
    render(<ZoomControls />);
    expect(screen.queryByTestId("zoom-dialog")).not.toBeInTheDocument();

    const percentageButton = screen.getByRole("button", {
      name: /Open zoom dialog/i,
    });
    fireEvent.click(percentageButton);

    expect(screen.getByTestId("zoom-dialog")).toBeInTheDocument();
  });

  it("closes zoom dialog when Close is clicked", () => {
    render(<ZoomControls />);
    fireEvent.click(screen.getByRole("button", { name: /Open zoom dialog/i }));
    expect(screen.getByTestId("zoom-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("zoom-dialog")).not.toBeInTheDocument();
  });

  it("calls setZoom and closes dialog when a zoom value is selected", () => {
    render(<ZoomControls />);
    fireEvent.click(screen.getByRole("button", { name: /Open zoom dialog/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select 50%" }));

    expect(useChartStore.getState().setZoom).toHaveBeenCalledWith(
      0.5,
      expect.objectContaining({ date: expect.any(Date) })
    );
    expect(screen.queryByTestId("zoom-dialog")).not.toBeInTheDocument();
  });

  it("calls fitToView and closes dialog when 'fit' is selected", () => {
    render(<ZoomControls />);
    fireEvent.click(screen.getByRole("button", { name: /Open zoom dialog/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select Fit" }));

    expect(useChartStore.getState().fitToView).toHaveBeenCalledWith([]);
    expect(screen.queryByTestId("zoom-dialog")).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it("slider has aria-valuemin, aria-valuemax, aria-valuenow, and aria-valuetext", () => {
    setup(1.0);
    render(<ZoomControls />);
    const slider = screen.getByRole("slider", { name: "Zoom level" });
    expect(slider).toHaveAttribute("aria-valuemin", String(MIN_ZOOM * 100));
    expect(slider).toHaveAttribute("aria-valuemax", String(MAX_ZOOM * 100));
    expect(slider).toHaveAttribute("aria-valuenow", "100");
    expect(slider).toHaveAttribute("aria-valuetext", "100%");
  });
});
