/**
 * Unit tests for chartSlice column visibility actions
 * toggleColumnVisibility & setHiddenColumns with SplitPane width adjustment
 */

import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import { useTaskStore } from "../../../src/store/slices/taskSlice";

describe("Chart Store - Column Visibility", () => {
  beforeEach(() => {
    // Reset chart store hidden columns
    useChartStore.setState({
      hiddenColumns: [],
    });
    // Reset task store to known table width and column widths
    useTaskStore.setState({
      taskTableWidth: 600,
      columnWidths: {},
    });
  });

  describe("toggleColumnVisibility", () => {
    it("should hide a visible hideable column", () => {
      expect(useChartStore.getState().hiddenColumns).toEqual([]);

      act(() => {
        useChartStore.getState().toggleColumnVisibility("startDate");
      });

      expect(useChartStore.getState().hiddenColumns).toContain("startDate");
    });

    it("should show a hidden column", () => {
      useChartStore.setState({ hiddenColumns: ["startDate"] });

      act(() => {
        useChartStore.getState().toggleColumnVisibility("startDate");
      });

      expect(useChartStore.getState().hiddenColumns).not.toContain("startDate");
    });

    it("should not toggle non-hideable columns", () => {
      act(() => {
        useChartStore.getState().toggleColumnVisibility("name");
      });

      expect(useChartStore.getState().hiddenColumns).toEqual([]);
    });

    it("should not toggle non-existent columns", () => {
      act(() => {
        useChartStore.getState().toggleColumnVisibility("nonExistent");
      });

      expect(useChartStore.getState().hiddenColumns).toEqual([]);
    });

    it("should adjust taskTableWidth when hiding a column", () => {
      const initialWidth = useTaskStore.getState().taskTableWidth!;

      act(() => {
        useChartStore.getState().toggleColumnVisibility("startDate");
      });

      // Width should decrease
      expect(useTaskStore.getState().taskTableWidth).toBeLessThan(initialWidth);
    });

    it("should adjust taskTableWidth when showing a column", () => {
      useChartStore.setState({ hiddenColumns: ["startDate"] });
      const initialWidth = useTaskStore.getState().taskTableWidth!;

      act(() => {
        useChartStore.getState().toggleColumnVisibility("startDate");
      });

      // Width should increase
      expect(useTaskStore.getState().taskTableWidth).toBeGreaterThan(
        initialWidth
      );
    });

    it("should enforce minimum table width", () => {
      // Set a very small table width
      useTaskStore.setState({ taskTableWidth: 210 });

      act(() => {
        useChartStore.getState().toggleColumnVisibility("startDate");
      });

      // Should not go below MIN_TABLE_WIDTH (200)
      expect(useTaskStore.getState().taskTableWidth).toBeGreaterThanOrEqual(200);
    });
  });

  describe("setHiddenColumns", () => {
    it("should set hidden columns in bulk", () => {
      act(() => {
        useChartStore
          .getState()
          .setHiddenColumns(["startDate", "endDate"]);
      });

      expect(useChartStore.getState().hiddenColumns).toEqual([
        "startDate",
        "endDate",
      ]);
    });

    it("should replace previous hidden columns", () => {
      useChartStore.setState({ hiddenColumns: ["startDate"] });

      act(() => {
        useChartStore.getState().setHiddenColumns(["duration", "progress"]);
      });

      expect(useChartStore.getState().hiddenColumns).toEqual([
        "duration",
        "progress",
      ]);
    });

    it("should adjust taskTableWidth for delta (newly hidden columns shrink)", () => {
      const initialWidth = useTaskStore.getState().taskTableWidth!;

      act(() => {
        useChartStore.getState().setHiddenColumns(["startDate"]);
      });

      expect(useTaskStore.getState().taskTableWidth).toBeLessThan(initialWidth);
    });

    it("should adjust taskTableWidth for delta (newly shown columns expand)", () => {
      // Start with a column hidden
      useChartStore.setState({ hiddenColumns: ["startDate"] });
      const initialWidth = useTaskStore.getState().taskTableWidth!;

      act(() => {
        useChartStore.getState().setHiddenColumns([]);
      });

      expect(useTaskStore.getState().taskTableWidth).toBeGreaterThan(
        initialWidth
      );
    });

    it("should not adjust width when no delta", () => {
      useChartStore.setState({ hiddenColumns: ["startDate"] });
      const initialWidth = useTaskStore.getState().taskTableWidth!;

      act(() => {
        useChartStore.getState().setHiddenColumns(["startDate"]);
      });

      expect(useTaskStore.getState().taskTableWidth).toBe(initialWidth);
    });

    it("should handle clearing all hidden columns", () => {
      useChartStore.setState({
        hiddenColumns: ["startDate", "endDate", "duration"],
      });

      act(() => {
        useChartStore.getState().setHiddenColumns([]);
      });

      expect(useChartStore.getState().hiddenColumns).toEqual([]);
    });
  });
});
