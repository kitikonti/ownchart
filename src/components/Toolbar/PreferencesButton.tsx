/**
 * PreferencesButton - Toolbar button to open preferences dialog
 */

import { Gear } from "@phosphor-icons/react";
import { useUIStore } from "../../store/slices/uiSlice";

export function PreferencesButton() {
  const openPreferencesDialog = useUIStore(
    (state) => state.openPreferencesDialog
  );

  return (
    <button
      onClick={openPreferencesDialog}
      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700"
      title="Preferences"
      aria-label="Preferences"
    >
      <Gear size={18} weight="regular" />
    </button>
  );
}
