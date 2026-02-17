/**
 * Hook for building timeline empty area context menu items (Zone 4).
 * Minimal menu: Paste + Fit to View.
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

const ICON_SIZE = 20;
const ICON_WEIGHT = "light" as const;

interface UseTimelineAreaContextMenuResult {
  contextMenu: ContextMenuPosition | null;
  contextMenuItems: ContextMenuItem[];
  handleAreaContextMenu: (e: React.MouseEvent) => void;
  closeContextMenu: () => void;
}

export function useTimelineAreaContextMenu(): UseTimelineAreaContextMenuResult {
  const { handlePaste, canPaste } = useClipboardOperations();
  const fitToView = useChartStore((state) => state.fitToView);
  const tasks = useTaskStore((state) => state.tasks);

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null
  );

  const handleAreaContextMenu = useCallback((e: React.MouseEvent): void => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
  }, []);

  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu) return [];

    return [
      {
        id: "paste",
        label: "Paste",
        icon: createElement(ClipboardText, {
          size: ICON_SIZE,
          weight: ICON_WEIGHT,
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
          size: ICON_SIZE,
          weight: ICON_WEIGHT,
        }),
        shortcut: "F",
        onClick: () => fitToView(tasks),
      },
    ];
  }, [contextMenu, canPaste, handlePaste, fitToView, tasks]);

  return {
    contextMenu,
    contextMenuItems,
    handleAreaContextMenu,
    closeContextMenu,
  };
}
