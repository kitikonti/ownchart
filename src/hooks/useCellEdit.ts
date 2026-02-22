/**
 * Custom hook for cell edit state and logic.
 * Manages local value, validation, save/cancel, and keyboard handling.
 */

import {
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
import type { NavigationDirection } from "../types/task.types";
import type { ColumnDefinition } from "../config/tableColumns";
import {
  calculateDuration,
  formatDateByPreference,
  toISODateString,
} from "../utils/dateUtils";
import {
  calculateWorkingDays,
  addWorkingDays,
} from "../utils/workingDaysCalculator";

interface UseCellEditParams {
  taskId: string;
  task: Task;
  field: EditableField;
  column: ColumnDefinition;
  isActive: boolean;
  isEditing: boolean;
  cellRef: RefObject<HTMLDivElement>;
  stopCellEdit: () => void;
  navigateCell: (direction: NavigationDirection) => void;
}

export interface UseCellEditReturn {
  localValue: string;
  setLocalValue: (value: string) => void;
  error: string | null;
  inputRef: RefObject<HTMLInputElement>;
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
      if (!shouldOverwriteRef.current) {
        if (workingDays !== null) {
          setLocalValue(String(workingDays));
        } else {
          setLocalValue(String(currentValue));
        }
      }
      shouldOverwriteRef.current = false;
      setError(null);
    }
  }, [isEditing, currentValue, workingDays]);

  /** Update cell value in store with type conversion. */
  const updateCellValue = (value: string): void => {
    let typedValue: string | number = value;
    if (field === "duration" || field === "progress") {
      typedValue = Number(value);
    }
    updateTask(taskId, { [field]: typedValue });
  };

  /** Validate and save the cell value. Returns true on success, false on validation failure. */
  const saveValue = (): boolean => {
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
      const newTask = { ...task, [field]: localValue };
      const start = new Date(newTask.startDate);
      const end = new Date(newTask.endDate);

      if (end < start) {
        setError("End date must be after start date");
        return false;
      }

      const duration = calculateDuration(newTask.startDate, newTask.endDate);
      updateTask(taskId, { [field]: localValue, duration });
    } else if (field === "duration") {
      const durationDays = Number(localValue);
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
      updateTask(taskId, { duration: actualDuration, endDate: endDateStr });
    } else {
      updateCellValue(localValue);
    }

    setError(null);
    stopCellEdit();
    return true;
  };

  /** Cancel edit mode without saving. */
  const cancelEdit = (): void => {
    setError(null);
    setLocalValue(String(currentValue));
    stopCellEdit();
  };

  /** Handle keyboard events in edit mode. */
  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
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
  };

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
