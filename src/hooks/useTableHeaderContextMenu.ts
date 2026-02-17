/**
 * Hook for building table header context menu items (Zone 2).
 * Column management: hide/show columns, auto-fit width.
 */

import { useMemo, useState, useCallback, createElement } from "react";
import { EyeSlash, Eye, ArrowsHorizontal } from "@phosphor-icons/react";
import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "../components/ContextMenu/ContextMenu";
import { useChartStore } from "../store/slices/chartSlice";
import { useTaskStore } from "../store/slices/taskSlice";
import {
  TASK_COLUMNS,
  getHideableColumns,
  getVisibleColumns,
} from "../config/tableColumns";
import { CONTEXT_MENU } from "../styles/design-tokens";

interface ContextMenuState {
  position: ContextMenuPosition;
  columnId: string;
}

interface UseTableHeaderContextMenuResult {
  contextMenu: ContextMenuState | null;
  contextMenuItems: ContextMenuItem[];
  handleHeaderContextMenu: (e: React.MouseEvent, columnId: string) => void;
  closeContextMenu: () => void;
}

export function useTableHeaderContextMenu(): UseTableHeaderContextMenuResult {
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);
  const toggleColumnVisibility = useChartStore(
    (state) => state.toggleColumnVisibility
  );
  const setHiddenColumns = useChartStore((state) => state.setHiddenColumns);
  const autoFitColumn = useTaskStore((state) => state.autoFitColumn);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleHeaderContextMenu = useCallback(
    (e: React.MouseEvent, columnId: string): void => {
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

    const items: ContextMenuItem[] = [];
    const hideableColumns = getHideableColumns();
    const visibleHideable = hideableColumns.filter(
      (c) => !hiddenColumns.includes(c.id)
    );

    // ── Group 1: Column visibility ──
    const isHideable = column.hideable === true;
    const isLastVisibleHideable =
      isHideable &&
      visibleHideable.length <= 1 &&
      !hiddenColumns.includes(columnId);

    items.push({
      id: "hideColumn",
      label: `Hide Column "${column.label}"`,
      icon: createElement(EyeSlash, {
        size: CONTEXT_MENU.iconSize,
        weight: CONTEXT_MENU.iconWeight,
      }),
      onClick: () => toggleColumnVisibility(columnId),
      disabled: !isHideable || isLastVisibleHideable,
    });

    items.push({
      id: "showAllColumns",
      label: "Show All Columns",
      icon: createElement(Eye, {
        size: CONTEXT_MENU.iconSize,
        weight: CONTEXT_MENU.iconWeight,
      }),
      onClick: () => setHiddenColumns([]),
      disabled: hiddenColumns.length === 0,
      separator: true,
    });

    // ── Group 2: Size ──
    // Auto-fit is currently only meaningful for resizable columns (name),
    // but we show it for all columns for future extensibility
    const visibleColumns = getVisibleColumns(hiddenColumns);
    const isVisible = visibleColumns.some((c) => c.id === columnId);

    items.push({
      id: "autoFitWidth",
      label: "Auto-fit Column Width",
      icon: createElement(ArrowsHorizontal, {
        size: CONTEXT_MENU.iconSize,
        weight: CONTEXT_MENU.iconWeight,
      }),
      onClick: () => autoFitColumn(columnId),
      disabled: !isVisible || columnId === "rowNumber" || columnId === "color",
    });

    return items;
  }, [
    contextMenu,
    hiddenColumns,
    toggleColumnVisibility,
    setHiddenColumns,
    autoFitColumn,
  ]);

  return {
    contextMenu,
    contextMenuItems,
    handleHeaderContextMenu,
    closeContextMenu,
  };
}
