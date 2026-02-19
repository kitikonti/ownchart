/**
 * Hook for building placeholder row context menu items (Zone 5).
 * Right-click on the placeholder row → single "Paste" action.
 * Selects the placeholder row so paste targets end of list.
 */

import { useMemo, useState, useCallback, createElement } from "react";
import { ClipboardText } from "@phosphor-icons/react";
import type {
  ContextMenuItem,
  ContextMenuPosition,
} from "../components/ContextMenu/ContextMenu";
import { useClipboardOperations } from "./useClipboardOperations";
import { useTaskStore } from "../store/slices/taskSlice";
import { CONTEXT_MENU } from "../styles/design-tokens";
import { PLACEHOLDER_TASK_ID } from "../components/TaskList/NewTaskPlaceholderRow";

interface UsePlaceholderContextMenuResult {
  contextMenu: ContextMenuPosition | null;
  contextMenuItems: ContextMenuItem[];
  handlePlaceholderContextMenu: (e: React.MouseEvent) => void;
  closeContextMenu: () => void;
}

export function usePlaceholderContextMenu(): UsePlaceholderContextMenuResult {
  const { handlePaste, canPaste } = useClipboardOperations();

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null
  );

  const handlePlaceholderContextMenu = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault();

      // Select placeholder row and clear active cell so paste targets end of list
      const store = useTaskStore.getState();
      store.setSelectedTaskIds([PLACEHOLDER_TASK_ID], false);
      store.setActiveCell(null, null);

      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    []
  );

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
          size: CONTEXT_MENU.iconSize,
          weight: CONTEXT_MENU.iconWeight,
        }),
        shortcut: "Ctrl+V",
        onClick: () => void handlePaste(),
        disabled: !canPaste,
      },
    ];
  }, [contextMenu, canPaste, handlePaste]);

  return {
    contextMenu,
    contextMenuItems,
    handlePlaceholderContextMenu,
    closeContextMenu,
  };
}
