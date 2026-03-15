/**
 * Unit tests for columnActions (column width management and auto-fit).
 *
 * Tests setColumnWidth, autoFitColumn, and autoFitAllColumns actions
 * exposed via useTaskStore.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useHistoryStore } from "@/store/slices/historySlice";
import type { Task } from "@/types/chart.types";
import { COLORS } from "@/styles/design-tokens";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/utils/textMeasurement", () => ({
  calculateColumnWidth: vi.fn(
    ({
      cellValues,
      extraWidths,
    }: {
      headerLabel: string;
      cellValues: string[];
      fontSize: number;
      cellPadding: number;
      extraWidths: number[];
    }) => {
      // Return a deterministic width: base 60 + max extra width + 5 per cell value char
      const maxExtra = extraWidths.length
        ? Math.max(...extraWidths)
        : 0;
      const maxTextLen = cellValues.length
        ? Math.max(...cellValues.map((v) => v.length))
        : 0;
      return 60 + maxExtra + maxTextLen * 5;
    }
  ),
}));

vi.mock("@/store/slices/userPreferencesSlice", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/store/slices/userPreferencesSlice")>();
  return {
    ...original,
    getCurrentDensityConfig: vi.fn(() => ({
      rowHeight: 32,
      fontSizeCell: 13,
      fontSizeHeader: 11,
      cellPaddingX: 8,
      cellPaddingY: 4,
      indentSize: 20,
      iconSize: 16,
      columnWidths: {
        rowNumber: 40,
        color: 32,
        nameMin: 200,
        startDate: 130,
        endDate: 130,
        duration: 100,
        progress: 70,
      },
    })),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeTask = (
  id: string,
  overrides: Partial<Task> = {}
): Task => ({
  id,
  name: `Task ${id}`,
  startDate: "2025-01-01",
  endDate: "2025-01-07",
  duration: 7,
  progress: 0,
  color: COLORS.chart.taskDefault,
  order: 0,
  metadata: {},
  type: "task",
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("columnActions", () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      selectedTaskIds: [],
      lastSelectedTaskId: null,
      activeCell: { taskId: null, field: null },
      isEditingCell: false,
      columnWidths: {},
      taskTableWidth: null,
    });
    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      isUndoing: false,
      isRedoing: false,
    });
  });

  describe("setColumnWidth", () => {
    it("should set width for a given column id", () => {
      useTaskStore.getState().setColumnWidth("name", 250);
      expect(useTaskStore.getState().columnWidths["name"]).toBe(250);
    });

    it("should overwrite an existing column width", () => {
      useTaskStore.getState().setColumnWidth("name", 250);
      useTaskStore.getState().setColumnWidth("name", 300);
      expect(useTaskStore.getState().columnWidths["name"]).toBe(300);
    });
  });

  describe("autoFitColumn", () => {
    it("should auto-fit the name column with hierarchy indent for child tasks", () => {
      const parent = makeTask("p1", { name: "Parent", type: "group" });
      const child = makeTask("c1", {
        name: "Child Task",
        parentId: "p1",
      });
      useTaskStore.setState({ tasks: [parent, child] });

      useTaskStore.getState().autoFitColumn("name");

      const width = useTaskStore.getState().columnWidths["name"];
      expect(width).toBeDefined();
      expect(width).toBeGreaterThan(0);
    });

    it("should auto-fit a non-name column (startDate)", () => {
      useTaskStore.setState({
        tasks: [makeTask("t1"), makeTask("t2")],
      });

      useTaskStore.getState().autoFitColumn("startDate");

      const width = useTaskStore.getState().columnWidths["startDate"];
      expect(width).toBeDefined();
      expect(width).toBeGreaterThan(0);
    });

    it("should handle empty task list (header-only width)", () => {
      useTaskStore.setState({ tasks: [] });

      useTaskStore.getState().autoFitColumn("name");

      const width = useTaskStore.getState().columnWidths["name"];
      expect(width).toBeDefined();
      expect(width).toBeGreaterThan(0);
    });

    it("should not set width for an unknown column id", () => {
      useTaskStore.setState({ tasks: [makeTask("t1")] });

      useTaskStore.getState().autoFitColumn("nonexistent");

      expect(useTaskStore.getState().columnWidths["nonexistent"]).toBeUndefined();
    });

    it("should not set width for a column with no field (rowNumber)", () => {
      useTaskStore.setState({ tasks: [makeTask("t1")] });

      useTaskStore.getState().autoFitColumn("rowNumber");

      expect(useTaskStore.getState().columnWidths["rowNumber"]).toBeUndefined();
    });

    it("should use formatter for duration column values", () => {
      useTaskStore.setState({
        tasks: [makeTask("t1", { duration: 14 })],
      });

      useTaskStore.getState().autoFitColumn("duration");

      const width = useTaskStore.getState().columnWidths["duration"];
      expect(width).toBeDefined();
      expect(width).toBeGreaterThan(0);
    });
  });

  describe("autoFitAllColumns", () => {
    it("should fit all data columns except color", () => {
      useTaskStore.setState({
        tasks: [makeTask("t1"), makeTask("t2")],
      });

      useTaskStore.getState().autoFitAllColumns();

      const widths = useTaskStore.getState().columnWidths;
      // name, startDate, endDate, duration, progress should all be set
      expect(widths["name"]).toBeDefined();
      expect(widths["startDate"]).toBeDefined();
      expect(widths["endDate"]).toBeDefined();
      expect(widths["duration"]).toBeDefined();
      expect(widths["progress"]).toBeDefined();
      // color should NOT be set
      expect(widths["color"]).toBeUndefined();
    });
  });
});
