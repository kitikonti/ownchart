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
import { getVisibleColumns, NAME_COLUMN_ID } from "../../config/tableColumns";
import { usePlaceholderContextMenu } from "../../hooks/usePlaceholderContextMenu";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { PLACEHOLDER_TASK_ID } from "../../config/placeholderRow";
import { COLORS, ROW_NUMBER } from "../../styles/design-tokens";

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
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);

  const {
    contextMenu: placeholderContextMenu,
    contextMenuItems: placeholderContextMenuItems,
    handlePlaceholderContextMenu,
    closeContextMenu: closePlaceholderContextMenu,
  } = usePlaceholderContextMenu();

  // Get visible columns based on settings
  const visibleColumns = useMemo(
    () => getVisibleColumns(hiddenColumns),
    [hiddenColumns]
  );

  const isRowActive = activeCell.taskId === PLACEHOLDER_TASK_ID;
  const isNameActive = isRowActive && activeCell.field === "name";
  const isSelected = selectedTaskIds.includes(PLACEHOLDER_TASK_ID);

  // Scroll the outerScrollRef (vertical scroll driver) so the placeholder is visible.
  // We must NOT use el.scrollIntoView() because that scrolls the wrong container
  // (taskTableScrollRef) which desyncs TaskTable from Timeline (GitHub #16).
  // Instead, we scroll the outerScrollRef which drives translateY for both panels.
  const scrollPlaceholderIntoView = useRef(() => {
    const el = cellRef.current;
    if (!el) return;
    const outerScroll = el.closest(".flex-1.overflow-y-auto");
    if (!outerScroll) return;
    const outerRect = outerScroll.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // If element is below the visible area, scroll down
    if (elRect.bottom > outerRect.bottom) {
      outerScroll.scrollTop += elRect.bottom - outerRect.bottom;
    }
  });

  // Focus cell when it becomes active (not editing)
  // preventScroll: true prevents the browser from scrolling taskTableScrollRef
  // which would desync TaskTable from Timeline (GitHub #16)
  useEffect(() => {
    if (isNameActive && !isEditing && cellRef.current) {
      cellRef.current.focus({ preventScroll: true });
      scrollPlaceholderIntoView.current();
    }
  }, [isNameActive, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      scrollPlaceholderIntoView.current();
    }
  }, [isEditing]);

  const handleCellClick = (field: EditableField): void => {
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

  const handleRowNumberClick = (): void => {
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
    // Clear active cell when using row number
    setActiveCell(null, null);
  };

  // Handle keyboard in navigation mode (cell is active but not editing)
  const handleCellKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
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

  const handleInputBlur = (): void => {
    if (inputValue.trim()) {
      createNewTask();
    } else {
      setIsEditing(false);
      setInputValue("");
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
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
      setTimeout(() => cellRef.current?.focus({ preventScroll: true }), 0);
    }
  };

  const createNewTask = (): void => {
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
      color: COLORS.brand[600],
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
  const getCellStyle = (columnId: string): React.CSSProperties => ({
    height: "var(--density-row-height)",
    paddingTop: "var(--density-cell-padding-y)",
    paddingBottom: "var(--density-cell-padding-y)",
    paddingLeft:
      columnId === NAME_COLUMN_ID
        ? "var(--density-cell-padding-x)"
        : "var(--density-cell-padding-x)",
    paddingRight: "var(--density-cell-padding-x)",
    fontSize: "var(--density-font-size-cell)",
  });

  return (
    <div className="placeholder-row contents" role="row">
      {visibleColumns.map((column) => {
        const isActiveCell = isRowActive && activeCell.field === column.field;
        const isRowNumberCell = column.id === "rowNumber";

        // Row number cell has special styling and click handler
        if (isRowNumberCell) {
          return (
            <div
              key={column.id}
              className="border-r border-b border-neutral-200 flex items-center justify-end cursor-pointer"
              style={{
                height: "var(--density-row-height)",
                paddingRight: "8px",
                backgroundColor: isSelected
                  ? COLORS.brand[600]
                  : ROW_NUMBER.bgInactive,
              }}
              onClick={handleRowNumberClick}
              onContextMenu={handlePlaceholderContextMenu}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleRowNumberClick();
                }
              }}
              role="gridcell"
              tabIndex={0}
              aria-label="Select new task placeholder row"
            >
              {/* Empty - placeholder row has no number */}
            </div>
          );
        }

        return (
          <div
            key={column.id}
            ref={column.id === NAME_COLUMN_ID ? cellRef : undefined}
            tabIndex={0}
            className={`${column.showRightBorder !== false ? "border-r" : ""} border-b border-neutral-200 flex items-center ${
              column.id === NAME_COLUMN_ID && isEditing
                ? "bg-white z-20"
                : isSelected
                  ? "bg-neutral-100"
                  : isActiveCell
                    ? "bg-neutral-100 z-10"
                    : "bg-neutral-50/50 hover:bg-neutral-100"
            } cursor-pointer`}
            style={{
              ...getCellStyle(column.id),
              ...(column.id === NAME_COLUMN_ID && isEditing
                ? { boxShadow: `inset 0 0 0 2px ${COLORS.brand[600]}` }
                : isActiveCell
                  ? { boxShadow: `inset 0 0 0 2px ${COLORS.brand[600]}` }
                  : {}),
            }}
            onClick={() =>
              column.field
                ? handleCellClick(column.field as EditableField)
                : undefined
            }
            onContextMenu={handlePlaceholderContextMenu}
            onKeyDown={
              column.id === NAME_COLUMN_ID ? handleCellKeyDown : undefined
            }
            role="gridcell"
          >
            {column.id === NAME_COLUMN_ID &&
              (isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  className="w-full px-0 py-0 border-0 focus:outline-none bg-transparent"
                  style={{ fontSize: "inherit" }}
                />
              ) : (
                <span className="text-neutral-500 italic select-none">
                  Add new task...
                </span>
              ))}
          </div>
        );
      })}
      {placeholderContextMenu && (
        <ContextMenu
          items={placeholderContextMenuItems}
          position={placeholderContextMenu}
          onClose={closePlaceholderContextMenu}
        />
      )}
    </div>
  );
}
