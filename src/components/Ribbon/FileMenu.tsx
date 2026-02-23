/**
 * FileMenu - File dropdown menu for the Ribbon tab bar.
 * Extracted from Ribbon.tsx for modularity.
 */

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

  const handleAction =
    (action: () => void): (() => void) =>
    () => {
      action();
      close();
    };

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
          <button
            role="menuitem"
            className="file-menu-item"
            onClick={handleAction(onNew)}
          >
            <File size={ICON_SIZE} weight="light" />
            <span>New</span>
            <span className="file-menu-shortcut">Ctrl+Alt+N</span>
          </button>
          <button
            role="menuitem"
            className="file-menu-item"
            onClick={handleAction(onOpen)}
          >
            <FolderOpen size={ICON_SIZE} weight="light" />
            <span>Open</span>
            <span className="file-menu-shortcut">Ctrl+O</span>
          </button>
          <button
            role="menuitem"
            className="file-menu-item"
            onClick={handleAction(onSave)}
          >
            <FloppyDisk size={ICON_SIZE} weight="light" />
            <span>Save</span>
            <span className="file-menu-shortcut">Ctrl+S</span>
          </button>
          <button
            role="menuitem"
            className="file-menu-item"
            onClick={handleAction(onSaveAs)}
          >
            <FloppyDisk size={ICON_SIZE} weight="light" />
            <span>Save As...</span>
            <span className="file-menu-shortcut">Ctrl+Shift+S</span>
          </button>
          <button
            role="menuitem"
            className="file-menu-item"
            onClick={handleAction(onRename)}
          >
            <PencilSimple size={ICON_SIZE} weight="light" />
            <span>Rename</span>
            <span className="file-menu-shortcut">F2</span>
          </button>
          <div role="separator" className="file-menu-divider" />
          <button
            role="menuitem"
            className="file-menu-item"
            onClick={handleAction(onExport)}
          >
            <Export size={ICON_SIZE} weight="light" />
            <span>Export</span>
            <span className="file-menu-shortcut">Ctrl+E</span>
          </button>
        </DropdownPanel>
      )}
    </div>
  );
}
