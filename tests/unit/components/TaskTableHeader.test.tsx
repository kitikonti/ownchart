/**
 * Tests for TaskTableHeader component.
 * Verifies header rendering, select-all behavior, and column resizer presence.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskTableHeader } from "@/components/TaskList/TaskTableHeader";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSelectAllTasks = vi.fn();
const mockClearSelection = vi.fn();
let mockTasks: { id: string }[] = [{ id: "t1" }, { id: "t2" }];
let mockSelectedTaskIds: string[] = [];

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        tasks: mockTasks,
        selectedTaskIds: mockSelectedTaskIds,
        selectAllTasks: mockSelectAllTasks,
        clearSelection: mockClearSelection,
        columnWidths: {},
        setColumnWidth: vi.fn(),
        autoFitColumn: vi.fn(),
      })
  ),
}));

vi.mock("../../../src/store/slices/userPreferencesSlice", () => ({
  useDensityConfig: vi.fn(() => ({
    rowHeight: 36,
    taskBarHeight: 26,
    taskBarOffset: 5,
    cellPaddingY: 6,
    cellPaddingX: 10,
    headerPaddingY: 12,
    fontSizeCell: 15,
    fontSizeBar: 12,
    fontSizeHeader: 11,
    iconSize: 16,
    checkboxSize: 16,
    indentSize: 18,
    colorBarHeight: 24,
    columnWidths: {
      rowNumber: 52,
      color: 30,
      nameMin: 180,
      startDate: 118,
      endDate: 118,
      duration: 90,
      progress: 62,
    },
  })),
}));

vi.mock("../../../src/store/slices/chartSlice", () => ({
  useChartStore: vi.fn(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        hiddenColumns: [],
      })
  ),
}));

vi.mock("../../../src/hooks/useTableDimensions", () => ({
  useTableDimensions: () => ({ totalColumnWidth: 800 }),
}));

vi.mock("../../../src/hooks/useTableHeaderContextMenu", () => ({
  useTableHeaderContextMenu: () => ({
    contextMenu: null,
    contextMenuItems: [],
    handleHeaderContextMenu: vi.fn(),
    closeContextMenu: vi.fn(),
  }),
}));

vi.mock("../../../src/components/TaskList/ColumnResizer", () => ({
  ColumnResizer: () => <div data-testid="column-resizer" />,
}));

vi.mock("../../../src/components/ContextMenu/ContextMenu", () => ({
  ContextMenu: () => <div data-testid="context-menu" />,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TaskTableHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTasks = [{ id: "t1" }, { id: "t2" }];
    mockSelectedTaskIds = [];
  });

  it('should render with role="row"', () => {
    render(<TaskTableHeader />);
    expect(screen.getByRole("row")).toBeInTheDocument();
  });

  it("should render column headers for visible columns", () => {
    render(<TaskTableHeader />);
    // Name column should have header text
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Start Date")).toBeInTheDocument();
    expect(screen.getByText("End Date")).toBeInTheDocument();
    expect(screen.getByText("Duration")).toBeInTheDocument();
    // Progress uses "%" label
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("should render ColumnResizer only on name column", () => {
    render(<TaskTableHeader />);
    const resizers = screen.getAllByTestId("column-resizer");
    expect(resizers).toHaveLength(1);
  });

  it("should render select-all triangle SVG in rowNumber column", () => {
    render(<TaskTableHeader />);
    // The select-all button
    const selectAllButton = screen.getByRole("button", {
      name: "Select all tasks",
    });
    expect(selectAllButton).toBeInTheDocument();
    // Should have an SVG child
    expect(selectAllButton.querySelector("svg")).toBeTruthy();
  });

  it("should call selectAllTasks when not all selected", () => {
    mockSelectedTaskIds = ["t1"]; // only one of two selected
    render(<TaskTableHeader />);

    const selectAllButton = screen.getByRole("button", {
      name: "Select all tasks",
    });
    fireEvent.click(selectAllButton);

    expect(mockSelectAllTasks).toHaveBeenCalled();
    expect(mockClearSelection).not.toHaveBeenCalled();
  });

  it("should call clearSelection when all are selected", () => {
    mockSelectedTaskIds = ["t1", "t2"];
    render(<TaskTableHeader />);

    const selectAllButton = screen.getByRole("button", {
      name: "Deselect all tasks",
    });
    fireEvent.click(selectAllButton);

    expect(mockClearSelection).toHaveBeenCalled();
    expect(mockSelectAllTasks).not.toHaveBeenCalled();
  });

  it("should not consider all selected when tasks array is empty", () => {
    mockTasks = [];
    mockSelectedTaskIds = [];
    render(<TaskTableHeader />);

    const selectAllButton = screen.getByRole("button", {
      name: "Select all tasks",
    });
    expect(selectAllButton).toBeInTheDocument();
  });

  it("should use grid class on the header row", () => {
    render(<TaskTableHeader />);
    const row = screen.getByRole("row");
    expect(row.className).toContain("grid");
  });
});
