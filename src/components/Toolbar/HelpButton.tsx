/**
 * HelpButton - Toolbar button to open help panel
 */

import { Question } from "@phosphor-icons/react";
import { useUIStore } from "../../store/slices/uiSlice";

export function HelpButton() {
  const openHelpPanel = useUIStore((state) => state.openHelpPanel);

  return (
    <button
      onClick={openHelpPanel}
      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700"
      title="Help (?)"
      aria-label="Help"
    >
      <Question size={18} weight="regular" />
    </button>
  );
}
