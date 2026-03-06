/**
 * StatusBar - MS Fluent UI inspired status bar at the bottom of the app
 *
 * Left side: App version (clickable → About dialog) + task statistics
 * Right side: Zoom controls (see ZoomControls)
 */

import { useMemo } from "react";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useUIStore } from "../../store/slices/uiSlice";
import { ZoomControls } from "./ZoomControls";

export function StatusBar(): JSX.Element {
  const openAboutDialog = useUIStore((state) => state.openAboutDialog);
  const tasks = useTaskStore((state) => state.tasks);
  const showProgress = useChartStore((state) => state.showProgress);

  const totalTasks = tasks.length;

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.progress === 100).length,
    [tasks]
  );

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter((t) => {
      const endDate = new Date(t.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today && t.progress < 100;
    }).length;
  }, [tasks]);

  return (
    <div className="status-bar h-6 flex-shrink-0 flex items-center justify-between select-none bg-neutral-50 border-neutral-200 text-xs px-3">
      {/* Left: version + task statistics */}
      <div className="flex items-center text-neutral-500">
        <button
          type="button"
          onClick={openAboutDialog}
          className="text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors"
          aria-label="About OwnChart"
        >
          OwnChart v{__APP_VERSION__}
        </button>
        <span className="mx-1.5 text-neutral-300">·</span>
        <span>{totalTasks} Tasks</span>
        {showProgress && (
          <>
            <span className="mx-1.5 text-neutral-300">·</span>
            <span>{completedTasks} Completed</span>
            {overdueTasks > 0 && (
              <>
                <span className="mx-1.5 text-neutral-300">·</span>
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
}
