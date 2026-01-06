/**
 * Quick Toggle buttons for the toolbar.
 * Sprint 1.5.9: User Preferences & Settings
 *
 * Based on persona research (Section 2.3 of concept doc):
 * - Only Dependencies toggle is shown in toolbar (Option A)
 * - Other toggles available via keyboard shortcuts and Chart Settings
 */

import { FlowArrow } from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";

/**
 * QuickToggles component for toolbar.
 * Shows toggle buttons for frequently used view settings.
 */
export function QuickToggles(): JSX.Element {
  const showDependencies = useChartStore((state) => state.showDependencies);
  const toggleDependencies = useChartStore((state) => state.toggleDependencies);

  const densityConfig = useDensityConfig();
  const iconSize = densityConfig.iconSize;

  return (
    <div className="flex items-center gap-1">
      {/* Dependencies Toggle */}
      <button
        type="button"
        onClick={toggleDependencies}
        aria-pressed={showDependencies}
        aria-label={
          showDependencies ? "Hide Dependencies (D)" : "Show Dependencies (D)"
        }
        title={
          showDependencies ? "Hide Dependencies (D)" : "Show Dependencies (D)"
        }
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          showDependencies
            ? "bg-slate-200 text-slate-900 hover:bg-slate-300"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
      >
        <FlowArrow size={iconSize} weight="regular" />
      </button>
    </div>
  );
}
