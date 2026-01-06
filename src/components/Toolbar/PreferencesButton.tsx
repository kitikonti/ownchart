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
      className="p-1.5 rounded-md transition-colors text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      title="Preferences"
      aria-label="Preferences"
    >
      <Gear size={20} weight="regular" />
    </button>
  );
}
