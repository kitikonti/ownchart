/**
 * Generic cell component for the task table.
 * Handles view/edit modes, focus management, and keyboard navigation.
 *
 * Edit state and logic are delegated to the useCellEdit hook.
 */

import { memo, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { useTaskStore, type EditableField } from "../../store/slices/taskSlice";
import { useCellEdit } from "../../hooks/useCellEdit";
import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import { type ColumnDefinition } from "../../config/tableColumns";
import { ARROW_NAV } from "../../config/keyboardNavigation";
import {
  getCellStyle,
  getActiveCellStyle,
  getEditingCellStyle,
} from "../../styles/cellStyles";

export interface CellProps {
  /** Task ID */
  taskId: TaskId;

  /** Task data */
  task: Task;

  /** Field name */
  field: EditableField;

  /** Column definition */
  column: ColumnDefinition;

  /** Prevent entering edit mode (e.g. milestone endDate, summary computed fields). */
  readOnly?: boolean;

  /** Cell renderer component */
  children?: React.ReactNode;
}

/**
 * Cell component with Excel-like navigation and editing.
 * Memoized to avoid re-renders when parent re-renders with unchanged props.
 */
export const Cell = memo(function Cell({
  taskId,
  task,
  field,
  column,
  readOnly,
  children,
}: CellProps): JSX.Element {
  const cellRef = useRef<HTMLDivElement>(null);

  // Derived boolean selectors — only re-render when THIS cell's state changes
  const isActive = useTaskStore(
    (s) => s.activeCell.taskId === taskId && s.activeCell.field === field
  );
  const isEditing = useTaskStore(
    (s) =>
      s.activeCell.taskId === taskId &&
      s.activeCell.field === field &&
      s.isEditingCell
  );
  const setActiveCell = useTaskStore((s) => s.setActiveCell);
  const startCellEdit = useTaskStore((s) => s.startCellEdit);
  const stopCellEdit = useTaskStore((s) => s.stopCellEdit);
  const navigateCell = useTaskStore((s) => s.navigateCell);
  const clearSelection = useTaskStore((s) => s.clearSelection);
  const isCut = useTaskStore(
    (s) => s.cutCell?.taskId === taskId && s.cutCell?.field === field
  );

  const {
    localValue,
    setLocalValue,
    error,
    inputRef,
    shouldOverwriteRef,
    saveValue,
    cancelEdit,
    handleEditKeyDown,
    displayValue,
  } = useCellEdit({
    taskId,
    task,
    field,
    column,
    isActive,
    isEditing,
    cellRef,
    stopCellEdit,
    navigateCell,
  });

  /** Handle cell click — activate or enter edit mode. */
  const handleClick = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    clearSelection();

    if (!column.editable || readOnly) {
      setActiveCell(taskId, field);
      return;
    }

    if (isActive && !isEditing) {
      startCellEdit();
    } else if (!isActive) {
      setActiveCell(taskId, field);
    }
  };

  /** Handle keyboard in edit mode for custom editors (e.g., color picker). */
  const handleEditModeKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    // Default inputs handle their own keyboard events via handleEditKeyDown
    if (!children) return;
    if (e.key === "Tab") {
      e.preventDefault();
      stopCellEdit();
      navigateCell(e.shiftKey ? "left" : "right");
    } else if (e.key === "Enter") {
      e.preventDefault();
      stopCellEdit();
      navigateCell(e.shiftKey ? "up" : "down");
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  /** Handle keyboard navigation in view mode. */
  const handleNavigationKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const direction = ARROW_NAV[e.key];
    if (direction) {
      e.preventDefault();
      navigateCell(direction);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      navigateCell(e.shiftKey ? "left" : "right");
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (column.editable && !readOnly) {
        startCellEdit();
      } else {
        navigateCell("down");
      }
    } else if (e.key === "F2" && column.editable && !readOnly) {
      e.preventDefault();
      startCellEdit();
    } else if (
      column.editable &&
      !readOnly &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      // Any printable character starts editing and overwrites (Excel behavior)
      e.preventDefault();
      setLocalValue(e.key);
      shouldOverwriteRef.current = true;
      startCellEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveCell(null, null);
    }
  };

  const borderRight = column.showRightBorder !== false ? "border-r" : "";

  const cellStyle = getCellStyle(column.id);
  const activeCellStyle = getActiveCellStyle(column.id);
  const editingCellStyle = getEditingCellStyle(column.id);

  // Render edit mode
  if (isEditing) {
    return (
      <div
        ref={cellRef}
        role="gridcell"
        aria-selected={true}
        tabIndex={-1}
        className={`relative flex items-center border-b ${borderRight} border-neutral-200 bg-white`}
        style={editingCellStyle}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleEditModeKeyDown}
      >
        {children ? (
          <div className="flex items-center flex-1">{children}</div>
        ) : (
          <input
            ref={inputRef}
            type={
              column.renderer === "date"
                ? "date"
                : column.renderer === "number"
                  ? "number"
                  : "text"
            }
            aria-label={`Edit ${column.label}`}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={saveValue}
            className="w-full px-0 py-0 border-0 focus:outline-none bg-transparent"
            style={{ fontSize: "inherit" }}
          />
        )}
        {error && (
          <div
            className="absolute left-0 top-full mt-1 text-xs text-red-600 flex items-center gap-1 z-10 bg-white px-2 py-1 rounded shadow-md"
            role="alert"
          >
            <span aria-hidden="true">⚠</span>
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
      role="gridcell"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={[
        "border-b",
        borderRight,
        "border-neutral-200 flex items-center cursor-pointer relative",
        isActive && !isCut && "bg-white",
        !column.editable && "bg-neutral-50 text-neutral-500",
        isCut &&
          "opacity-50 outline outline-2 outline-dashed outline-neutral-500 -outline-offset-2",
      ]
        .filter(Boolean)
        .join(" ")}
      style={isActive ? activeCellStyle : cellStyle}
      onClick={handleClick}
      onKeyDown={handleNavigationKeyDown}
    >
      {children || <span>{displayValue}</span>}
    </div>
  );
});
