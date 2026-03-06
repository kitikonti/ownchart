/**
 * StatusBar - MS Fluent UI inspired status bar at the bottom of the app
 *
 * Left side: App version (clickable → About dialog) + task statistics
 * Right side: Zoom controls (see ZoomControls)
 */

import { memo } from "react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useUIStore } from "../../store/slices/uiSlice";
import { useTaskStatistics } from "../../hooks/useTaskStatistics";
import { ZoomControls } from "./ZoomControls";

/** Decorative bullet separator between statistics. Hidden from screen readers. */
function Sep(): JSX.Element {
  return (
    <span className="mx-1.5 text-neutral-300" aria-hidden="true">
      ·
    </span>
  );
}

export const StatusBar = memo(function StatusBar(): JSX.Element {
  const openAboutDialog = useUIStore((state) => state.openAboutDialog);
  const showProgress = useChartStore((state) => state.showProgress);
  const { totalTasks, completedTasks, overdueTasks } = useTaskStatistics();

  return (
    <div className="status-bar h-6 flex-shrink-0 flex items-center justify-between select-none bg-neutral-50 border-neutral-200 text-xs px-3">
      {/* Left: version + task statistics */}
      <div
        role="status"
        aria-label="Task statistics"
        className="flex items-center text-neutral-500"
      >
        <button
          type="button"
          onClick={openAboutDialog}
          className="text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors"
          aria-label="About OwnChart"
        >
          OwnChart v{__APP_VERSION__}
        </button>
        <Sep />
        <span>
          {totalTasks} {totalTasks === 1 ? "Task" : "Tasks"}
        </span>
        {showProgress && (
          <>
            <Sep />
            <span>{completedTasks} Completed</span>
            {overdueTasks > 0 && (
              <>
                <Sep />
                <span className="text-error">{overdueTasks} Overdue</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Right: zoom controls */}
      <ZoomControls />
    </div>
  );
});
