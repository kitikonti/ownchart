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
import {
  getVisibleColumns,
  NAME_COLUMN_ID,
  type ColumnDefinition,
} from "../../config/tableColumns";
import { usePlaceholderContextMenu } from "../../hooks/usePlaceholderContextMenu";
import { useNewTaskCreation } from "../../hooks/useNewTaskCreation";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { PLACEHOLDER_TASK_ID } from "../../config/placeholderRow";
import { ROW_NUMBER } from "../../styles/design-tokens";
import { getCellStyle, getActiveCellStyle } from "../../styles/cellStyles";

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/** Selector: data-attribute used by scroll-into-view to find the scroll driver. */
const SCROLL_DRIVER_SELECTOR = "[data-scroll-driver]";

/** Placeholder text shown in the name cell when not editing. */
const PLACEHOLDER_TEXT = "Add new task...";

/** Resolves background and layout classes for a placeholder cell based on interaction state. */
function getPlaceholderCellClassName(
  column: ColumnDefinition,
  state: { isEditing?: boolean; isSelected: boolean; isActive: boolean }
): string {
  const border = column.showRightBorder !== false ? "border-r" : "";
  const bg = state.isEditing
    ? "bg-white z-20"
    : state.isSelected
      ? "bg-neutral-100"
      : state.isActive
        ? "bg-neutral-100 z-10"
        : "bg-neutral-50/50 hover:bg-neutral-100";
  return `${border} border-b border-neutral-200 flex items-center ${bg} cursor-pointer`;
}

// ─────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────

export function NewTaskPlaceholderRow(): JSX.Element {
  const activeCell = useTaskStore((s) => s.activeCell);
  const setActiveCell = useTaskStore((s) => s.setActiveCell);
  const isSelected = useTaskStore((s) =>
    s.selectedTaskIds.includes(PLACEHOLDER_TASK_ID)
  );
  const clearSelection = useTaskStore((s) => s.clearSelection);
  const hiddenColumns = useChartStore((s) => s.hiddenColumns);

  const {
    contextMenu,
    contextMenuItems,
    handlePlaceholderContextMenu,
    closeContextMenu,
  } = usePlaceholderContextMenu();

  const visibleColumns = useMemo(
    () => getVisibleColumns(hiddenColumns),
    [hiddenColumns]
  );

  const isRowActive = activeCell.taskId === PLACEHOLDER_TASK_ID;

  const handleDataCellClick = (field: EditableField): void => {
    if (isSelected) clearSelection();
    setActiveCell(PLACEHOLDER_TASK_ID, field);
  };

  return (
    <div className="placeholder-row contents" role="row">
      {visibleColumns.map((column) => {
        if (column.id === "rowNumber") {
          return (
            <PlaceholderRowNumberCell
              key={column.id}
              onContextMenu={handlePlaceholderContextMenu}
            />
          );
        }

        if (column.id === NAME_COLUMN_ID) {
          return (
            <PlaceholderNameCell
              key={column.id}
              column={column}
              onContextMenu={handlePlaceholderContextMenu}
            />
          );
        }

        // Generic data cell — no content, just activates on click
        const isActiveCell = isRowActive && activeCell.field === column.field;
        return (
          <div
            key={column.id}
            tabIndex={-1}
            className={getPlaceholderCellClassName(column, {
              isSelected,
              isActive: isActiveCell,
            })}
            style={
              isActiveCell
                ? getActiveCellStyle(column.id)
                : getCellStyle(column.id)
            }
            onClick={() => {
              if (column.field) handleDataCellClick(column.field);
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && column.field) {
                e.preventDefault();
                handleDataCellClick(column.field);
              }
            }}
            onContextMenu={handlePlaceholderContextMenu}
            role="gridcell"
          />
        );
      })}
      {contextMenu && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenu}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────────────

/** Row number cell — handles selection toggle on click. */
function PlaceholderRowNumberCell({
  onContextMenu,
}: {
  onContextMenu: (e: React.MouseEvent) => void;
}): JSX.Element {
  const isSelected = useTaskStore((s) =>
    s.selectedTaskIds.includes(PLACEHOLDER_TASK_ID)
  );
  const setActiveCell = useTaskStore((s) => s.setActiveCell);

  const handleClick = (): void => {
    const store = useTaskStore.getState();
    const selectedTaskIds = store.selectedTaskIds;
    const currentlySelected = selectedTaskIds.includes(PLACEHOLDER_TASK_ID);
    if (currentlySelected) {
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
    setActiveCell(null, null);
  };

  return (
    <div
      className="border-r border-b border-neutral-200 flex items-center justify-end cursor-pointer pr-2"
      style={{
        height: "var(--density-row-height)",
        backgroundColor: isSelected
          ? ROW_NUMBER.bgHover
          : ROW_NUMBER.bgInactive,
      }}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      role="gridcell"
      tabIndex={0}
      aria-label="Select new task placeholder row"
    >
      {/* Empty — placeholder row has no number */}
    </div>
  );
}

/** Name cell — owns editing state, focus management, and task creation. */
function PlaceholderNameCell({
  column,
  onContextMenu,
}: {
  column: ColumnDefinition;
  onContextMenu: (e: React.MouseEvent) => void;
}): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const setActiveCell = useTaskStore((s) => s.setActiveCell);
  const clearSelection = useTaskStore((s) => s.clearSelection);
  const isSelected = useTaskStore((s) =>
    s.selectedTaskIds.includes(PLACEHOLDER_TASK_ID)
  );
  const isNameActive = useTaskStore(
    (s) =>
      s.activeCell.taskId === PLACEHOLDER_TASK_ID &&
      s.activeCell.field === "name"
  );

  const { createTask } = useNewTaskCreation();

  // Scroll the outerScrollRef (vertical scroll driver) so the placeholder is visible.
  // Must NOT use el.scrollIntoView() — desyncs TaskTable from Timeline (GitHub #16).
  const scrollIntoView = useRef(() => {
    const el = cellRef.current;
    if (!el) return;
    const outerScroll = el.closest(SCROLL_DRIVER_SELECTOR);
    if (!outerScroll) return;
    const outerRect = outerScroll.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (elRect.bottom > outerRect.bottom) {
      outerScroll.scrollTop += elRect.bottom - outerRect.bottom;
    }
  });

  // Focus cell when it becomes active (not editing).
  // preventScroll: true prevents desyncing TaskTable from Timeline (GitHub #16).
  useEffect(() => {
    if (isNameActive && !isEditing && cellRef.current) {
      cellRef.current.focus({ preventScroll: true });
      scrollIntoView.current();
    }
  }, [isNameActive, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      scrollIntoView.current();
    }
  }, [isEditing]);

  const handleClick = (): void => {
    if (isSelected) clearSelection();
    if (isNameActive && !isEditing) {
      setIsEditing(true);
    } else if (!isNameActive) {
      setActiveCell(PLACEHOLDER_TASK_ID, "name");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (isEditing) return;

    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      setIsEditing(true);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setInputValue(e.key);
      setIsEditing(true);
    } else if (e.key === "Escape") {
      setActiveCell(null, null);
    }
  };

  const commitNewTask = (): void => {
    const trimmed = inputValue.trim();
    if (trimmed) createTask(trimmed);
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
      // Re-focus cell after canceling edit — setTimeout needed because
      // React processes the state update before the focus can land
      setTimeout(() => cellRef.current?.focus({ preventScroll: true }), 0);
    }
  };

  const showActiveBorder = isEditing || isNameActive;

  return (
    <div
      ref={cellRef}
      tabIndex={0}
      className={getPlaceholderCellClassName(column, {
        isEditing,
        isSelected,
        isActive: isNameActive,
      })}
      style={
        showActiveBorder
          ? getActiveCellStyle(column.id)
          : getCellStyle(column.id)
      }
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onKeyDown={handleKeyDown}
      role="gridcell"
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="w-full px-0 py-0 border-0 focus:outline-none bg-transparent"
          style={{ fontSize: "inherit" }}
          aria-label="New task name"
        />
      ) : (
        <span className="text-neutral-500 italic select-none">
          {PLACEHOLDER_TEXT}
        </span>
      )}
    </div>
  );
}
