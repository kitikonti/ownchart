/**
 * StatusBar - MS Fluent UI inspired status bar at the bottom of the app
 *
 * Left side: Task statistics (count, completed, overdue)
 * Right side: Zoom controls (slider, +/-, percentage, fit button)
 */

import { useState, useMemo } from "react";
import {
  Minus,
  Plus,
  ArrowsOutLineHorizontal,
} from "@phosphor-icons/react";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { MIN_ZOOM, MAX_ZOOM } from "../../utils/timelineUtils";
import { getViewportCenterAnchor, applyScrollLeft } from "../../hooks/useZoom";
import { ZoomDialog } from "./ZoomDialog";

export function StatusBar() {
  const [isZoomDialogOpen, setIsZoomDialogOpen] = useState(false);

  // Task store
  const tasks = useTaskStore((state) => state.tasks);

  // Chart store
  const zoom = useChartStore((state) => state.zoom);
  const showProgress = useChartStore((state) => state.showProgress);
  const setZoom = useChartStore((state) => state.setZoom);
  const zoomIn = useChartStore((state) => state.zoomIn);
  const zoomOut = useChartStore((state) => state.zoomOut);
  const fitToView = useChartStore((state) => state.fitToView);

  // Calculate task statistics
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

  // Zoom percentage (5% - 300%)
  const zoomPercentage = Math.round(zoom * 100);

  // Check if at zoom limits
  const isAtMinZoom = zoom <= MIN_ZOOM;
  const isAtMaxZoom = zoom >= MAX_ZOOM;

  // Handle zoom slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoomPercent = parseInt(e.target.value, 10);
    const newZoom = newZoomPercent / 100;
    const anchor = getViewportCenterAnchor();
    const result = setZoom(newZoom, anchor);
    applyScrollLeft(result.newScrollLeft);
  };

  // Handle zoom in/out buttons
  const handleZoomIn = () => {
    const anchor = getViewportCenterAnchor();
    const result = zoomIn(anchor);
    applyScrollLeft(result.newScrollLeft);
  };

  const handleZoomOut = () => {
    const anchor = getViewportCenterAnchor();
    const result = zoomOut(anchor);
    applyScrollLeft(result.newScrollLeft);
  };

  // Handle fit to view
  const handleFitToView = () => {
    fitToView(tasks);
  };

  // Handle zoom dialog selection
  const handleZoomSelect = (newZoom: number | "fit") => {
    if (newZoom === "fit") {
      fitToView(tasks);
    } else {
      const anchor = getViewportCenterAnchor();
      const result = setZoom(newZoom, anchor);
      applyScrollLeft(result.newScrollLeft);
    }
    setIsZoomDialogOpen(false);
  };

  return (
    <>
      {/* Status Bar */}
      <div
        className="h-6 flex-shrink-0 flex items-center justify-between px-3 bg-white border-t border-neutral-200 select-none"
        style={{ fontSize: "12px" }}
      >
        {/* Left side: Task statistics */}
        <div className="flex items-center text-neutral-500">
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

        {/* Right side: Zoom controls */}
        <div className="flex items-center gap-2">
          {/* Zoom out button */}
          <button
            onClick={handleZoomOut}
            disabled={isAtMinZoom}
            className="p-0.5 text-neutral-500 hover:text-neutral-700 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom out"
          >
            <Minus size={16} weight="bold" />
          </button>

          {/* Zoom slider */}
          <input
            type="range"
            min={MIN_ZOOM * 100}
            max={MAX_ZOOM * 100}
            value={zoomPercentage}
            onChange={handleSliderChange}
            className="status-bar-slider w-24 h-1 bg-neutral-300 rounded-full appearance-none cursor-pointer"
            aria-label="Zoom level"
          />

          {/* Zoom in button */}
          <button
            onClick={handleZoomIn}
            disabled={isAtMaxZoom}
            className="p-0.5 text-neutral-500 hover:text-neutral-700 disabled:text-neutral-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom in"
          >
            <Plus size={16} weight="bold" />
          </button>

          {/* Zoom percentage (clickable) */}
          <button
            onClick={() => setIsZoomDialogOpen(true)}
            className="min-w-[44px] text-right text-neutral-600 hover:text-neutral-800 hover:underline cursor-pointer transition-colors"
            aria-label="Open zoom dialog"
          >
            {zoomPercentage}%
          </button>

          {/* Fit to view button */}
          <button
            onClick={handleFitToView}
            className="p-0.5 text-neutral-500 hover:text-neutral-700 transition-colors"
            aria-label="Fit to view"
            title="Fit to View"
          >
            <ArrowsOutLineHorizontal size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Zoom Dialog */}
      <ZoomDialog
        isOpen={isZoomDialogOpen}
        onClose={() => setIsZoomDialogOpen(false)}
        currentZoom={zoom}
        onSelect={handleZoomSelect}
      />
    </>
  );
}
