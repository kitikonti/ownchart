/**
 * Unit tests for TimelinePanel component.
 * Verifies region rendering, context menu lifecycle, and scale-conditional
 * SVG header rendering.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelinePanel } from "@/components/Layout/TimelinePanel";
import { useChartStore } from "@/store/slices/chartSlice";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useHeaderDateSelection } from "@/hooks/useHeaderDateSelection";

// Mock heavy GanttChart sub-components — rendering them requires full D3 setup.
vi.mock("../../../../src/components/GanttChart", () => ({
  ChartCanvas: () => <div data-testid="chart-canvas" />,
  TimelineHeader: () => <g data-testid="timeline-header" />,
  SelectionHighlight: () => <g data-testid="selection-highlight" />,
}));

// Mock ContextMenu to avoid portal issues.
vi.mock("../../../../src/components/ContextMenu/ContextMenu", () => ({
  ContextMenu: ({
    onClose,
    ariaLabel,
  }: {
    onClose: () => void;
    ariaLabel?: string;
  }) => (
    <div data-testid="context-menu" aria-label={ariaLabel}>
      <button onClick={onClose}>Close menu</button>
    </div>
  ),
}));

// Mock useHeaderDateSelection so tests control its return value.
vi.mock("../../../../src/hooks/useHeaderDateSelection");
const mockUseHeaderDateSelection = useHeaderDateSelection as Mock;

const defaultSelectionResult = {
  selectionPixelRect: null,
  isDragging: false,
  contextMenu: null,
  contextMenuItems: [],
  closeContextMenu: vi.fn(),
  onMouseDown: vi.fn(),
  onContextMenu: vi.fn(),
};

const defaultProps = {
  timelineHeaderScrollRef: { current: null },
  chartContainerRef: { current: null },
  chartTranslateRef: { current: null },
  timelineHeaderWidth: 2000,
  contentAreaHeight: 600,
  chartContainerWidth: 2000,
  orderedTasks: [],
};

function setup(
  selectionOverrides: Partial<typeof defaultSelectionResult> = {},
  scale: unknown = { startDate: new Date("2024-01-01") }
) {
  mockUseHeaderDateSelection.mockReturnValue({
    ...defaultSelectionResult,
    ...selectionOverrides,
  });
  useChartStore.setState({ scale } as Partial<
    ReturnType<typeof useChartStore.getState>
  > as ReturnType<typeof useChartStore.getState>);
  useTaskStore.setState({ selectedTaskIds: [] });
}

describe("TimelinePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  // -------------------------------------------------------------------------
  // Region and basic structure
  // -------------------------------------------------------------------------

  it("renders a region labelled 'Timeline'", () => {
    render(<TimelinePanel {...defaultProps} />);
    expect(
      screen.getByRole("region", { name: "Timeline" })
    ).toBeInTheDocument();
  });

  it("renders the ChartCanvas", () => {
    render(<TimelinePanel {...defaultProps} />);
    expect(screen.getByTestId("chart-canvas")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Scale-conditional SVG rendering
  // -------------------------------------------------------------------------

  it("renders the timeline header SVG when scale is set", () => {
    setup({}, { startDate: new Date("2024-01-01") });
    const { container } = render(<TimelinePanel {...defaultProps} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("does not render the timeline header SVG when scale is null", () => {
    setup({}, null);
    const { container } = render(<TimelinePanel {...defaultProps} />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Context menu
  // -------------------------------------------------------------------------

  it("does not render context menu when contextMenu is null", () => {
    setup({ contextMenu: null });
    render(<TimelinePanel {...defaultProps} />);
    expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
  });

  it("renders context menu when contextMenu position is provided", () => {
    setup({ contextMenu: { x: 100, y: 200 } });
    render(<TimelinePanel {...defaultProps} />);
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
  });

  it("passes ariaLabel 'Timeline header actions' to the context menu", () => {
    setup({ contextMenu: { x: 100, y: 200 } });
    render(<TimelinePanel {...defaultProps} />);
    expect(
      screen.getByLabelText("Timeline header actions")
    ).toBeInTheDocument();
  });

  it("calls closeContextMenu when the context menu Close button is clicked", () => {
    const closeContextMenu = vi.fn();
    setup({ contextMenu: { x: 100, y: 200 }, closeContextMenu });
    render(<TimelinePanel {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(closeContextMenu).toHaveBeenCalledOnce();
  });
});
