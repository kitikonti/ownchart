/**
 * Generic cell component for the task table.
 * Handles view/edit modes, focus management, and keyboard navigation.
 */

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useTaskStore, type EditableField } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useUserPreferencesStore } from "../../store/slices/userPreferencesSlice";
import { useCellNavigation } from "../../hooks/useCellNavigation";
import type { Task } from "../../types/chart.types";
import type { ColumnDefinition } from "../../config/tableColumns";
import {
  calculateWorkingDays,
  addWorkingDays,
} from "../../utils/workingDaysCalculator";
import type { DateFormat } from "../../types/preferences.types";

/**
 * Format a date string according to user preferences.
 */
function formatDateDisplay(isoDate: string, dateFormat: DateFormat): string {
  if (!isoDate) return "";

  // Parse ISO date (YYYY-MM-DD)
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;

  switch (dateFormat) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
    default:
      return isoDate;
  }
}

export interface CellProps {
  /** Task ID */
  taskId: string;

  /** Task data */
  task: Task;

  /** Field name */
  field: EditableField;

  /** Column definition */
  column: ColumnDefinition;

  /** Cell renderer component */
  children?: React.ReactNode;
}

/**
 * Cell component with Excel-like navigation and editing.
 */
export function Cell({
  taskId,
  task,
  field,
  column,
  children,
}: CellProps): JSX.Element {
  const cellRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const shouldOverwriteRef = useRef<boolean>(false);

  const {
    isCellActive,
    isCellEditing,
    setActiveCell,
    startCellEdit,
    stopCellEdit,
    navigateCell,
  } = useCellNavigation();

  const updateTask = useTaskStore((state) => state.updateTask);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const cutCell = useTaskStore((state) => state.cutCell);

  // Working days settings
  const workingDaysMode = useChartStore((state) => state.workingDaysMode);
  const workingDaysConfig = useChartStore((state) => state.workingDaysConfig);
  const holidayRegion = useChartStore((state) => state.holidayRegion);

  // Date format preference
  const dateFormat = useUserPreferencesStore(
    (state) => state.preferences.dateFormat
  );

  const isActive = isCellActive(taskId, field);
  const isEditing = isCellEditing(taskId, field);
  const isCut = cutCell?.taskId === taskId && cutCell?.field === field;

  // Get current value from task
  const currentValue = task[field];

  // Focus cell when it becomes active
  useEffect(() => {
    if (isActive && cellRef.current && !isEditing) {
      cellRef.current.focus({ preventScroll: true });
    }
  }, [isActive, isEditing]);

  // Initialize local value when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // If shouldOverwrite is true, localValue was already set by typing
      // Otherwise, initialize with current value
      if (!shouldOverwriteRef.current) {
        // Special handling for duration in working days mode
        if (
          field === "duration" &&
          workingDaysMode &&
          task.startDate &&
          task.endDate
        ) {
          const workingDays = calculateWorkingDays(
            task.startDate,
            task.endDate,
            workingDaysConfig,
            workingDaysConfig.excludeHolidays ? holidayRegion : undefined
          );
          setLocalValue(String(workingDays));
        } else {
          setLocalValue(String(currentValue));
        }
      }
      shouldOverwriteRef.current = false; // Reset flag
      setError(null);
    }
  }, [
    isEditing,
    currentValue,
    field,
    workingDaysMode,
    workingDaysConfig,
    holidayRegion,
    task.startDate,
    task.endDate,
  ]);

  /**
   * Handle cell click - activate or edit.
   */
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    // Clear row selection when clicking a cell (Excel behavior)
    clearSelection();

    if (!column.editable) {
      setActiveCell(taskId, field);
      return;
    }

    if (isActive && !isEditing) {
      // Already active, start editing
      startCellEdit();
    } else if (!isActive) {
      // Not active, activate it
      setActiveCell(taskId, field);
    }
  };

  /**
   * Handle keyboard navigation in navigation mode.
   */
  const handleNavigationKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Arrow key navigation
    if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateCell("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateCell("down");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      navigateCell("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      navigateCell("right");
    }
    // Tab navigation
    else if (e.key === "Tab") {
      e.preventDefault();
      navigateCell(e.shiftKey ? "left" : "right");
    }
    // Enter to start edit or navigate down
    else if (e.key === "Enter") {
      e.preventDefault();
      if (column.editable) {
        startCellEdit();
      } else {
        navigateCell("down");
      }
    }
    // F2 to start edit
    else if (e.key === "F2" && column.editable) {
      e.preventDefault();
      startCellEdit();
    }
    // Any alphanumeric key starts editing and overwrites value (Excel behavior)
    else if (
      column.editable &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      // Start with the typed character (Excel behavior - typing overwrites)
      setLocalValue(e.key);
      shouldOverwriteRef.current = true;
      startCellEdit();
    }
  };

  /**
   * Validate and save the cell value.
   */
  const saveValue = () => {
    if (!column.validator) {
      // No validator, save directly
      updateCellValue(localValue);
      return;
    }

    const validation = column.validator(localValue);
    if (!validation.valid) {
      setError(validation.error || "Invalid value");
      return;
    }

    // Additional validation for dates
    if (field === "startDate" || field === "endDate") {
      const newTask = { ...task, [field]: localValue };

      // Calculate duration
      const start = new Date(newTask.startDate);
      const end = new Date(newTask.endDate);

      if (end < start) {
        setError("End date must be after start date");
        return;
      }

      const duration =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;

      // Update both field and duration
      updateTask(taskId, { [field]: localValue, duration });
    } else if (field === "duration") {
      // Duration edited - update endDate
      const durationDays = Number(localValue);

      let endDateStr: string;

      if (workingDaysMode) {
        // Working days mode: input is working days, calculate calendar end date
        endDateStr = addWorkingDays(
          task.startDate,
          durationDays,
          workingDaysConfig,
          workingDaysConfig.excludeHolidays ? holidayRegion : undefined
        );
      } else {
        // Calendar days mode
        const startDate = new Date(task.startDate);
        const newEndDate = new Date(startDate);
        newEndDate.setDate(newEndDate.getDate() + durationDays - 1);
        endDateStr = newEndDate.toISOString().split("T")[0];
      }

      // Calculate actual calendar duration for storage
      const actualDuration =
        Math.ceil(
          (new Date(endDateStr).getTime() -
            new Date(task.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      updateTask(taskId, { duration: actualDuration, endDate: endDateStr });
    } else {
      updateCellValue(localValue);
    }

    setError(null);
    stopCellEdit();
  };

  /**
   * Update cell value in store.
   */
  const updateCellValue = (value: string) => {
    let typedValue: string | number = value;

    // Convert to appropriate type
    if (field === "duration" || field === "progress") {
      typedValue = Number(value);
    }

    updateTask(taskId, { [field]: typedValue });
  };

  /**
   * Cancel edit mode without saving.
   */
  const cancelEdit = () => {
    setError(null);
    setLocalValue(String(currentValue));
    stopCellEdit();
  };

  /**
   * Handle keyboard events in edit mode.
   */
  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveValue();
      if (!error) {
        navigateCell(e.shiftKey ? "up" : "down");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      saveValue();
      if (!error) {
        navigateCell(e.shiftKey ? "left" : "right");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  /**
   * Format display value.
   */
  const getDisplayValue = (): string => {
    // Special handling for duration in working days mode
    if (
      field === "duration" &&
      workingDaysMode &&
      task.startDate &&
      task.endDate
    ) {
      const workingDays = calculateWorkingDays(
        task.startDate,
        task.endDate,
        workingDaysConfig,
        workingDaysConfig.excludeHolidays ? holidayRegion : undefined
      );
      return String(workingDays);
    }

    // Format dates according to user preference
    if ((field === "startDate" || field === "endDate") && currentValue) {
      return formatDateDisplay(String(currentValue), dateFormat);
    }

    if (column.formatter) {
      return column.formatter(currentValue);
    }
    return String(currentValue);
  };

  // Brand color for active cell outline
  const BRAND_COLOR = "#0F6CBD";

  // Density-aware styles using CSS custom properties
  const cellStyle: React.CSSProperties = {
    height: "var(--density-row-height)",
    paddingTop: "var(--density-cell-padding-y)",
    paddingBottom: "var(--density-cell-padding-y)",
    paddingLeft:
      column.id === "name" ? undefined : "var(--density-cell-padding-x)",
    paddingRight: "var(--density-cell-padding-x)",
    fontSize: "var(--density-font-size-cell)",
  };

  // Active cell style with brand color inset box-shadow (doesn't affect layout)
  const activeCellStyle: React.CSSProperties = {
    ...cellStyle,
    boxShadow: `inset 0 0 0 2px ${BRAND_COLOR}`,
  };

  // Render edit mode
  if (isEditing) {
    return (
      <div
        ref={cellRef}
        className={`relative flex items-center border-b ${column.id !== "color" ? "border-r" : ""} border-neutral-200 bg-white z-20`}
        style={activeCellStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {children ? (
          // Custom editor (e.g., ColorPicker)
          <div className="flex items-center flex-1">{children}</div>
        ) : (
          // Default input
          <input
            type={
              column.renderer === "date"
                ? "date"
                : column.renderer === "number"
                  ? "number"
                  : "text"
            }
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={saveValue}
            autoFocus
            className="w-full px-0 py-0 border-0 focus:outline-none bg-transparent"
            style={{ fontSize: "inherit" }}
          />
        )}
        {error && (
          <div className="absolute left-0 top-full mt-1 text-xs text-red-600 flex items-center gap-1 z-10 bg-white px-2 py-1 rounded shadow-md">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Render view mode
  return (
    <div
      ref={cellRef}
      tabIndex={0}
      className={`
        border-b ${column.id !== "color" ? "border-r" : ""} border-neutral-200 flex items-center cursor-pointer relative
        ${isActive ? "z-10" : ""}
        ${isActive && !isCut ? "bg-white" : ""}
        ${!column.editable ? "bg-neutral-50 text-neutral-500" : ""}
        ${isCut ? "opacity-50 outline outline-2 outline-dashed outline-neutral-500 -outline-offset-2" : ""}
      `}
      style={isActive ? activeCellStyle : cellStyle}
      onClick={handleClick}
      onKeyDown={handleNavigationKeyDown}
    >
      {children || <span>{getDisplayValue()}</span>}
    </div>
  );
}
