/**
 * NewTaskPlaceholderRow - Empty row at the bottom for quick task creation.
 * When user starts typing, a new task is created.
 * Can be selected to allow pasting at the end of the list.
 */

import { useRef, useEffect, useMemo, useCallback, memo } from "react";
import type { KeyboardEvent } from "react";
import { useTaskStore, type EditableField } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import {
  getVisibleColumns,
  ROW_NUMBER_COLUMN_ID,
  NAME_COLUMN_ID,
  type ColumnDefinition,
} from "../../config/tableColumns";
import { usePlaceholderContextMenu } from "../../hooks/usePlaceholderContextMenu";
import { useIsPlaceholderSelected } from "../../hooks/useIsPlaceholderSelected";
import { usePlaceholderNameEdit } from "../../hooks/usePlaceholderNameEdit";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { PLACEHOLDER_TASK_ID } from "../../config/placeholderRow";
import { ARROW_NAV } from "../../config/keyboardNavigation";
import {
  ROW_NUMBER,
  PLACEHOLDER_CELL,
  Z_INDEX,
} from "../../styles/design-tokens";
import { getCellStyle, getActiveCellStyle } from "../../styles/cellStyles";

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/** Placeholder text shown in the name cell when not editing. */
const PLACEHOLDER_TEXT = "Add new task...";

/** Layout classes for a placeholder cell (no background — use getPlaceholderCellBg for that). */
function getPlaceholderCellClassName(column: ColumnDefinition): string {
  return [
    column.showRightBorder !== false && "border-r",
    "border-b border-neutral-200 flex items-center cursor-pointer",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Background style for a placeholder cell based on interaction state. */
function getPlaceholderCellBg(state: {
  isEditing?: boolean;
  isSelected: boolean;
  isActive: boolean;
}): { backgroundColor: string; zIndex?: number } {
  if (state.isEditing)
    return {
      backgroundColor: PLACEHOLDER_CELL.bgEditing,
      zIndex: Z_INDEX.cellEditing,
    };
  if (state.isSelected) return { backgroundColor: PLACEHOLDER_CELL.bgSelected };
  if (state.isActive)
    return {
      backgroundColor: PLACEHOLDER_CELL.bgActive,
      zIndex: Z_INDEX.cellActive,
    };
  return { backgroundColor: PLACEHOLDER_CELL.bgDefault };
}

// ─────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────

export const NewTaskPlaceholderRow = memo(
  function NewTaskPlaceholderRow(): JSX.Element {
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

    return (
      <div className="placeholder-row contents" role="row">
        {visibleColumns.map((column) => {
          if (column.id === ROW_NUMBER_COLUMN_ID) {
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

          // Data columns always have a field after rowNumber/name are handled
          if (!column.field) return null;

          return (
            <PlaceholderDataCell
              key={column.id}
              column={column}
              field={column.field}
              onContextMenu={handlePlaceholderContextMenu}
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
);

// ─────────────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────────────

interface PlaceholderRowNumberCellProps {
  onContextMenu: (e: React.MouseEvent) => void;
}

/** Row number cell — handles selection toggle on click. */
const PlaceholderRowNumberCell = memo(function PlaceholderRowNumberCell({
  onContextMenu,
}: PlaceholderRowNumberCellProps): JSX.Element {
  const isSelected = useIsPlaceholderSelected();

  // All state reads + actions via getState() — fresh snapshot in event handler
  const handleClick = useCallback((): void => {
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
  }, []);

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
});

interface PlaceholderNameCellProps {
  column: ColumnDefinition;
  onContextMenu: (e: React.MouseEvent) => void;
}

/** Name cell — rendering wrapper; editing logic lives in usePlaceholderNameEdit. */
const PlaceholderNameCell = memo(function PlaceholderNameCell({
  column,
  onContextMenu,
}: PlaceholderNameCellProps): JSX.Element {
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
});

interface PlaceholderDataCellProps {
  column: ColumnDefinition;
  field: EditableField;
  onContextMenu: (e: React.MouseEvent) => void;
}

/** Data cell — empty placeholder with keyboard navigation and focus management. */
const PlaceholderDataCell = memo(function PlaceholderDataCell({
  column,
  field,
  onContextMenu,
}: PlaceholderDataCellProps): JSX.Element {
  const cellRef = useRef<HTMLDivElement>(null);

  const isActive = useTaskStore(
    (s) =>
      s.activeCell.taskId === PLACEHOLDER_TASK_ID &&
      s.activeCell.field === field
  );
  const isSelected = useIsPlaceholderSelected();
  const setActiveCell = useTaskStore((s) => s.setActiveCell);
  const clearSelection = useTaskStore((s) => s.clearSelection);
  const navigateCell = useTaskStore((s) => s.navigateCell);

  // Focus cell when it becomes active — matches Cell.tsx focus contract
  useEffect(() => {
    if (isActive && cellRef.current) {
      cellRef.current.focus({ preventScroll: true });
    }
  }, [isActive]);

  const handleClick = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      clearSelection();
      setActiveCell(PLACEHOLDER_TASK_ID, field);
    },
    [field, clearSelection, setActiveCell]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>): void => {
      const direction = ARROW_NAV[e.key];
      if (direction) {
        e.preventDefault();
        navigateCell(direction);
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        navigateCell(e.shiftKey ? "left" : "right");
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        clearSelection();
        setActiveCell(PLACEHOLDER_TASK_ID, field);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setActiveCell(null, null);
      }
    },
    [field, navigateCell, clearSelection, setActiveCell]
  );

  return (
    <div
      ref={cellRef}
      tabIndex={isActive ? 0 : -1}
      className={getPlaceholderCellClassName(column)}
      style={{
        ...(isActive ? getActiveCellStyle(column.id) : getCellStyle(column.id)),
        ...getPlaceholderCellBg({ isSelected, isActive }),
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={onContextMenu}
      role="gridcell"
      aria-label={column.label}
      aria-selected={isActive}
    />
  );
});
