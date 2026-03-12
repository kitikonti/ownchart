/**
 * Tests for useCellEdit hook.
 *
 * Covers:
 * - Pure helpers: buildDateFieldUpdate, buildDurationFieldUpdate
 * - Hook: saveValue (text, date, duration), cancelEdit, handleEditKeyDown,
 *   displayValue, localValue initialization on edit entry.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useCellEdit,
  buildDateFieldUpdate,
  buildDurationFieldUpdate,
  DATE_RANGE_ERROR,
} from "../../../src/hooks/useCellEdit";
import type { Task } from "../../../src/types/chart.types";
import type { TaskId } from "../../../src/types/branded.types";
import type { WorkingDaysConfig } from "../../../src/types/preferences.types";
import type { ColumnDefinition } from "../../../src/config/tableColumns";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUpdateTask = vi.fn();

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ updateTask: mockUpdateTask })
  ),
}));

const defaultChartState = {
  workingDaysMode: false,
  workingDaysConfig: {
    excludeSaturday: false,
    excludeSunday: false,
    excludeHolidays: false,
  } as WorkingDaysConfig,
  holidayRegion: "none",
};

vi.mock("../../../src/store/slices/chartSlice", () => ({
  useChartStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector(defaultChartState)
  ),
}));

vi.mock("../../../src/store/slices/userPreferencesSlice", () => ({
  useUserPreferencesStore: vi.fn(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ preferences: { dateFormat: "YYYY-MM-DD" } })
  ),
}));

import { useChartStore } from "../../../src/store/slices/chartSlice";

function setChartState(overrides: Partial<typeof defaultChartState>): void {
  vi.mocked(useChartStore).mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ ...defaultChartState, ...overrides }) as never
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1" as TaskId,
    name: "My Task",
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    duration: 10,
    progress: 0,
    color: "#0F6CBD",
    order: 0,
    metadata: {},
    type: "task",
    ...overrides,
  };
}

/** Minimal column definition without a validator (plain text field). */
function makeColumn(
  overrides: Partial<ColumnDefinition> = {}
): ColumnDefinition {
  return {
    id: "name",
    label: "Name",
    defaultWidth: "200px",
    editable: true,
    ...overrides,
  } as ColumnDefinition;
}

function makeColumnWithValidator(
  validator: ColumnDefinition["validator"]
): ColumnDefinition {
  return makeColumn({ validator });
}

// ---------------------------------------------------------------------------
// Pure helper: buildDateFieldUpdate
// ---------------------------------------------------------------------------

describe("buildDateFieldUpdate", () => {
  const baseTask = makeTask({
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    duration: 10,
  });

  it("returns error when new endDate is before startDate", () => {
    const result = buildDateFieldUpdate(baseTask, "endDate", "2024-12-31");
    expect(result.error).toBe(DATE_RANGE_ERROR);
  });

  it("returns error when new startDate is after existing endDate", () => {
    const result = buildDateFieldUpdate(baseTask, "startDate", "2025-01-20");
    expect(result.error).toBe(DATE_RANGE_ERROR);
  });

  it("returns updates with recalculated duration for valid endDate", () => {
    const result = buildDateFieldUpdate(baseTask, "endDate", "2025-01-15");
    expect(result.error).toBeUndefined();
    expect(result.updates).toBeDefined();
    expect(result.updates!.endDate).toBe("2025-01-15");
    expect(result.updates!.duration).toBe(15); // Jan 1 → Jan 15 inclusive = 15 days
  });

  it("returns updates with recalculated duration for valid startDate", () => {
    const result = buildDateFieldUpdate(baseTask, "startDate", "2025-01-05");
    expect(result.error).toBeUndefined();
    expect(result.updates!.startDate).toBe("2025-01-05");
    expect(result.updates!.duration).toBe(6); // Jan 5 → Jan 10 inclusive = 6 days
  });

  it("allows same-day start and end (duration = 1)", () => {
    const result = buildDateFieldUpdate(baseTask, "endDate", "2025-01-01");
    expect(result.error).toBeUndefined();
    expect(result.updates!.duration).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Pure helper: buildDurationFieldUpdate
// ---------------------------------------------------------------------------

describe("buildDurationFieldUpdate", () => {
  const baseTask = makeTask({
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    duration: 10,
  });
  const calendarConfig: WorkingDaysConfig = {
    excludeSaturday: false,
    excludeSunday: false,
    excludeHolidays: false,
  };

  describe("calendar mode (workingDaysMode = false)", () => {
    it("computes end date as startDate + (durationDays - 1)", () => {
      const result = buildDurationFieldUpdate(
        baseTask,
        5,
        false,
        calendarConfig,
        undefined
      );
      expect(result.endDate).toBe("2025-01-05");
      expect(result.duration).toBe(5);
    });

    it("returns single-day task when durationDays = 1", () => {
      const result = buildDurationFieldUpdate(
        baseTask,
        1,
        false,
        calendarConfig,
        undefined
      );
      expect(result.endDate).toBe("2025-01-01");
      expect(result.duration).toBe(1);
    });
  });

  describe("working days mode (workingDaysMode = true)", () => {
    it("delegates to addWorkingDays for end date calculation", () => {
      // With no exclusions, working-days mode should behave like calendar mode.
      const result = buildDurationFieldUpdate(
        baseTask,
        5,
        true,
        calendarConfig, // no exclusions → same as calendar
        undefined
      );
      expect(result.endDate).toBe("2025-01-05");
      expect(result.duration).toBe(5);
    });

    it("skips weekends when configured", () => {
      const weekdayConfig: WorkingDaysConfig = {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: false,
      };
      // Jan 1 2025 is a Wednesday. 5 working days:
      // Wed Jan 1, Thu Jan 2, Fri Jan 3, (skip Sat/Sun), Mon Jan 6, Tue Jan 7
      const result = buildDurationFieldUpdate(
        baseTask,
        5,
        true,
        weekdayConfig,
        undefined
      );
      expect(result.endDate).toBe("2025-01-07");
      // Calendar duration Jan 1 → Jan 7 = 7 days
      expect(result.duration).toBe(7);
    });
  });
});

// ---------------------------------------------------------------------------
// Hook: useCellEdit
// ---------------------------------------------------------------------------

function buildHookParams(
  overrides: Partial<{
    task: Task;
    field: (typeof import("../../../src/types/task.types"))["EDITABLE_FIELDS"][number];
    column: ColumnDefinition;
    isActive: boolean;
    isEditing: boolean;
    stopCellEdit: () => void;
    navigateCell: (d: string) => void;
  }> = {}
) {
  const stopCellEdit = vi.fn();
  const navigateCell = vi.fn();
  const cellRef = { current: null };

  return {
    taskId: "task-1" as TaskId,
    task: makeTask(),
    field: "name" as const,
    column: makeColumn(),
    isActive: false,
    isEditing: false,
    cellRef,
    stopCellEdit,
    navigateCell,
    ...overrides,
  };
}

describe("useCellEdit hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setChartState({});
  });

  // ── saveValue: text field (no validator) ──────────────────────────────────

  describe("saveValue — text field (no validator)", () => {
    it("calls updateTask and stopCellEdit with current localValue", () => {
      const stopCellEdit = vi.fn();
      const params = buildHookParams({
        field: "name",
        column: makeColumn({ id: "name", validator: undefined }),
        isEditing: true,
        stopCellEdit,
      });

      const { result } = renderHook(() => useCellEdit(params));

      act(() => {
        result.current.setLocalValue("New Name");
      });

      let saved = false;
      act(() => {
        saved = result.current.saveValue();
      });

      expect(saved).toBe(true);
      expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
        name: "New Name",
      });
      expect(stopCellEdit).toHaveBeenCalledOnce();
    });
  });

  // ── saveValue: validator rejects ─────────────────────────────────────────

  describe("saveValue — validator rejects", () => {
    it("sets error and returns false without calling updateTask", () => {
      const column = makeColumnWithValidator(() => ({
        valid: false,
        error: "Name is required",
      }));
      const stopCellEdit = vi.fn();
      const params = buildHookParams({
        field: "name",
        column,
        isEditing: true,
        stopCellEdit,
      });

      const { result } = renderHook(() => useCellEdit(params));

      let saved = true;
      act(() => {
        saved = result.current.saveValue();
      });

      expect(saved).toBe(false);
      expect(result.current.error).toBe("Name is required");
      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(stopCellEdit).not.toHaveBeenCalled();
    });
  });

  // ── saveValue: date field — end < start ───────────────────────────────────

  describe("saveValue — date field: end before start", () => {
    it("sets DATE_RANGE_ERROR and returns false", () => {
      const column = makeColumn({
        id: "endDate",
        validator: () => ({ valid: true }),
      }) as ColumnDefinition;
      const stopCellEdit = vi.fn();
      const params = buildHookParams({
        field: "endDate",
        task: makeTask({ startDate: "2025-06-01", endDate: "2025-06-10" }),
        column,
        isEditing: true,
        stopCellEdit,
      });

      const { result } = renderHook(() => useCellEdit(params));

      act(() => {
        result.current.setLocalValue("2025-05-01");
      });

      let saved = true;
      act(() => {
        saved = result.current.saveValue();
      });

      expect(saved).toBe(false);
      expect(result.current.error).toBe(DATE_RANGE_ERROR);
      expect(mockUpdateTask).not.toHaveBeenCalled();
    });
  });

  // ── saveValue: date field — valid update ──────────────────────────────────

  describe("saveValue — date field: valid update", () => {
    it("calls updateTask with new date and recalculated duration", () => {
      const column = makeColumn({
        id: "endDate",
        validator: () => ({ valid: true }),
      }) as ColumnDefinition;
      const stopCellEdit = vi.fn();
      const params = buildHookParams({
        field: "endDate",
        task: makeTask({ startDate: "2025-01-01", endDate: "2025-01-10" }),
        column,
        isEditing: true,
        stopCellEdit,
      });

      const { result } = renderHook(() => useCellEdit(params));

      act(() => {
        result.current.setLocalValue("2025-01-20");
      });

      let saved = false;
      act(() => {
        saved = result.current.saveValue();
      });

      expect(saved).toBe(true);
      expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
        endDate: "2025-01-20",
        duration: 20,
      });
      expect(stopCellEdit).toHaveBeenCalledOnce();
    });
  });

  // ── saveValue: duration field — calendar mode ─────────────────────────────

  describe("saveValue — duration field (calendar mode)", () => {
    it("calls updateTask with computed endDate and actual duration", () => {
      const column = makeColumn({
        id: "duration",
        validator: () => ({ valid: true }),
      }) as ColumnDefinition;
      const stopCellEdit = vi.fn();
      const params = buildHookParams({
        field: "duration",
        task: makeTask({ startDate: "2025-01-01", endDate: "2025-01-10" }),
        column,
        isEditing: true,
        stopCellEdit,
      });

      const { result } = renderHook(() => useCellEdit(params));

      act(() => {
        result.current.setLocalValue("5");
      });

      let saved = false;
      act(() => {
        saved = result.current.saveValue();
      });

      expect(saved).toBe(true);
      expect(mockUpdateTask).toHaveBeenCalledWith("task-1", {
        endDate: "2025-01-05",
        duration: 5,
      });
    });
  });

  // ── cancelEdit: restores snapshot ─────────────────────────────────────────

  describe("cancelEdit", () => {
    it("restores localValue to the snapshot captured on edit entry and calls stopCellEdit", () => {
      const stopCellEdit = vi.fn();
      const params = buildHookParams({
        field: "name",
        task: makeTask({ name: "Original Name" }),
        column: makeColumn({ id: "name", validator: undefined }),
        isEditing: true,
        stopCellEdit,
      });

      const { result } = renderHook(() => useCellEdit(params));

      // Mutate localValue to simulate typing
      act(() => {
        result.current.setLocalValue("Typed Value");
      });

      act(() => {
        result.current.cancelEdit();
      });

      // After cancel the localValue is restored to the snapshot
      expect(result.current.localValue).toBe("Original Name");
      expect(result.current.error).toBeNull();
      expect(stopCellEdit).toHaveBeenCalledOnce();
    });
  });

  // ── handleEditKeyDown: Enter navigates down on success ────────────────────

  describe("handleEditKeyDown", () => {
    it("Enter saves and navigates down", () => {
      const stopCellEdit = vi.fn();
      const navigateCell = vi.fn();
      const params = buildHookParams({
        field: "name",
        column: makeColumn({ id: "name", validator: undefined }),
        isEditing: true,
        stopCellEdit,
        navigateCell,
      });

      const { result } = renderHook(() => useCellEdit(params));

      act(() => {
        result.current.setLocalValue("Some Name");
        result.current.handleEditKeyDown({
          key: "Enter",
          shiftKey: false,
          preventDefault: vi.fn(),
        } as unknown as import("react").KeyboardEvent<HTMLInputElement>);
      });

      expect(mockUpdateTask).toHaveBeenCalled();
      expect(navigateCell).toHaveBeenCalledWith("down");
    });

    it("Shift+Enter saves and navigates up", () => {
      const navigateCell = vi.fn();
      const params = buildHookParams({
        field: "name",
        column: makeColumn({ id: "name", validator: undefined }),
        isEditing: true,
        navigateCell,
      });

      const { result } = renderHook(() => useCellEdit(params));

      act(() => {
        result.current.handleEditKeyDown({
          key: "Enter",
          shiftKey: true,
          preventDefault: vi.fn(),
        } as unknown as import("react").KeyboardEvent<HTMLInputElement>);
      });

      expect(navigateCell).toHaveBeenCalledWith("up");
    });

    it("Tab saves and navigates right", () => {
      const navigateCell = vi.fn();
      const params = buildHookParams({
        field: "name",
        column: makeColumn({ id: "name", validator: undefined }),
        isEditing: true,
        navigateCell,
      });

      const { result } = renderHook(() => useCellEdit(params));

      act(() => {
        result.current.handleEditKeyDown({
          key: "Tab",
          shiftKey: false,
          preventDefault: vi.fn(),
        } as unknown as import("react").KeyboardEvent<HTMLInputElement>);
      });

      expect(navigateCell).toHaveBeenCalledWith("right");
    });

    it("Escape cancels without saving", () => {
      const stopCellEdit = vi.fn();
      const navigateCell = vi.fn();
      const params = buildHookParams({
        field: "name",
        column: makeColumnWithValidator(() => ({ valid: false, error: "err" })),
        isEditing: true,
        stopCellEdit,
        navigateCell,
      });

      const { result } = renderHook(() => useCellEdit(params));

      act(() => {
        result.current.handleEditKeyDown({
          key: "Escape",
          shiftKey: false,
          preventDefault: vi.fn(),
        } as unknown as import("react").KeyboardEvent<HTMLInputElement>);
      });

      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(navigateCell).not.toHaveBeenCalled();
      expect(stopCellEdit).toHaveBeenCalledOnce();
    });

    it("does not navigate when validation fails on Enter", () => {
      const navigateCell = vi.fn();
      const params = buildHookParams({
        field: "name",
        column: makeColumnWithValidator(() => ({
          valid: false,
          error: "Required",
        })),
        isEditing: true,
        navigateCell,
      });

      const { result } = renderHook(() => useCellEdit(params));

      act(() => {
        result.current.handleEditKeyDown({
          key: "Enter",
          shiftKey: false,
          preventDefault: vi.fn(),
        } as unknown as import("react").KeyboardEvent<HTMLInputElement>);
      });

      expect(navigateCell).not.toHaveBeenCalled();
    });
  });

  // ── displayValue: date formatting ─────────────────────────────────────────

  describe("displayValue", () => {
    it("formats date fields using the date format preference", () => {
      const params = buildHookParams({
        field: "startDate",
        task: makeTask({ startDate: "2025-06-15" }),
        column: makeColumn({ id: "startDate" }),
        isEditing: false,
      });

      const { result } = renderHook(() => useCellEdit(params));

      // With dateFormat = "YYYY-MM-DD" the formatted value should be the ISO string
      expect(result.current.displayValue).toBe("2025-06-15");
    });

    it("uses column.formatter for non-date fields when present", () => {
      const column = makeColumn({
        id: "progress",
        formatter: (v: unknown) => `${v}%`,
      }) as ColumnDefinition;
      const params = buildHookParams({
        field: "progress",
        task: makeTask({ progress: 50 }),
        column,
        isEditing: false,
      });

      const { result } = renderHook(() => useCellEdit(params));
      expect(result.current.displayValue).toBe("50%");
    });
  });
});
