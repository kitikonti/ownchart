/**
 * Quick Toggle buttons for the toolbar.
 * Sprint 1.5.9: User Preferences & Settings
 *
 * Based on persona research (Section 2.3 of concept doc):
 * - Only Dependencies toggle is shown in toolbar (Option A)
 * - Other toggles available via keyboard shortcuts and Chart Settings
 */

import { GitBranch } from "@phosphor-icons/react";
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
        className={`
          flex items-center justify-center p-1.5 rounded transition-colors
          ${
            showDependencies
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }
        `}
      >
        <GitBranch
          size={iconSize}
          weight={showDependencies ? "fill" : "regular"}
        />
      </button>
    </div>
  );
}
