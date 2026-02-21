/**
 * Generic cell component for the task table.
 * Handles view/edit modes, focus management, and keyboard navigation.
 *
 * Edit state and logic are delegated to the useCellEdit hook.
 */

import { useRef, type KeyboardEvent, type MouseEvent } from "react";
import { useTaskStore, type EditableField } from "../../store/slices/taskSlice";
import { useCellNavigation } from "../../hooks/useCellNavigation";
import { useCellEdit } from "../../hooks/useCellEdit";
import type { Task } from "../../types/chart.types";
import type { NavigationDirection } from "../../types/task.types";
import type { ColumnDefinition } from "../../config/tableColumns";
import { COLORS } from "../../styles/design-tokens";

/** Brand color for active cell outline. */
const ACTIVE_CELL_BORDER = COLORS.brand[600];

/** Arrow keys mapped to navigation directions. */
const ARROW_NAV: Record<string, NavigationDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

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

  const {
    isCellActive,
    isCellEditing,
    setActiveCell,
    startCellEdit,
    stopCellEdit,
    navigateCell,
  } = useCellNavigation();

  const clearSelection = useTaskStore((state) => state.clearSelection);
  const cutCell = useTaskStore((state) => state.cutCell);

  const isActive = isCellActive(taskId, field);
  const isEditing = isCellEditing(taskId, field);
  const isCut = cutCell?.taskId === taskId && cutCell?.field === field;

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

    if (!column.editable) {
      setActiveCell(taskId, field);
      return;
    }

    if (isActive && !isEditing) {
      startCellEdit();
    } else if (!isActive) {
      setActiveCell(taskId, field);
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
      if (column.editable) {
        startCellEdit();
      } else {
        navigateCell("down");
      }
    } else if (e.key === "F2" && column.editable) {
      e.preventDefault();
      startCellEdit();
    } else if (
      column.editable &&
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
    boxShadow: `inset 0 0 0 2px ${ACTIVE_CELL_BORDER}`,
  };

  // Render edit mode
  if (isEditing) {
    return (
      <div
        ref={cellRef}
        role="gridcell"
        tabIndex={-1}
        className={`relative flex items-center border-b ${column.id !== "color" ? "border-r" : ""} border-neutral-200 bg-white z-20`}
        style={activeCellStyle}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // Handle Tab/Enter for custom editors (e.g., color picker)
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
        }}
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
      {children || <span>{displayValue}</span>}
    </div>
  );
}
