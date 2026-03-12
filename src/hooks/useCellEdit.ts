/**
 * Custom hook for cell edit state and logic.
 * Manages local value, validation, save/cancel, and keyboard handling.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  type KeyboardEvent,
  type RefObject,
} from "react";

import { useTaskStore, type EditableField } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useUserPreferencesStore } from "../store/slices/userPreferencesSlice";
import type { Task } from "../types/chart.types";
import type { TaskId } from "../types/branded.types";
import type { NavigationDirection } from "../types/task.types";
import type { ColumnDefinition } from "../config/tableColumns";
import type { WorkingDaysConfig } from "../types/preferences.types";
import {
  calculateDuration,
  formatDateByPreference,
  toISODateString,
} from "../utils/dateUtils";
import {
  calculateWorkingDays,
  addWorkingDays,
} from "../utils/workingDaysCalculator";

// Error message constant to keep validation logic DRY and testable.
export const DATE_RANGE_ERROR = "End date must be after start date";

// =============================================================================
// Pure save-field helpers
// Extracted from saveValue to keep each function under 50 lines and to allow
// unit testing of the date/duration logic in isolation.
// =============================================================================

/**
 * Validates a date field update and returns the update payload or an error
 * string.
 *
 * @returns `{ updates }` on success or `{ error }` on validation failure.
 */
export function buildDateFieldUpdate(
  task: Task,
  field: "startDate" | "endDate",
  localValue: string
):
  | { updates: Partial<Task>; error?: never }
  | { error: string; updates?: never } {
  const newTask = { ...task, [field]: localValue };
  const start = new Date(newTask.startDate);
  const end = new Date(newTask.endDate);

  if (end < start) {
    return { error: DATE_RANGE_ERROR };
  }

  const duration = calculateDuration(newTask.startDate, newTask.endDate);
  return { updates: { [field]: localValue, duration } };
}

/**
 * Computes the new endDate and actual duration when the user edits the
 * duration field directly.
 *
 * @returns The task update payload `{ duration, endDate }`.
 */
export function buildDurationFieldUpdate(
  task: Task,
  durationDays: number,
  workingDaysMode: boolean,
  workingDaysConfig: WorkingDaysConfig,
  effectiveHolidayRegion: string | undefined
): Partial<Task> {
  let endDateStr: string;

  if (workingDaysMode) {
    endDateStr = addWorkingDays(
      task.startDate,
      durationDays,
      workingDaysConfig,
      effectiveHolidayRegion
    );
  } else {
    const startDate = new Date(task.startDate);
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + durationDays - 1);
    endDateStr = toISODateString(newEndDate);
  }

  const actualDuration = calculateDuration(task.startDate, endDateStr);
  return { duration: actualDuration, endDate: endDateStr };
}

interface UseCellEditParams {
  /** The stable branded ID of the task being edited. */
  taskId: TaskId;
  /** Full task object — used for date/duration cross-field validation and display. */
  task: Task;
  /** Which field of the task this cell represents. */
  field: EditableField;
  /** Column definition providing optional `validator` and `formatter` callbacks. */
  column: ColumnDefinition;
  /**
   * Whether this cell is the currently focused (active) cell in the table.
   * When `true` and `isEditing` is `false`, the hook focuses the cell element
   * so keyboard shortcuts are delivered to it.
   */
  isActive: boolean;
  /**
   * Whether this cell is currently in edit mode (input visible).
   * Drives local value initialisation and input focus effects.
   */
  isEditing: boolean;
  /** Ref to the outer cell `<div>` — focused when the cell becomes active. */
  cellRef: RefObject<HTMLDivElement>;
  /** Callback to exit edit mode without persisting a value (called by the store). */
  stopCellEdit: () => void;
  /**
   * Callback to move focus to an adjacent cell.
   * Called after a successful save triggered by Enter or Tab.
   */
  navigateCell: (direction: NavigationDirection) => void;
}

export interface UseCellEditReturn {
  localValue: string;
  setLocalValue: (value: string) => void;
  error: string | null;
  inputRef: RefObject<HTMLInputElement>;
  /**
   * Ref flag set by the caller (e.g. TaskTableCell) to `true` immediately
   * before programmatically entering edit mode via a printable keystroke.
   * When `true`, the hook initialises `localValue` to the typed character
   * instead of the current field value, and skips the `select()` call so
   * the cursor lands at the end of the new character.
   *
   * Protocol: set this ref to `true`, then trigger edit mode. The hook
   * resets it back to `false` after consuming it in the initialisation effect.
   */
  shouldOverwriteRef: React.MutableRefObject<boolean>;
  saveValue: () => boolean;
  cancelEdit: () => void;
  handleEditKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  displayValue: string;
}

export function useCellEdit({
  taskId,
  task,
  field,
  column,
  isActive,
  isEditing,
  cellRef,
  stopCellEdit,
  navigateCell,
}: UseCellEditParams): UseCellEditReturn {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const shouldOverwriteRef = useRef<boolean>(false);
  // Snapshot of the value when edit mode is entered — used by cancelEdit to
  // restore correctly even if the store is updated by another source mid-edit.
  const editEntryValueRef = useRef<string>("");

  const updateTask = useTaskStore((state) => state.updateTask);

  // Working days settings
  const workingDaysMode = useChartStore((state) => state.workingDaysMode);
  const workingDaysConfig = useChartStore((state) => state.workingDaysConfig);
  const holidayRegion = useChartStore((state) => state.holidayRegion);

  // Date format preference
  const dateFormat = useUserPreferencesStore(
    (state) => state.preferences.dateFormat
  );

  const currentValue = task[field];

  const effectiveHolidayRegion = workingDaysConfig.excludeHolidays
    ? holidayRegion
    : undefined;

  // Memoize working days value (used for both display and edit init)
  const workingDays = useMemo(() => {
    if (
      !workingDaysMode ||
      field !== "duration" ||
      !task.startDate ||
      !task.endDate
    ) {
      return null;
    }
    return calculateWorkingDays(
      task.startDate,
      task.endDate,
      workingDaysConfig,
      effectiveHolidayRegion
    );
  }, [
    workingDaysMode,
    field,
    task.startDate,
    task.endDate,
    workingDaysConfig,
    effectiveHolidayRegion,
  ]);

  // Focus cell when it becomes active
  useEffect(() => {
    if (isActive && cellRef.current && !isEditing) {
      cellRef.current.focus({ preventScroll: true });
    }
  }, [isActive, isEditing, cellRef]);

  // Focus input when entering edit mode (preventScroll avoids horizontal jump)
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      // Select all text for programmatic edit entry (e.g. Enter, F2, group action).
      // Skip when user typed a character — shouldOverwrite already set the value.
      if (!shouldOverwriteRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // Initialize local value when entering edit mode
  useEffect(() => {
    if (isEditing) {
      const initialValue =
        workingDays !== null ? String(workingDays) : String(currentValue);
      // Capture a snapshot for use by cancelEdit regardless of overwrite mode.
      editEntryValueRef.current = initialValue;
      if (!shouldOverwriteRef.current) {
        setLocalValue(initialValue);
      }
      shouldOverwriteRef.current = false;
      setError(null);
    }
  }, [isEditing, currentValue, workingDays]);

  /** Update cell value in store with type conversion. */
  const updateCellValue = useCallback(
    (value: string): void => {
      let typedValue: string | number = value;
      if (field === "duration" || field === "progress") {
        typedValue = Number(value);
      }
      updateTask(taskId, { [field]: typedValue });
    },
    [field, taskId, updateTask]
  );

  /** Validate and save the cell value. Returns true on success, false on validation failure. */
  const saveValue = useCallback((): boolean => {
    if (!column.validator) {
      updateCellValue(localValue);
      stopCellEdit();
      return true;
    }

    const validation = column.validator(localValue);
    if (!validation.valid) {
      setError(validation.error || "Invalid value");
      return false;
    }

    if (field === "startDate" || field === "endDate") {
      const result = buildDateFieldUpdate(task, field, localValue);
      if (result.error) {
        setError(result.error);
        return false;
      }
      // TS cannot narrow result.updates via the error-branch check above, so we
      // re-check the discriminant inline. At this point result.error is undefined,
      // so result.updates is always defined — but an explicit check avoids the `!`.
      if (!result.updates) return false; // unreachable, satisfies TS
      updateTask(taskId, result.updates);
    } else if (field === "duration") {
      const updates = buildDurationFieldUpdate(
        task,
        Number(localValue),
        workingDaysMode,
        workingDaysConfig,
        effectiveHolidayRegion
      );
      updateTask(taskId, updates);
    } else {
      updateCellValue(localValue);
    }

    setError(null);
    stopCellEdit();
    return true;
  }, [
    column,
    field,
    localValue,
    task,
    taskId,
    updateTask,
    updateCellValue,
    stopCellEdit,
    workingDaysMode,
    workingDaysConfig,
    effectiveHolidayRegion,
  ]);

  /** Cancel edit mode without saving. */
  const cancelEdit = useCallback((): void => {
    setError(null);
    // Restore to the value that was current when edit mode was entered,
    // rather than re-reading currentValue, to handle concurrent store updates.
    setLocalValue(editEntryValueRef.current);
    stopCellEdit();
  }, [stopCellEdit]);

  /** Handle keyboard events in edit mode. */
  const handleEditKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (saveValue()) {
          navigateCell(e.shiftKey ? "up" : "down");
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (saveValue()) {
          navigateCell(e.shiftKey ? "left" : "right");
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [saveValue, cancelEdit, navigateCell]
  );

  /** Format display value for view mode. */
  const displayValue = useMemo((): string => {
    if (workingDays !== null) {
      return String(workingDays);
    }

    if ((field === "startDate" || field === "endDate") && currentValue) {
      return formatDateByPreference(String(currentValue), dateFormat);
    }

    if (column.formatter) {
      return column.formatter(currentValue);
    }
    return String(currentValue);
  }, [workingDays, field, currentValue, dateFormat, column]);

  return {
    localValue,
    setLocalValue,
    error,
    inputRef,
    shouldOverwriteRef,
    saveValue,
    cancelEdit,
    handleEditKeyDown,
    displayValue,
  };
}
