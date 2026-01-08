/**
 * ZoomToolbar - Zoom control toolbar for Gantt chart
 * Sprint 1.2 Package 3: Navigation & Scale
 *
 * Features:
 * - Zoom in/out buttons
 * - Zoom level dropdown with preset levels
 * - Fit to Width button to fit entire project in view
 * - Visual feedback for zoom limits
 */

import React from "react";
import {
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOutLineHorizontal,
} from "@phosphor-icons/react";
import { useChartStore } from "../../store/slices/chartSlice";
import { useTaskStore } from "../../store/slices/taskSlice";
import { getViewportCenterAnchor, applyScrollLeft } from "../../hooks/useZoom";

const PRESET_ZOOM_LEVELS = [50, 75, 100, 125, 150, 200, 250, 300];

export function ZoomToolbar() {
  const { zoom, zoomIn, zoomOut, fitToView } = useChartStore();
  const tasks = useTaskStore((state) => state.tasks);

  const zoomPercentage = Math.round(zoom * 100);
  const canZoomIn = zoom < 3.0;
  const canZoomOut = zoom > 0.5;

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
    <div className="zoom-toolbar flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
      {/* Zoom Out Button */}
      <button
        className={`p-1.5 rounded transition-colors ${
          !canZoomOut
            ? "text-slate-300 cursor-not-allowed"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200"
        }`}
        onClick={handleZoomOut}
        disabled={!canZoomOut}
        title="Zoom Out (Ctrl+-)"
        aria-label="Zoom out"
      >
        <MagnifyingGlassMinus size={18} weight="regular" />
      </button>

      {/* Zoom Level Dropdown - uses global select styles from index.css */}
      <select
        className="h-6"
        value={zoomPercentage}
        onChange={handleZoomLevelChange}
        aria-label="Zoom level"
      >
        {PRESET_ZOOM_LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}%
          </option>
        ))}
        <option value="fit">Fit to Width</option>
      </select>

      {/* Zoom In Button */}
      <button
        className={`p-1.5 rounded transition-colors ${
          !canZoomIn
            ? "text-slate-300 cursor-not-allowed"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200"
        }`}
        onClick={handleZoomIn}
        disabled={!canZoomIn}
        title="Zoom In (Ctrl++)"
        aria-label="Zoom in"
      >
        <MagnifyingGlassPlus size={18} weight="regular" />
      </button>

      {/* Fit to Width Button */}
      <button
        className="p-1.5 rounded transition-colors text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200"
        onClick={handleFitToWidth}
        title="Fit to width"
        aria-label="Fit to width"
      >
        <ArrowsOutLineHorizontal size={18} weight="regular" />
      </button>
    </div>
  );
}
