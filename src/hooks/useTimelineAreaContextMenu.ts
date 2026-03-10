/**
 * Hook for building timeline empty area context menu items (Zone 4).
 * - Right-click on a selected task's row → full task context menu (same as Zone 1/3)
 * - Right-click elsewhere → minimal menu: Paste + Fit to View
 */

import { useCallback, createElement, useMemo, useState } from "react";
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
import type { TaskId } from "../types/branded.types";

/** Keyboard shortcut label shown in the Paste menu item. */
const SHORTCUT_PASTE = "Ctrl+V";

/** Keyboard shortcut label shown in the Fit to View menu item. */
const SHORTCUT_FIT_TO_VIEW = "F";

// Icons are module-level constants: created once, stable across all renders.
const ICON_PASTE = createElement(ClipboardText, {
  size: CONTEXT_MENU.iconSize,
  weight: CONTEXT_MENU.iconWeight,
});
const ICON_FIT_TO_VIEW = createElement(ArrowsOut, {
  size: CONTEXT_MENU.iconSize,
  weight: CONTEXT_MENU.iconWeight,
});

/** Context menu state: either targeting a specific task or just a position. */
type AreaContextMenuState =
  | { position: ContextMenuPosition; taskId: TaskId }
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
          const selectedSet = new Set(useTaskStore.getState().selectedTaskIds);
          if (selectedSet.has(taskId)) {
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
        icon: ICON_PASTE,
        shortcut: SHORTCUT_PASTE,
        onClick: () => void handlePaste(),
        disabled: !canPaste,
        separator: true,
      },
      {
        id: "fitToView",
        label: "Fit to View",
        icon: ICON_FIT_TO_VIEW,
        shortcut: SHORTCUT_FIT_TO_VIEW,
        onClick: () => fitToView(tasks),
      },
    ];
  }, [contextMenu, canPaste, handlePaste, fitToView, buildItems, tasks]);

  return {
    contextMenu: contextMenu?.position ?? null,
    contextMenuItems,
    handleAreaContextMenu,
    closeContextMenu,
  };
}
