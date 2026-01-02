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

import React from 'react';
import { MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsOutLineHorizontal } from '@phosphor-icons/react';
import { useChartStore } from '../../store/slices/chartSlice';
import { useTaskStore } from '../../store/slices/taskSlice';

const PRESET_ZOOM_LEVELS = [50, 75, 100, 125, 150, 200, 250, 300];

export function ZoomToolbar() {
  const { zoom, zoomIn, zoomOut, resetZoom, fitToView } = useChartStore();
  const tasks = useTaskStore((state) => state.tasks);

  const zoomPercentage = Math.round(zoom * 100);
  const canZoomIn = zoom < 3.0;
  const canZoomOut = zoom > 0.5;

  const handleZoomLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'fit') {
      fitToView(tasks);
    } else {
      const newZoom = parseInt(value) / 100;
      useChartStore.getState().setZoom(newZoom);
    }
  };

  const handleFitToWidth = () => {
    fitToView(tasks);
  };

  return (
    <div className="zoom-toolbar flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
      {/* Zoom Out Button */}
      <button
        className="zoom-button flex items-center justify-center w-8 h-8 p-0 border border-gray-300 rounded bg-white hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        onClick={zoomOut}
        disabled={!canZoomOut}
        title="Zoom Out (Ctrl+-)"
        aria-label="Zoom out"
      >
        <MagnifyingGlassMinus size={18} weight="regular" />
      </button>

      {/* Zoom Level Dropdown */}
      <select
        className="zoom-level-select h-8 px-2 pr-8 border border-gray-300 rounded bg-white text-sm font-medium cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={zoomPercentage}
        onChange={handleZoomLevelChange}
        aria-label="Zoom level"
        style={{
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
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
        className="zoom-button flex items-center justify-center w-8 h-8 p-0 border border-gray-300 rounded bg-white hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        onClick={zoomIn}
        disabled={!canZoomIn}
        title="Zoom In (Ctrl++)"
        aria-label="Zoom in"
      >
        <MagnifyingGlassPlus size={18} weight="regular" />
      </button>

      {/* Fit to Width Button */}
      <button
        className="fit-button flex items-center justify-center w-8 h-8 p-0 border border-gray-300 rounded bg-white hover:bg-gray-100 active:bg-gray-200 transition-all duration-150"
        onClick={handleFitToWidth}
        title="Fit to width"
        aria-label="Fit to width"
      >
        <ArrowsOutLineHorizontal size={18} weight="regular" />
      </button>

      {/* Reset Zoom Button (Ctrl+0) */}
      <button
        className="zoom-button flex items-center justify-center w-8 h-8 p-0 border border-gray-300 rounded bg-white hover:bg-gray-100 active:bg-gray-200 transition-all duration-150"
        onClick={resetZoom}
        title="Reset zoom to 100% (Ctrl+0)"
        aria-label="Reset zoom"
      >
        <span className="text-xs font-medium leading-none">1:1</span>
      </button>
    </div>
  );
}
