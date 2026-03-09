/**
 * Hook for building table header context menu items (Zone 2).
 *
 * Produces a Windows Explorer-style column management menu with three groups:
 *   1. "Size to Fit" / "Size All Columns to Fit" — auto-fit column widths
 *   2. Column visibility checkmarks — toggle individual columns on/off
 *   3. "Show All Columns" — reset all hidden columns at once
 *
 * The rowNumber and color columns cannot be auto-fitted (fixed-width chrome).
 */

import { useMemo, useState, useCallback } from "react";
import { Eye, ArrowsHorizontal } from "@phosphor-icons/react";
import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "../components/ContextMenu/ContextMenu";
import { useChartStore } from "../store/slices/chartSlice";
import { useTaskStore } from "../store/slices/taskSlice";
import {
  TASK_COLUMNS,
  getHideableColumns,
  ROW_NUMBER_COLUMN_ID,
  COLOR_COLUMN_ID,
} from "../config/tableColumns";
import type { ColumnId } from "../config/tableColumns";
import { CONTEXT_MENU } from "../styles/design-tokens";

// Module-level constant: derived from static TASK_COLUMNS config and never changes.
const HIDEABLE_COLUMNS = getHideableColumns();

interface ContextMenuState {
  position: ContextMenuPosition;
  columnId: ColumnId;
}

interface UseTableHeaderContextMenuResult {
  contextMenu: ContextMenuState | null;
  contextMenuItems: ContextMenuItem[];
  handleHeaderContextMenu: (e: React.MouseEvent, columnId: ColumnId) => void;
  closeContextMenu: () => void;
}

export function useTableHeaderContextMenu(): UseTableHeaderContextMenuResult {
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);
  const toggleColumnVisibility = useChartStore(
    (state) => state.toggleColumnVisibility
  );
  const setHiddenColumns = useChartStore((state) => state.setHiddenColumns);
  const autoFitColumn = useTaskStore((state) => state.autoFitColumn);
  const autoFitAllColumns = useTaskStore((state) => state.autoFitAllColumns);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleHeaderContextMenu = useCallback(
    (e: React.MouseEvent, columnId: ColumnId): void => {
      e.preventDefault();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        columnId,
      });
    },
    []
  );

  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
  }, []);

  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu) return [];

    const columnId = contextMenu.columnId;
    const column = TASK_COLUMNS.find((c) => c.id === columnId);
    if (!column) return [];

    const hiddenSet = new Set(hiddenColumns);

    // ── Group 1: Size to Fit ──
    const canAutoFit =
      columnId !== ROW_NUMBER_COLUMN_ID && columnId !== COLOR_COLUMN_ID;
    // columnId is a safety fallback — all current TASK_COLUMNS define label.
    // Using ?? (nullish coalescing) instead of || so an explicit empty-string
    // menuLabel would not be skipped (though that case does not currently arise).
    const displayLabel = column.menuLabel ?? column.label ?? columnId;

    const sizeToFitItems: ContextMenuItem[] = [
      {
        id: "sizeToFit",
        label: `Size "${displayLabel}" to Fit`,
        icon: (
          <ArrowsHorizontal
            size={CONTEXT_MENU.iconSize}
            weight={CONTEXT_MENU.iconWeight}
          />
        ),
        onClick: () => autoFitColumn(columnId),
        disabled: !canAutoFit,
      },
      {
        id: "sizeAllToFit",
        label: "Size All Columns to Fit",
        icon: (
          <ArrowsHorizontal
            size={CONTEXT_MENU.iconSize}
            weight={CONTEXT_MENU.iconWeight}
          />
        ),
        onClick: autoFitAllColumns,
        separator: true,
      },
    ];

    // ── Group 2: Column visibility checkmarks ──
    // Store action selectors (toggleColumnVisibility, setHiddenColumns,
    // autoFitColumn, autoFitAllColumns) return stable references — Zustand
    // guarantees action identity across renders, so no useCallback wrapping is needed.
    const toggleItems: ContextMenuItem[] = HIDEABLE_COLUMNS.map((col, i) => ({
      id: `toggle_${col.id}`,
      // ?? instead of || so an explicit empty-string menuLabel is not skipped.
      label: col.menuLabel ?? col.label,
      checked: !hiddenSet.has(col.id),
      onClick: () => toggleColumnVisibility(col.id),
      separator: i === HIDEABLE_COLUMNS.length - 1,
    }));

    // ── Group 3: Show All ──
    const showAllItem: ContextMenuItem = {
      id: "showAllColumns",
      label: "Show All Columns",
      icon: (
        <Eye size={CONTEXT_MENU.iconSize} weight={CONTEXT_MENU.iconWeight} />
      ),
      onClick: () => setHiddenColumns([]),
      disabled: hiddenColumns.length === 0,
    };

    return [...sizeToFitItems, ...toggleItems, showAllItem];
  }, [
    contextMenu,
    hiddenColumns,
    toggleColumnVisibility,
    setHiddenColumns,
    autoFitColumn,
    autoFitAllColumns,
  ]);

  return {
    contextMenu,
    contextMenuItems,
    handleHeaderContextMenu,
    closeContextMenu,
  };
}
