/**
 * Smoke render tests for ViewTabContent component.
 *
 * Verifies the component mounts, key toolbar buttons are present,
 * and aria-labels/toggle states are correctly set. Business logic
 * is tested in useViewTabActions.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ViewTabContent } from "../../../../src/components/Ribbon/ViewTabContent";
import { useChartStore } from "../../../../src/store/slices/chartSlice";

// Mock useZoom helpers
vi.mock("../../../../src/hooks/useZoom", () => ({
  getViewportCenterAnchor: vi.fn(() => ({ scrollLeft: 0, clientX: 400 })),
  applyScrollLeft: vi.fn(),
}));

// Mock HolidayRegionPopover — renders a placeholder to avoid deep dependency tree
vi.mock("../../../../src/components/Ribbon/HolidayRegionPopover", () => ({
  HolidayRegionPopover: () => (
    <button data-testid="holiday-region-popover">Region</button>
  ),
}));

// Mock ZoomDropdown — renders a placeholder
vi.mock("../../../../src/components/Ribbon/ZoomDropdown", () => ({
  ZoomDropdown: ({
    zoomPercentage,
  }: {
    zoomPercentage: number;
    zoomOptions: number[];
    onSelectLevel: (level: number | "fit") => void;
  }) => <span data-testid="zoom-dropdown">{zoomPercentage}%</span>,
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe("ViewTabContent", () => {
  beforeEach(() => {
    useChartStore.setState({
      zoom: 1.0,
      showTodayMarker: true,
      showWeekends: true,
      showHolidays: false,
      showDependencies: true,
      showProgress: true,
      isTaskTableCollapsed: false,
    });
  });

  it("renders without crashing", () => {
    const { container } = render(<ViewTabContent />);
    expect(container).toBeTruthy();
  });

  it("renders show/hide toggle buttons", () => {
    render(<ViewTabContent />);
    expect(screen.getByLabelText("Hide Today Marker")).toBeInTheDocument();
    expect(screen.getByLabelText("Hide Weekends")).toBeInTheDocument();
    expect(screen.getByLabelText("Show Holidays")).toBeInTheDocument();
    expect(screen.getByLabelText("Hide Dependencies")).toBeInTheDocument();
    expect(screen.getByLabelText("Hide Progress")).toBeInTheDocument();
  });

  it("renders toggle buttons with correct aria-pressed state", () => {
    render(<ViewTabContent />);

    const todayBtn = screen.getByLabelText("Hide Today Marker");
    expect(todayBtn).toHaveAttribute("aria-pressed", "true");

    const holidaysBtn = screen.getByLabelText("Show Holidays");
    expect(holidaysBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("reflects toggled state in aria-labels", () => {
    useChartStore.setState({
      showTodayMarker: false,
      showHolidays: true,
    });
    render(<ViewTabContent />);

    expect(screen.getByLabelText("Show Today Marker")).toBeInTheDocument();
    expect(screen.getByLabelText("Hide Holidays")).toBeInTheDocument();
  });

  it("renders zoom controls", () => {
    render(<ViewTabContent />);
    expect(screen.getByLabelText("Zoom in")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom out")).toBeInTheDocument();
    expect(screen.getByLabelText("Fit to width")).toBeInTheDocument();
  });

  it("renders zoom percentage display", () => {
    render(<ViewTabContent />);
    expect(screen.getByTestId("zoom-dropdown")).toHaveTextContent("100%");
  });

  it("renders layout toggle", () => {
    render(<ViewTabContent />);
    expect(screen.getByLabelText("Hide Task Table")).toBeInTheDocument();
  });

  it("reflects collapsed task table state", () => {
    useChartStore.setState({ isTaskTableCollapsed: true });
    render(<ViewTabContent />);
    expect(screen.getByLabelText("Show Task Table")).toBeInTheDocument();
  });

  it("renders toolbar group labels for accessibility", () => {
    render(<ViewTabContent />);
    expect(
      screen.getByRole("group", { name: "Show/Hide" })
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Zoom" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Layout" })).toBeInTheDocument();
  });
});
