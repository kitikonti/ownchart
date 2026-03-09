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
import { useChartStore } from "../store/slices/chartSlice";
import { useTaskStore } from "../store/slices/taskSlice";
import {
  TASK_COLUMNS,
  getHideableColumns,
  ROW_NUMBER_COLUMN_ID,
  COLOR_COLUMN_ID,
} from "../config/tableColumns";
import { CONTEXT_MENU } from "../styles/design-tokens";
import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "../components/ContextMenu/ContextMenu";
import type { ColumnId } from "../config/tableColumns";

// Module-level constant: derived from static config and never changes across renders.
const HIDEABLE_COLUMNS = getHideableColumns();

/** Builds the "Size to Fit" / "Size All Columns to Fit" group (Group 1). */
function buildSizeToFitItems(
  columnId: ColumnId,
  displayLabel: string,
  canAutoFit: boolean,
  autoFitColumn: (id: ColumnId) => void,
  autoFitAllColumns: () => void,
  arrowsIcon: React.ReactNode
): ContextMenuItem[] {
  return [
    {
      id: "sizeToFit",
      label: `Size "${displayLabel}" to Fit`,
      icon: arrowsIcon,
      onClick: () => autoFitColumn(columnId),
      disabled: !canAutoFit,
    },
    {
      id: "sizeAllToFit",
      label: "Size All Columns to Fit",
      icon: arrowsIcon,
      onClick: autoFitAllColumns,
      separator: true,
    },
  ];
}

/** Builds the column-visibility checkmark group (Group 2). */
function buildToggleItems(
  // review: intentional — Set<string> (not Set<ColumnId>) because chartSlice.hiddenColumns
  // is typed as string[] for forward-compatibility; narrowing to Set<ColumnId> would
  // require a cast at every call site.
  hiddenSet: Set<string>,
  toggleColumnVisibility: (id: ColumnId) => void
): ContextMenuItem[] {
  // Store action selectors (toggleColumnVisibility, setHiddenColumns,
  // autoFitColumn, autoFitAllColumns) return stable references — Zustand
  // guarantees action identity across renders, so no useCallback wrapping is needed.
  // review: intentional — inline arrow functions here are rebuilt per useMemo recompute
  // (i.e. per menu open), not per render. Stable refs are not needed since the entire
  // items array is replaced wholesale whenever the memo recomputes.
  return HIDEABLE_COLUMNS.map((col, i) => ({
    id: `toggle_${col.id}`,
    // ?? instead of || so an explicit empty-string menuLabel is not skipped.
    label: col.menuLabel ?? col.label,
    checked: !hiddenSet.has(col.id),
    onClick: () => toggleColumnVisibility(col.id),
    separator: i === HIDEABLE_COLUMNS.length - 1,
  }));
}

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

// review: intentional — hook body is ~80 lines due to necessary store-selector
// boilerplate (5 selectors, useState, 2 useCallback, 1 useMemo, return).
// Each logical unit is independently under 50 lines; no extract is beneficial here.
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

    // canAutoFit: rowNumber and color are fixed-width chrome columns with no auto-fit.
    const canAutoFit =
      columnId !== ROW_NUMBER_COLUMN_ID && columnId !== COLOR_COLUMN_ID;
    // ?? instead of || so an explicit empty-string menuLabel is not skipped.
    // column.label is always defined per TASK_COLUMNS schema (no fallback to columnId needed).
    const displayLabel = column.menuLabel ?? column.label;

    // Icons are created inside useMemo so they are only allocated when the menu is open.
    const arrowsIcon = (
      <ArrowsHorizontal
        size={CONTEXT_MENU.iconSize}
        weight={CONTEXT_MENU.iconWeight}
      />
    );
    const eyeIcon = (
      <Eye size={CONTEXT_MENU.iconSize} weight={CONTEXT_MENU.iconWeight} />
    );

    // ── Group 1: Size to Fit ──
    const sizeToFitItems = buildSizeToFitItems(
      columnId,
      displayLabel,
      canAutoFit,
      autoFitColumn,
      autoFitAllColumns,
      arrowsIcon
    );

    // ── Group 2: Column visibility checkmarks ──
    const toggleItems = buildToggleItems(hiddenSet, toggleColumnVisibility);

    // ── Group 3: Show All ──
    const showAllItem: ContextMenuItem = {
      id: "showAllColumns",
      label: "Show All Columns",
      icon: eyeIcon,
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
