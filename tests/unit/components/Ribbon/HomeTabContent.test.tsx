/**
 * Smoke render tests for HomeTabContent component.
 *
 * Verifies the component mounts, key toolbar buttons are present,
 * and aria-labels are correctly set. Business logic is tested in
 * useHomeTabActions.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeTabContent } from "../../../../src/components/Ribbon/HomeTabContent";
import { useTaskStore } from "../../../../src/store/slices/taskSlice";
import { useChartStore } from "../../../../src/store/slices/chartSlice";
import { useHistoryStore } from "../../../../src/store/slices/historySlice";

// Mock clipboard operations
vi.mock("../../../../src/hooks/useClipboardOperations", () => ({
  useClipboardOperations: () => ({
    handleCopy: vi.fn(),
    handleCut: vi.fn(),
    handlePaste: vi.fn(),
    canCopyOrCut: false,
    canPaste: false,
  }),
}));

// Mock hide operations
vi.mock("../../../../src/hooks/useHideOperations", () => ({
  useHideOperations: () => ({
    hideRows: vi.fn(),
    unhideSelection: vi.fn(),
    getHiddenInSelectionCount: vi.fn().mockReturnValue(0),
  }),
}));

// Mock ColorDropdown — renders a placeholder to avoid deep dependency tree
vi.mock("../../../../src/components/Ribbon/ColorDropdown", () => ({
  ColorDropdown: () => <button data-testid="color-dropdown">Colors</button>,
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe("HomeTabContent", () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      selectedTaskIds: [],
      activeCell: { taskId: null, field: null },
    });
    useChartStore.setState({ hiddenTaskIds: [] });
    useHistoryStore.setState({ undoStack: [], redoStack: [] });
  });

  it("renders without crashing", () => {
    const { container } = render(<HomeTabContent />);
    expect(container).toBeTruthy();
  });

  it("renders the Add Task button", () => {
    render(<HomeTabContent />);
    expect(screen.getByLabelText("Add new task")).toBeInTheDocument();
  });

  it("renders history buttons with correct aria-labels when empty", () => {
    render(<HomeTabContent />);
    expect(screen.getByLabelText("Nothing to undo")).toBeInTheDocument();
    expect(screen.getByLabelText("Nothing to redo")).toBeInTheDocument();
  });

  it("renders clipboard buttons", () => {
    render(<HomeTabContent />);
    expect(screen.getByLabelText("Copy")).toBeInTheDocument();
    expect(screen.getByLabelText("Cut")).toBeInTheDocument();
    expect(screen.getByLabelText("Paste")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete")).toBeInTheDocument();
  });

  it("renders structure buttons", () => {
    render(<HomeTabContent />);
    expect(screen.getByLabelText("Insert task above")).toBeInTheDocument();
    expect(screen.getByLabelText("Insert task below")).toBeInTheDocument();
    expect(screen.getByLabelText("Indent")).toBeInTheDocument();
    expect(screen.getByLabelText("Outdent")).toBeInTheDocument();
    expect(screen.getByLabelText("Group selected tasks")).toBeInTheDocument();
    expect(screen.getByLabelText("Ungroup selected tasks")).toBeInTheDocument();
  });

  it("renders hide/unhide buttons", () => {
    render(<HomeTabContent />);
    expect(screen.getByLabelText("Hide selected rows")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Unhide rows in selection")
    ).toBeInTheDocument();
  });

  it("renders toolbar group labels for accessibility", () => {
    render(<HomeTabContent />);
    expect(screen.getByRole("group", { name: "History" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Clipboard" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Structure" })
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Colors" })).toBeInTheDocument();
  });

  it("shows hidden count badge when tasks are hidden", () => {
    useChartStore.setState({ hiddenTaskIds: ["t1", "t2", "t3"] });
    render(<HomeTabContent />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Unhide rows in selection (3 hidden)")
    ).toBeInTheDocument();
  });

  it("does not show badge when no tasks are hidden", () => {
    render(<HomeTabContent />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
