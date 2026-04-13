/**
 * Unit tests for RECALCULATE_WORKING_DAYS undo/redo in historySlice (#83).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useChartStore } from "@/store/slices/chartSlice";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useHistoryStore } from "@/store/slices/historySlice";
import type { Task } from "@/types/chart.types";
import type { TaskId, HexColor } from "@/types/branded.types";
import type { DateAdjustment } from "@/types/dependency.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(
  overrides: Partial<Task> & { id: string; startDate: string; endDate: string }
): Task {
  return {
    name: `Task ${overrides.id}`,
    duration: 1,
    progress: 0,
    color: "#3b82f6" as HexColor,
    order: 0,
    metadata: {},
    ...overrides,
    id: overrides.id as TaskId,
    parent: undefined,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  useHistoryStore.setState({
    undoStack: [],
    redoStack: [],
    isUndoing: false,
    isRedoing: false,
  });
  useChartStore.getState().setWorkingDaysConfig({
    excludeSaturday: false,
    excludeSunday: false,
    excludeHolidays: false,
  });
  useChartStore.getState().setHolidayRegion("US");
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RECALCULATE_WORKING_DAYS undo/redo", () => {
  it("undo restores previous config and reverses date adjustments", () => {
    // Setup: one task that will be adjusted
    const task = makeTask({
      id: "A",
      startDate: "2025-01-11", // Saturday
      endDate: "2025-01-11",
    });
    useTaskStore.setState({ tasks: [task] });

    const adjustments: DateAdjustment[] = [
      {
        taskId: "A" as TaskId,
        oldStartDate: "2025-01-11",
        oldEndDate: "2025-01-11",
        newStartDate: "2025-01-13",
        newEndDate: "2025-01-13",
      },
    ];

    // Apply the recalculation
    useChartStore.getState().applyWorkingDaysRecalc({
      newConfig: {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: false,
      },

      newHolidayRegion: "US",
      mode: "keep-durations" as const,
      dateAdjustments: adjustments,
      durationChanges: [],
      lagChanges: [],
    });

    // Verify applied state
    expect(useChartStore.getState().workingDaysConfig.excludeSaturday).toBe(
      true
    );
    const taskAfterApply = useTaskStore.getState().tasks[0];
    expect(taskAfterApply.startDate).toBe("2025-01-13");
    expect(taskAfterApply.endDate).toBe("2025-01-13");

    // Undo
    useHistoryStore.getState().undo();

    // Config should be restored
    expect(useChartStore.getState().workingDaysConfig.excludeSaturday).toBe(
      false
    );

    // Task dates should be reversed
    const taskAfterUndo = useTaskStore.getState().tasks[0];
    expect(taskAfterUndo.startDate).toBe("2025-01-11");
    expect(taskAfterUndo.endDate).toBe("2025-01-11");
  });

  it("redo re-applies config and date adjustments", () => {
    const task = makeTask({
      id: "A",
      startDate: "2025-01-11",
      endDate: "2025-01-11",
    });
    useTaskStore.setState({ tasks: [task] });

    const adjustments: DateAdjustment[] = [
      {
        taskId: "A" as TaskId,
        oldStartDate: "2025-01-11",
        oldEndDate: "2025-01-11",
        newStartDate: "2025-01-13",
        newEndDate: "2025-01-13",
      },
    ];

    useChartStore.getState().applyWorkingDaysRecalc({
      newConfig: {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: false,
      },

      newHolidayRegion: "US",
      mode: "keep-durations" as const,
      dateAdjustments: adjustments,
      durationChanges: [],
      lagChanges: [],
    });

    // Undo then redo
    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();

    // Config should be re-applied
    expect(useChartStore.getState().workingDaysConfig.excludeSaturday).toBe(
      true
    );

    // Task dates should be re-applied
    const taskAfterRedo = useTaskStore.getState().tasks[0];
    expect(taskAfterRedo.startDate).toBe("2025-01-13");
    expect(taskAfterRedo.endDate).toBe("2025-01-13");
  });

  it("records command to history with correct params", () => {
    useTaskStore.setState({ tasks: [] });

    useChartStore.getState().applyWorkingDaysRecalc({
      newConfig: {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: true,
      },

      newHolidayRegion: "DE",
      mode: "keep-positions" as const,
      dateAdjustments: [],
      durationChanges: [],
      lagChanges: [],
    });

    const stack = useHistoryStore.getState().undoStack;
    expect(stack).toHaveLength(1);
    expect(stack[0].type).toBe("recalculateWorkingDays");
    expect(stack[0].params).toMatchObject({
      newHolidayRegion: "DE",
      previousHolidayRegion: "US",
    });
  });

  it("handles empty dateAdjustments gracefully", () => {
    useTaskStore.setState({ tasks: [] });

    useChartStore.getState().applyWorkingDaysRecalc({
      newConfig: {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: false,
      },
      newHolidayRegion: "US",
      mode: "keep-positions" as const,
      dateAdjustments: [],
      durationChanges: [],
      lagChanges: [],
    });

    // Undo with no adjustments should not throw
    useHistoryStore.getState().undo();
    expect(useChartStore.getState().workingDaysConfig.excludeSaturday).toBe(false);
  });
});
