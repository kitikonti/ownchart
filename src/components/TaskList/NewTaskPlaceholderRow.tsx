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
import { useNewTaskCreation } from "../../hooks/useNewTaskCreation";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { PLACEHOLDER_TASK_ID } from "../../config/placeholderRow";
import { CELL, ROW_NUMBER } from "../../styles/design-tokens";

/** Selector: data-attribute used by scroll-into-view to find the scroll driver. */
const SCROLL_DRIVER_SELECTOR = "[data-scroll-driver]";

export function NewTaskPlaceholderRow(): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const activeCell = useTaskStore((state) => state.activeCell);
  const setActiveCell = useTaskStore((state) => state.setActiveCell);
  const isSelected = useTaskStore((state) =>
    state.selectedTaskIds.includes(PLACEHOLDER_TASK_ID)
  );
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);

  const { createTask } = useNewTaskCreation();

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

  // Scroll the outerScrollRef (vertical scroll driver) so the placeholder is visible.
  // We must NOT use el.scrollIntoView() because that scrolls the wrong container
  // (taskTableScrollRef) which desyncs TaskTable from Timeline (GitHub #16).
  const scrollPlaceholderIntoView = useRef(() => {
    const el = cellRef.current;
    if (!el) return;
    const outerScroll = el.closest(SCROLL_DRIVER_SELECTOR);
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
    if (isSelected) {
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
    const selectedTaskIds = store.selectedTaskIds;
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

  const commitNewTask = (): void => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      createTask(trimmed);
    }
    setIsEditing(false);
    setInputValue("");
  };

  const cancelEdit = (): void => {
    setIsEditing(false);
    setInputValue("");
  };

  const handleInputBlur = (): void => {
    if (inputValue.trim()) {
      commitNewTask();
    } else {
      cancelEdit();
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        commitNewTask();
      } else {
        cancelEdit();
      }
    } else if (e.key === "Escape") {
      cancelEdit();
      // Re-focus the cell
      setTimeout(() => cellRef.current?.focus({ preventScroll: true }), 0);
    }
  };

  // Density-aware cell styles — matches Cell.tsx approach
  const getCellStyle = (columnId: string): React.CSSProperties => ({
    height: "var(--density-row-height)",
    paddingTop: "var(--density-cell-padding-y)",
    paddingBottom: "var(--density-cell-padding-y)",
    // Name column omits paddingLeft — hierarchy indentation handles it (matches Cell.tsx)
    paddingLeft:
      columnId === NAME_COLUMN_ID ? undefined : "var(--density-cell-padding-x)",
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
              className="border-r border-b border-neutral-200 flex items-center justify-end cursor-pointer pr-2"
              style={{
                height: "var(--density-row-height)",
                backgroundColor: isSelected
                  ? ROW_NUMBER.bgHover
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

        const isNameEditing = column.id === NAME_COLUMN_ID && isEditing;
        const showActiveBorder = isNameEditing || isActiveCell;

        return (
          <div
            key={column.id}
            ref={column.id === NAME_COLUMN_ID ? cellRef : undefined}
            tabIndex={0}
            className={`${column.showRightBorder !== false ? "border-r" : ""} border-b border-neutral-200 flex items-center ${
              isNameEditing
                ? "bg-white z-20"
                : isSelected
                  ? "bg-neutral-100"
                  : isActiveCell
                    ? "bg-neutral-100 z-10"
                    : "bg-neutral-50/50 hover:bg-neutral-100"
            } cursor-pointer`}
            style={{
              ...getCellStyle(column.id),
              ...(showActiveBorder
                ? { boxShadow: CELL.activeBorderShadow }
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
