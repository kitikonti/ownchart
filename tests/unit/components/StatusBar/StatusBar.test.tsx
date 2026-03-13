/**
 * Unit tests for StatusBar component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatusBar } from "@/components/StatusBar/StatusBar";
import { useChartStore } from "@/store/slices/chartSlice";
import { useUIStore } from "@/store/slices/uiSlice";
import { useTaskStatistics } from "@/hooks/useTaskStatistics";

// Avoid rendering ZoomControls' deep dependency tree in these unit tests
vi.mock("@/components/StatusBar/ZoomControls", () => ({
  ZoomControls: () => <div data-testid="zoom-controls" />,
}));

vi.mock("@/hooks/useTaskStatistics");

const mockTaskStats = useTaskStatistics as Mock;

describe("StatusBar", () => {
  beforeEach(() => {
    mockTaskStats.mockReturnValue({
      totalTasks: 5,
      completedTasks: 2,
      overdueTasks: 0,
    });
    useChartStore.setState({ showProgress: false });
    useUIStore.setState({ isAboutDialogOpen: false });
  });

  it("renders without crashing", () => {
    const { container } = render(<StatusBar />);
    expect(container).toBeTruthy();
  });

  it("renders ZoomControls", () => {
    render(<StatusBar />);
    expect(screen.getByTestId("zoom-controls")).toBeInTheDocument();
  });

  // F004: version button must be a sibling of — not nested inside — the live region
  it("version button is outside the role=status live region", () => {
    render(<StatusBar />);
    const statusRegion = screen.getByRole("status");
    const versionButton = screen.getByRole("button", { name: "About OwnChart" });
    expect(statusRegion.contains(versionButton)).toBe(false);
  });

  it("role=status region has accessible label", () => {
    render(<StatusBar />);
    expect(
      screen.getByRole("status", { name: "Task statistics" })
    ).toBeInTheDocument();
  });

  it("version button has aria-label", () => {
    render(<StatusBar />);
    expect(
      screen.getByRole("button", { name: "About OwnChart" })
    ).toBeInTheDocument();
  });

  it("clicking the version button opens the About dialog", () => {
    render(<StatusBar />);
    fireEvent.click(screen.getByRole("button", { name: "About OwnChart" }));
    expect(useUIStore.getState().isAboutDialogOpen).toBe(true);
  });

  it("shows task count (plural)", () => {
    render(<StatusBar />);
    expect(screen.getByText("5 Tasks")).toBeInTheDocument();
  });

  it("shows singular Task label for exactly one task", () => {
    mockTaskStats.mockReturnValue({
      totalTasks: 1,
      completedTasks: 0,
      overdueTasks: 0,
    });
    render(<StatusBar />);
    expect(screen.getByText("1 Task")).toBeInTheDocument();
  });

  it("hides progress stats when showProgress is false", () => {
    useChartStore.setState({ showProgress: false });
    render(<StatusBar />);
    expect(screen.queryByText("2 Completed")).not.toBeInTheDocument();
  });

  it("shows completed count when showProgress is true", () => {
    useChartStore.setState({ showProgress: true });
    render(<StatusBar />);
    expect(screen.getByText("2 Completed")).toBeInTheDocument();
  });

  it("hides overdue stat when overdueTasks is zero", () => {
    useChartStore.setState({ showProgress: true });
    render(<StatusBar />);
    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
  });

  it("shows overdue count when overdueTasks > 0", () => {
    mockTaskStats.mockReturnValue({
      totalTasks: 5,
      completedTasks: 2,
      overdueTasks: 3,
    });
    useChartStore.setState({ showProgress: true });
    render(<StatusBar />);
    expect(screen.getByText("3 Overdue")).toBeInTheDocument();
  });
});
