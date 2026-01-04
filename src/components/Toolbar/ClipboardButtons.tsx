/**
 * ClipboardButtons - Copy/Cut/Paste buttons for the toolbar
 * Supports both row-level and cell-level operations
 */

import { Copy, Scissors, ClipboardText } from "@phosphor-icons/react";
import { useClipboardOperations } from "../../hooks/useClipboardOperations";

export function ClipboardButtons() {
  const { handleCopy, handleCut, handlePaste, canCopyOrCut, canPaste } =
    useClipboardOperations();

  return (
    <div className="inline-flex items-center gap-1 border-r border-gray-200 pr-2">
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        disabled={!canCopyOrCut}
        className={`p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !canCopyOrCut ? "opacity-40 cursor-not-allowed" : ""
        }`}
        title="Copy (Ctrl+C)"
        aria-label="Copy"
      >
        <Copy size={18} weight="regular" className="text-gray-700" />
      </button>

      {/* Cut Button */}
      <button
        onClick={handleCut}
        disabled={!canCopyOrCut}
        className={`p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !canCopyOrCut ? "opacity-40 cursor-not-allowed" : ""
        }`}
        title="Cut (Ctrl+X)"
        aria-label="Cut"
      >
        <Scissors size={18} weight="regular" className="text-gray-700" />
      </button>

      {/* Paste Button */}
      <button
        onClick={handlePaste}
        disabled={!canPaste}
        className={`p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !canPaste ? "opacity-40 cursor-not-allowed" : ""
        }`}
        title="Paste (Ctrl+V)"
        aria-label="Paste"
      >
        <ClipboardText size={18} weight="regular" className="text-gray-700" />
      </button>
    </div>
  );
}
