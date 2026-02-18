/**
 * Hook for building timeline empty area context menu items (Zone 4).
 * - Right-click on a selected task's row → full task context menu (same as Zone 1/3)
 * - Right-click elsewhere → minimal menu: Paste + Fit to View
 */

import { useMemo, useState, useCallback, createElement } from "react";
import { ClipboardText, ArrowsOut } from "@phosphor-icons/react";
import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "../components/ContextMenu/ContextMenu";
import { useClipboardOperations } from "./useClipboardOperations";
import { useChartStore } from "../store/slices/chartSlice";
import { useTaskStore } from "../store/slices/taskSlice";
import { CONTEXT_MENU } from "../styles/design-tokens";
import { useFullTaskContextMenuItems } from "./useFullTaskContextMenuItems";
import type { Task } from "../types/chart.types";

/** Context menu state: either targeting a specific task or just a position. */
type AreaContextMenuState =
  | { position: ContextMenuPosition; taskId: string }
  | { position: ContextMenuPosition; taskId?: undefined };

interface UseTimelineAreaContextMenuOptions {
  svgRef: React.RefObject<SVGSVGElement | null>;
  tasks: Task[];
  rowHeight: number;
}

interface UseTimelineAreaContextMenuResult {
  contextMenu: ContextMenuPosition | null;
  contextMenuItems: ContextMenuItem[];
  handleAreaContextMenu: (e: React.MouseEvent) => void;
  closeContextMenu: () => void;
}

export function useTimelineAreaContextMenu(
  options: UseTimelineAreaContextMenuOptions
): UseTimelineAreaContextMenuResult {
  const { svgRef, tasks, rowHeight } = options;

  const { handlePaste, canPaste } = useClipboardOperations();
  const fitToView = useChartStore((state) => state.fitToView);
  const { buildItems } = useFullTaskContextMenuItems();

  const [contextMenu, setContextMenu] = useState<AreaContextMenuState | null>(
    null
  );

  const handleAreaContextMenu = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault();

      const position = { x: e.clientX, y: e.clientY };

      // Determine if click is on a selected task's row
      if (svgRef.current && tasks.length > 0 && rowHeight > 0) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const svgY = e.clientY - svgRect.top;
        const rowIndex = Math.floor(svgY / rowHeight);

        if (rowIndex >= 0 && rowIndex < tasks.length) {
          const taskId = tasks[rowIndex].id;
          const currentSelected = useTaskStore.getState().selectedTaskIds;
          if (currentSelected.includes(taskId)) {
            setContextMenu({ position, taskId });
            return;
          }
        }
      }

      // Default: no task targeted
      setContextMenu({ position });
    },
    [svgRef, tasks, rowHeight]
  );

  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
  }, []);

  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu) return [];

    // Task-targeted: show full context menu
    if (contextMenu.taskId) {
      return buildItems(contextMenu.taskId);
    }

    // Default: Paste + Fit to View
    return [
      {
        id: "paste",
        label: "Paste",
        icon: createElement(ClipboardText, {
          size: CONTEXT_MENU.iconSize,
          weight: CONTEXT_MENU.iconWeight,
        }),
        shortcut: "Ctrl+V",
        onClick: () => void handlePaste(),
        disabled: !canPaste,
        separator: true,
      },
      {
        id: "fitToView",
        label: "Fit to View",
        icon: createElement(ArrowsOut, {
          size: CONTEXT_MENU.iconSize,
          weight: CONTEXT_MENU.iconWeight,
        }),
        shortcut: "F",
        onClick: () => fitToView(useTaskStore.getState().tasks),
      },
    ];
  }, [contextMenu, canPaste, handlePaste, fitToView, buildItems]);

  return {
    contextMenu: contextMenu?.position ?? null,
    contextMenuItems,
    handleAreaContextMenu,
    closeContextMenu,
  };
}
