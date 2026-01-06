/**
 * NewTaskPlaceholderRow - Empty row at the bottom for quick task creation.
 * When user starts typing, a new task is created.
 * Can be selected to allow pasting at the end of the list.
 */

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent,
} from "react";
import { useTaskStore, type EditableField } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { getVisibleColumns } from "../../config/tableColumns";

// Special ID for the placeholder row - used by paste logic
export const PLACEHOLDER_TASK_ID = "__new_task_placeholder__";

export function NewTaskPlaceholderRow(): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const addTask = useTaskStore((state) => state.addTask);
  const tasks = useTaskStore((state) => state.tasks);
  const activeCell = useTaskStore((state) => state.activeCell);
  const setActiveCell = useTaskStore((state) => state.setActiveCell);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const densityConfig = useDensityConfig();
  const showProgress = useChartStore((state) => state.showProgress);

  // Get visible columns based on settings (Sprint 1.5.9)
  const visibleColumns = useMemo(
    () => getVisibleColumns(showProgress),
    [showProgress]
  );

  const isRowActive = activeCell.taskId === PLACEHOLDER_TASK_ID;
  const isNameActive = isRowActive && activeCell.field === "name";
  const isSelected = selectedTaskIds.includes(PLACEHOLDER_TASK_ID);

  // Focus cell when it becomes active (not editing)
  useEffect(() => {
    if (isNameActive && !isEditing && cellRef.current) {
      cellRef.current.focus();
    }
  }, [isNameActive, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleCellClick = (field: EditableField) => {
    // Clear row selection when clicking a cell
    if (selectedTaskIds.length > 0) {
      clearSelection();
    }

    if (field === "name") {
      if (isNameActive && !isEditing) {
        // Already active, start editing (like normal cells)
        setIsEditing(true);
      } else if (!isNameActive) {
        // Not active, activate it
        setActiveCell(PLACEHOLDER_TASK_ID, field);
      }
    } else {
      setActiveCell(PLACEHOLDER_TASK_ID, field);
    }
  };

  const handleCheckboxChange = () => {
    // Toggle selection of placeholder row
    const store = useTaskStore.getState();
    if (isSelected) {
      store.setSelectedTaskIds(
        selectedTaskIds.filter((id) => id !== PLACEHOLDER_TASK_ID),
        false
      );
    } else {
      store.setSelectedTaskIds(
        [...selectedTaskIds, PLACEHOLDER_TASK_ID],
        false
      );
    }
    // Clear active cell when using checkbox
    setActiveCell(null, null);
  };

  // Handle keyboard in navigation mode (cell is active but not editing)
  const handleCellKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return;

    // Enter or F2 to start editing
    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      setIsEditing(true);
    }
    // Any printable character starts editing and types that character
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setInputValue(e.key);
      setIsEditing(true);
    }
    // Escape to deactivate
    else if (e.key === "Escape") {
      setActiveCell(null, null);
    }
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      createNewTask();
    } else {
      setIsEditing(false);
      setInputValue("");
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        createNewTask();
      } else {
        setIsEditing(false);
        setInputValue("");
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue("");
      // Re-focus the cell
      setTimeout(() => cellRef.current?.focus(), 0);
    }
  };

  const createNewTask = () => {
    const DEFAULT_DURATION = 7;

    const formatDate = (date: Date): string => {
      return date.toISOString().split("T")[0];
    };

    // Calculate start date based on last task's end date (like insertTaskBelow)
    let startDate: string;
    let endDate: string;

    const lastTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;

    if (lastTask?.endDate) {
      // Start one day after the last task ends
      const lastEnd = new Date(lastTask.endDate);
      const start = new Date(lastEnd);
      start.setDate(lastEnd.getDate() + 1);
      startDate = formatDate(start);

      const end = new Date(start);
      end.setDate(start.getDate() + DEFAULT_DURATION - 1);
      endDate = formatDate(end);
    } else {
      // No tasks or last task has no end date - use today
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + DEFAULT_DURATION - 1);
      startDate = formatDate(today);
      endDate = formatDate(nextWeek);
    }

    // Calculate the next order value
    const maxOrder =
      tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) + 1 : 0;

    addTask({
      name: inputValue.trim(),
      startDate,
      endDate,
      duration: DEFAULT_DURATION,
      progress: 0,
      color: "#6366f1",
      order: maxOrder,
      type: "task",
      parent: undefined,
      metadata: {},
    });

    // Reset state
    setIsEditing(false);
    setInputValue("");
  };

  // Density-aware cell styles
  const getCellStyle = (columnId: string) => ({
    height: "var(--density-row-height)",
    paddingTop: "var(--density-cell-padding-y)",
    paddingBottom: "var(--density-cell-padding-y)",
    paddingLeft:
      columnId === "name"
        ? "var(--density-cell-padding-x)"
        : "var(--density-cell-padding-x)",
    paddingRight: "var(--density-cell-padding-x)",
    fontSize: "var(--density-font-size-cell)",
  });

  return (
    <div className="placeholder-row contents" role="row">
      {visibleColumns.map((column) => {
        const isActiveCell = isRowActive && activeCell.field === column.field;

        return (
          <div
            key={column.id}
            ref={column.id === "name" ? cellRef : undefined}
            tabIndex={column.id === "name" && isNameActive ? 0 : -1}
            className={`${column.id !== "color" ? "border-r" : ""} border-b border-slate-200 flex items-center ${
              column.id === "name" && isEditing
                ? "outline outline-2 outline-slate-500 bg-white z-20"
                : isSelected
                  ? "bg-slate-100"
                  : isActiveCell
                    ? "outline outline-2 outline-slate-500 bg-slate-100 z-10"
                    : "bg-slate-50/50 hover:bg-slate-100"
            } cursor-pointer`}
            style={getCellStyle(column.id)}
            onClick={() =>
              column.field
                ? handleCellClick(column.field as EditableField)
                : undefined
            }
            onKeyDown={column.id === "name" ? handleCellKeyDown : undefined}
            role="gridcell"
          >
            {column.id === "checkbox" && (
              <div className="flex items-center justify-center w-full">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={handleCheckboxChange}
                  className="cursor-pointer"
                  style={{
                    transform: `scale(${densityConfig.checkboxSize / 14})`,
                  }}
                  aria-label="Select new task placeholder row"
                />
              </div>
            )}
            {column.id === "name" &&
              (isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  autoFocus
                  className="w-full px-0 py-0 border-0 focus:outline-none bg-transparent"
                  style={{ fontSize: "inherit" }}
                />
              ) : (
                <span className="text-slate-500 italic select-none">
                  Add new task...
                </span>
              ))}
          </div>
        );
      })}
    </div>
  );
}
