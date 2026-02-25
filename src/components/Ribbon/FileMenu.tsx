/**
 * FileMenu - File dropdown menu for the Ribbon tab bar.
 * Extracted from Ribbon.tsx for modularity.
 *
 * Keyboard navigation follows WAI-ARIA Menu pattern:
 * ArrowDown/ArrowUp move focus, Home/End jump, Enter/Space activate.
 */

import { useRef, useEffect, useCallback, useMemo, type ReactNode } from "react";
import {
  File,
  FolderOpen,
  FloppyDisk,
  PencilSimple,
  Export,
} from "@phosphor-icons/react";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { TOOLBAR } from "../Toolbar/ToolbarPrimitives";

const ICON_SIZE = TOOLBAR.iconSizeMenu;

interface FileMenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  shortcut: string;
  action: () => void;
  /** Visual separator after this item */
  separator?: boolean;
}

interface FileMenuProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onRename: () => void;
  onExport: () => void;
}

export function FileMenu({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onRename,
  onExport,
}: FileMenuProps): JSX.Element {
  const { isOpen, toggle, close, containerRef } = useDropdown();
  const menuRef = useRef<HTMLDivElement>(null);
  const focusedIndexRef = useRef(0);

  const items: FileMenuItem[] = useMemo(
    () => [
      {
        id: "new",
        label: "New",
        icon: <File size={ICON_SIZE} weight="light" />,
        shortcut: "Ctrl+Alt+N",
        action: onNew,
      },
      {
        id: "open",
        label: "Open",
        icon: <FolderOpen size={ICON_SIZE} weight="light" />,
        shortcut: "Ctrl+O",
        action: onOpen,
      },
      {
        id: "save",
        label: "Save",
        icon: <FloppyDisk size={ICON_SIZE} weight="light" />,
        shortcut: "Ctrl+S",
        action: onSave,
      },
      {
        id: "saveAs",
        label: "Save As...",
        icon: <FloppyDisk size={ICON_SIZE} weight="light" />,
        shortcut: "Ctrl+Shift+S",
        action: onSaveAs,
      },
      {
        id: "rename",
        label: "Rename",
        icon: <PencilSimple size={ICON_SIZE} weight="light" />,
        shortcut: "F2",
        action: onRename,
        separator: true,
      },
      {
        id: "export",
        label: "Export",
        icon: <Export size={ICON_SIZE} weight="light" />,
        shortcut: "Ctrl+E",
        action: onExport,
      },
    ],
    [onNew, onOpen, onSave, onSaveAs, onRename, onExport]
  );

  // Focus an item by index (follows ContextMenu pattern with data-index)
  const focusItem = useCallback((index: number): void => {
    const el = menuRef.current?.querySelector(
      `[data-index="${index}"]`
    ) as HTMLElement | null;
    el?.focus();
    focusedIndexRef.current = index;
  }, []);

  // Auto-focus first item when menu opens
  useEffect(() => {
    if (isOpen) {
      // Wait for DOM render before focusing
      requestAnimationFrame(() => focusItem(0));
    }
  }, [isOpen, focusItem]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      const count = items.length;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = (focusedIndexRef.current + 1) % count;
          focusItem(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = (focusedIndexRef.current - 1 + count) % count;
          focusItem(prev);
          break;
        }
        case "Home": {
          e.preventDefault();
          focusItem(0);
          break;
        }
        case "End": {
          e.preventDefault();
          focusItem(count - 1);
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          const item = items[focusedIndexRef.current];
          if (item) {
            item.action();
            close();
          }
          break;
        }
      }
    },
    [items, focusItem, close]
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggle}
        className={`ribbon-tab ribbon-tab-file ${isOpen ? "ribbon-tab-active" : ""}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        File
      </button>

      {isOpen && (
        <DropdownPanel
          minWidth={TOOLBAR.fileMenuMinWidth}
          role="menu"
          aria-label="File menu"
        >
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div ref={menuRef} onKeyDown={handleKeyDown}>
            {items.map((item, index) => (
              <div key={item.id}>
                <button
                  data-index={index}
                  role="menuitem"
                  tabIndex={-1}
                  className="file-menu-item"
                  onClick={() => {
                    item.action();
                    close();
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <span className="file-menu-shortcut">{item.shortcut}</span>
                </button>
                {item.separator && (
                  <div role="separator" className="file-menu-divider" />
                )}
              </div>
            ))}
          </div>
        </DropdownPanel>
      )}
    </div>
  );
}
