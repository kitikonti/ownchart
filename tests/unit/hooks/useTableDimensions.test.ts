/**
 * Tests for useTableDimensions hook.
 * Verifies that total column width is calculated correctly based on visible
 * columns, density config, and custom column widths.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTableDimensions } from "@/hooks/useTableDimensions";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { useUserPreferencesStore } from "@/store/slices/userPreferencesSlice";
import { DENSITY_CONFIG } from "@/config/densityConfig";

// ─── Setup ───

beforeEach(() => {
  // Reset to normal density, no custom widths, no hidden columns
  useUserPreferencesStore.setState({
    preferences: {
      uiDensity: "normal",
      dateFormat: "DD/MM/YYYY",
      firstDayOfWeek: 1,
      weekNumberingSystem: "iso",
    },
  });
  useTaskStore.setState({ columnWidths: {} });
  useChartStore.getState().setHiddenColumns([]);
});

// ─── Helpers ───

/**
 * Sum of all "normal" density default widths for all 7 visible columns.
 * rowNumber(52) + color(30) + name(180) + startDate(118) + endDate(118) + duration(90) + progress(62)
 */
const NORMAL_DENSITY_ALL_COLUMNS_WIDTH =
  DENSITY_CONFIG.normal.columnWidths.rowNumber +
  DENSITY_CONFIG.normal.columnWidths.color +
  DENSITY_CONFIG.normal.columnWidths.nameMin +
  DENSITY_CONFIG.normal.columnWidths.startDate +
  DENSITY_CONFIG.normal.columnWidths.endDate +
  DENSITY_CONFIG.normal.columnWidths.duration +
  DENSITY_CONFIG.normal.columnWidths.progress;

// ─── Tests ───

describe("useTableDimensions", () => {
  it("should return the total width of all columns at normal density with no hidden columns", () => {
    const { result } = renderHook(() => useTableDimensions());

    expect(result.current.totalColumnWidth).toBe(NORMAL_DENSITY_ALL_COLUMNS_WIDTH);
  });

  it("should reduce total width when hideable columns are hidden", () => {
    // Hide startDate and endDate
    act(() => {
      useChartStore.getState().setHiddenColumns(["startDate", "endDate"]);
    });

    const { result } = renderHook(() => useTableDimensions());

    const expectedWidth =
      NORMAL_DENSITY_ALL_COLUMNS_WIDTH -
      DENSITY_CONFIG.normal.columnWidths.startDate -
      DENSITY_CONFIG.normal.columnWidths.endDate;

    expect(result.current.totalColumnWidth).toBe(expectedWidth);
  });

  it("should use custom column width when set in the store", () => {
    // Set a custom width for the name column (overrides the density default)
    act(() => {
      useTaskStore.setState({ columnWidths: { name: 400 } });
    });

    const { result } = renderHook(() => useTableDimensions());

    const expectedWidth =
      NORMAL_DENSITY_ALL_COLUMNS_WIDTH -
      DENSITY_CONFIG.normal.columnWidths.nameMin +
      400;

    expect(result.current.totalColumnWidth).toBe(expectedWidth);
  });

  it("should reflect compact density widths when density changes", () => {
    act(() => {
      useUserPreferencesStore.setState({
        preferences: {
          uiDensity: "compact",
          dateFormat: "DD/MM/YYYY",
          firstDayOfWeek: 1,
          weekNumberingSystem: "iso",
        },
      });
    });

    const { result } = renderHook(() => useTableDimensions());

    const expectedWidth =
      DENSITY_CONFIG.compact.columnWidths.rowNumber +
      DENSITY_CONFIG.compact.columnWidths.color +
      DENSITY_CONFIG.compact.columnWidths.nameMin +
      DENSITY_CONFIG.compact.columnWidths.startDate +
      DENSITY_CONFIG.compact.columnWidths.endDate +
      DENSITY_CONFIG.compact.columnWidths.duration +
      DENSITY_CONFIG.compact.columnWidths.progress;

    expect(result.current.totalColumnWidth).toBe(expectedWidth);
  });

  it("should update reactively when hidden columns change", () => {
    const { result } = renderHook(() => useTableDimensions());

    expect(result.current.totalColumnWidth).toBe(NORMAL_DENSITY_ALL_COLUMNS_WIDTH);

    act(() => {
      useChartStore.getState().setHiddenColumns(["progress"]);
    });

    expect(result.current.totalColumnWidth).toBe(
      NORMAL_DENSITY_ALL_COLUMNS_WIDTH - DENSITY_CONFIG.normal.columnWidths.progress
    );
  });

  it("should update reactively when custom column widths change", () => {
    const { result } = renderHook(() => useTableDimensions());

    const initialWidth = result.current.totalColumnWidth;

    act(() => {
      useTaskStore.setState({ columnWidths: { duration: 200 } });
    });

    const expectedDelta = 200 - DENSITY_CONFIG.normal.columnWidths.duration;
    expect(result.current.totalColumnWidth).toBe(initialWidth + expectedDelta);
  });

  // ── WD-mode duration column floor (#81 / #82) ──────────────────────────
  //
  // When workingDaysMode is on, the duration column header shows "DURATION wd"
  // and getColumnPixelWidth applies a +28px floor (DURATION_WD_EXTRA_PX).
  // useTableDimensions must reflect that floor so the split pane's maxLeftWidth
  // doesn't clip the wider column.

  it("should widen when workingDaysMode is enabled (duration +28px floor)", () => {
    const { result } = renderHook(() => useTableDimensions());
    const widthOff = result.current.totalColumnWidth;

    act(() => {
      useChartStore.setState({ workingDaysMode: true });
    });

    const widthOn = result.current.totalColumnWidth;
    // The WD floor adds 28px to the duration column's default width.
    // DURATION_WD_EXTRA_PX = 28 (from tableColumns.ts)
    expect(widthOn).toBe(widthOff + 28);
  });

  it("should shrink back when workingDaysMode is disabled", () => {
    act(() => {
      useChartStore.setState({ workingDaysMode: true });
    });
    const { result } = renderHook(() => useTableDimensions());
    const widthOn = result.current.totalColumnWidth;

    act(() => {
      useChartStore.setState({ workingDaysMode: false });
    });

    expect(result.current.totalColumnWidth).toBe(widthOn - 28);
  });

  it("should apply WD floor even when a narrower custom duration width is stored", () => {
    // User previously set a narrow custom width for duration.
    // With WD mode on, the floor must override it.
    act(() => {
      useTaskStore.setState({ columnWidths: { duration: 70 } });
    });
    const { result } = renderHook(() => useTableDimensions());
    const widthWithNarrowDuration = result.current.totalColumnWidth;

    act(() => {
      useChartStore.setState({ workingDaysMode: true });
    });

    // The WD floor = base(90) + 28 = 118, which is > the custom 70.
    // So totalColumnWidth must increase by (118 - 70) = 48.
    const durationBase = DENSITY_CONFIG.normal.columnWidths.duration;
    const wdFloor = durationBase + 28;
    const expectedIncrease = wdFloor - 70;
    expect(result.current.totalColumnWidth).toBe(
      widthWithNarrowDuration + expectedIncrease
    );
  });
});
