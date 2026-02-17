/**
 * Hook for building table header context menu items (Zone 2).
 * Windows Explorer-style: Size to Fit, column checkmarks, Show All.
 */

import { useMemo, useState, useCallback, createElement } from "react";
import { Eye, ArrowsHorizontal } from "@phosphor-icons/react";
import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "../components/ContextMenu/ContextMenu";
import { useChartStore } from "../store/slices/chartSlice";
import { useTaskStore } from "../store/slices/taskSlice";
import { TASK_COLUMNS, getHideableColumns } from "../config/tableColumns";
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
  const autoFitAllColumns = useTaskStore((state) => state.autoFitAllColumns);

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

    // ── Group 1: Size to Fit ──
    const canAutoFit = columnId !== "rowNumber" && columnId !== "color";
    const displayLabel = column.menuLabel || column.label || columnId;

    items.push({
      id: "sizeToFit",
      label: `Size "${displayLabel}" to Fit`,
      icon: createElement(ArrowsHorizontal, {
        size: CONTEXT_MENU.iconSize,
        weight: CONTEXT_MENU.iconWeight,
      }),
      onClick: () => autoFitColumn(columnId),
      disabled: !canAutoFit,
    });

    items.push({
      id: "sizeAllToFit",
      label: "Size All Columns to Fit",
      icon: createElement(ArrowsHorizontal, {
        size: CONTEXT_MENU.iconSize,
        weight: CONTEXT_MENU.iconWeight,
      }),
      onClick: () => autoFitAllColumns(),
      separator: true,
    });

    // ── Group 2: Column visibility checkmarks ──
    for (let i = 0; i < hideableColumns.length; i++) {
      const col = hideableColumns[i];
      const isVisible = !hiddenColumns.includes(col.id);
      const isLast = i === hideableColumns.length - 1;

      items.push({
        id: `toggle_${col.id}`,
        label: col.menuLabel || col.label,
        checked: isVisible,
        onClick: () => toggleColumnVisibility(col.id),
        separator: isLast,
      });
    }

    // ── Group 3: Show All ──
    items.push({
      id: "showAllColumns",
      label: "Show All Columns",
      icon: createElement(Eye, {
        size: CONTEXT_MENU.iconSize,
        weight: CONTEXT_MENU.iconWeight,
      }),
      onClick: () => setHiddenColumns([]),
      disabled: hiddenColumns.length === 0,
    });

    return items;
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
