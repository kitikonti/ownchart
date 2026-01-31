/**
 * FileMenu - File dropdown menu for the Ribbon tab bar.
 * Extracted from Ribbon.tsx for modularity.
 */

import { File, FolderOpen, FloppyDisk, Export } from "@phosphor-icons/react";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownPanel } from "../Toolbar/DropdownPanel";

interface FileMenuProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: () => void;
}

export function FileMenu({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExport,
}: FileMenuProps): JSX.Element {
  const { isOpen, toggle, close, containerRef } = useDropdown();

  const handleAction = (action: () => void) => () => {
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
        <DropdownPanel minWidth="14rem">
          <button className="file-menu-item" onClick={handleAction(onNew)}>
            <File size={18} weight="light" />
            <span>New</span>
            <span className="file-menu-shortcut">Ctrl+Alt+N</span>
          </button>
          <button className="file-menu-item" onClick={handleAction(onOpen)}>
            <FolderOpen size={18} weight="light" />
            <span>Open</span>
            <span className="file-menu-shortcut">Ctrl+O</span>
          </button>
          <button className="file-menu-item" onClick={handleAction(onSave)}>
            <FloppyDisk size={18} weight="light" />
            <span>Save</span>
            <span className="file-menu-shortcut">Ctrl+S</span>
          </button>
          <button className="file-menu-item" onClick={handleAction(onSaveAs)}>
            <FloppyDisk size={18} weight="light" />
            <span>Save As...</span>
            <span className="file-menu-shortcut">Ctrl+Shift+S</span>
          </button>
          <div className="file-menu-divider" />
          <button className="file-menu-item" onClick={handleAction(onExport)}>
            <Export size={18} weight="light" />
            <span>Export</span>
            <span className="file-menu-shortcut">Ctrl+E</span>
          </button>
        </DropdownPanel>
      )}
    </div>
  );
}
