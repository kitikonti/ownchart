/**
 * NewTaskPlaceholderRow - Empty row at the bottom for quick task creation.
 * When user starts typing, a new task is created.
 * Can be selected to allow pasting at the end of the list.
 */

import { useRef, useMemo, useCallback } from "react";
import { useTaskStore, type EditableField } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import {
  getVisibleColumns,
  NAME_COLUMN_ID,
  type ColumnDefinition,
} from "../../config/tableColumns";
import { usePlaceholderContextMenu } from "../../hooks/usePlaceholderContextMenu";
import { useIsPlaceholderSelected } from "../../hooks/useIsPlaceholderSelected";
import { usePlaceholderNameEdit } from "../../hooks/usePlaceholderNameEdit";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { PLACEHOLDER_TASK_ID } from "../../config/placeholderRow";
import { ROW_NUMBER, PLACEHOLDER_CELL } from "../../styles/design-tokens";
import { getCellStyle, getActiveCellStyle } from "../../styles/cellStyles";

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/** Placeholder text shown in the name cell when not editing. */
const PLACEHOLDER_TEXT = "Add new task...";

/** Layout classes for a placeholder cell (no background — use getPlaceholderCellBg for that). */
function getPlaceholderCellClassName(column: ColumnDefinition): string {
  const border = column.showRightBorder !== false ? "border-r" : "";
  return `${border} border-b border-neutral-200 flex items-center cursor-pointer`;
}

/** Background style for a placeholder cell based on interaction state. */
function getPlaceholderCellBg(state: {
  isEditing?: boolean;
  isSelected: boolean;
  isActive: boolean;
}): { backgroundColor: string; zIndex?: number } {
  if (state.isEditing)
    return { backgroundColor: PLACEHOLDER_CELL.bgEditing, zIndex: 20 };
  if (state.isSelected) return { backgroundColor: PLACEHOLDER_CELL.bgSelected };
  if (state.isActive)
    return { backgroundColor: PLACEHOLDER_CELL.bgActive, zIndex: 10 };
  return { backgroundColor: PLACEHOLDER_CELL.bgDefault };
}

// ─────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────

export function NewTaskPlaceholderRow(): JSX.Element {
  // Focused selector — returns the active field only when THIS row is active,
  // null otherwise. Returns a primitive so Zustand skips re-renders when other
  // rows' cells become active.
  const activePlaceholderField = useTaskStore((s) =>
    s.activeCell.taskId === PLACEHOLDER_TASK_ID ? s.activeCell.field : null
  );
  const setActiveCell = useTaskStore((s) => s.setActiveCell);
  const navigateCell = useTaskStore((s) => s.navigateCell);
  const isSelected = useIsPlaceholderSelected();
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

  const handleDataCellClick = useCallback(
    (field: EditableField): void => {
      if (isSelected) clearSelection();
      setActiveCell(PLACEHOLDER_TASK_ID, field);
    },
    [isSelected, clearSelection, setActiveCell]
  );

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
        const isActiveCell = activePlaceholderField === column.field;
        return (
          <div
            key={column.id}
            tabIndex={-1}
            className={getPlaceholderCellClassName(column)}
            style={{
              ...(isActiveCell
                ? getActiveCellStyle(column.id)
                : getCellStyle(column.id)),
              ...getPlaceholderCellBg({ isSelected, isActive: isActiveCell }),
            }}
            onClick={() => {
              if (column.field) handleDataCellClick(column.field);
            }}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                navigateCell(e.shiftKey ? "left" : "right");
              } else if ((e.key === "Enter" || e.key === " ") && column.field) {
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
  const isSelected = useIsPlaceholderSelected();

  // All state reads + actions via getState() — fresh snapshot in event handler
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
    store.setActiveCell(null, null);
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

/** Name cell — rendering wrapper; editing logic lives in usePlaceholderNameEdit. */
function PlaceholderNameCell({
  column,
  onContextMenu,
}: {
  column: ColumnDefinition;
  onContextMenu: (e: React.MouseEvent) => void;
}): JSX.Element {
  const cellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isEditing,
    inputValue,
    setInputValue,
    isNameActive,
    isSelected,
    showActiveBorder,
    handleClick,
    handleKeyDown,
    handleInputBlur,
    handleInputKeyDown,
  } = usePlaceholderNameEdit(cellRef, inputRef);

  return (
    <div
      ref={cellRef}
      tabIndex={0}
      className={getPlaceholderCellClassName(column)}
      style={{
        ...(showActiveBorder
          ? getActiveCellStyle(column.id)
          : getCellStyle(column.id)),
        ...getPlaceholderCellBg({
          isEditing,
          isSelected,
          isActive: isNameActive,
        }),
      }}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onKeyDown={handleKeyDown}
      role="gridcell"
      aria-label="New task name"
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
