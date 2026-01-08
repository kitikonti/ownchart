/**
 * ZoomControls - Compact zoom controls for app toolbar
 * Sprint 1.2 Package 3: Navigation & Scale
 */

import {
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOutLineHorizontal,
} from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useTaskStore } from "../../store/slices/taskSlice";
import { getViewportCenterAnchor, applyScrollLeft } from "../../hooks/useZoom";
import { MIN_ZOOM, MAX_ZOOM } from "../../utils/timelineUtils";

// Preset zoom levels optimized for 5%-300% range
// Focus on lower zoom levels (5-100%) for long-term projects
const PRESET_ZOOM_LEVELS = [5, 10, 25, 50, 75, 100, 150, 200, 300];

export function ZoomControls() {
  // Use selectors for reactive updates
  const zoom = useChartStore((state) => state.zoom);
  const zoomIn = useChartStore((state) => state.zoomIn);
  const zoomOut = useChartStore((state) => state.zoomOut);
  const fitToView = useChartStore((state) => state.fitToView);
  const tasks = useTaskStore((state) => state.tasks);

  const zoomPercentage = Math.round(zoom * 100);
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  // Generate zoom options: presets + current zoom if not in presets
  const zoomOptions = [...PRESET_ZOOM_LEVELS];
  if (!PRESET_ZOOM_LEVELS.includes(zoomPercentage)) {
    // Insert current zoom in correct position (sorted)
    const insertIndex = zoomOptions.findIndex(
      (level) => level > zoomPercentage
    );
    if (insertIndex === -1) {
      zoomOptions.push(zoomPercentage);
    } else {
      zoomOptions.splice(insertIndex, 0, zoomPercentage);
    }
  }

  // Zoom with viewport-center anchoring
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

  const handleZoomLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "fit") {
      fitToView(tasks);
    } else {
      const anchor = getViewportCenterAnchor();
      const newZoom = parseInt(value) / 100;
      const result = useChartStore.getState().setZoom(newZoom, anchor);
      applyScrollLeft(result.newScrollLeft);
    }
  };

  const handleFitToWidth = () => {
    fitToView(tasks);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Zoom Out Button */}
      <button
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          !canZoomOut
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        onClick={handleZoomOut}
        disabled={!canZoomOut}
        title="Zoom Out (Ctrl+-)"
        aria-label="Zoom out"
      >
        <MagnifyingGlassMinus size={20} weight="regular" />
      </button>

      {/* Zoom Level Dropdown - uses global select styles from index.css */}
      <select
        className="h-7"
        value={zoomPercentage}
        onChange={handleZoomLevelChange}
        aria-label="Zoom level"
      >
        {zoomOptions.map((level) => (
          <option key={level} value={level}>
            {level}%
          </option>
        ))}
        <option value="fit">Fit to Width</option>
      </select>

      {/* Zoom In Button */}
      <button
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          !canZoomIn
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        onClick={handleZoomIn}
        disabled={!canZoomIn}
        title="Zoom In (Ctrl++)"
        aria-label="Zoom in"
      >
        <MagnifyingGlassPlus size={20} weight="regular" />
      </button>

      {/* Fit to Width Button */}
      <button
        className="p-1.5 rounded-md transition-colors text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        onClick={handleFitToWidth}
        title="Fit to width"
        aria-label="Fit to width"
      >
        <ArrowsOutLineHorizontal size={20} weight="regular" />
      </button>
    </div>
  );
}
