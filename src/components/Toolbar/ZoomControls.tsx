/**
 * ZoomControls - Compact zoom controls for app toolbar
 * Sprint 1.2 Package 3: Navigation & Scale
 */

import { MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsOutLineHorizontal } from '@phosphor-icons/react';
import { useChartStore } from '../../store/slices/chartSlice';
import { useTaskStore } from '../../store/slices/taskSlice';
import { MIN_ZOOM, MAX_ZOOM } from '../../utils/timelineUtils';

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
    const insertIndex = zoomOptions.findIndex((level) => level > zoomPercentage);
    if (insertIndex === -1) {
      zoomOptions.push(zoomPercentage);
    } else {
      zoomOptions.splice(insertIndex, 0, zoomPercentage);
    }
  }

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
    <div className="flex items-center gap-1.5">
      {/* Zoom Out Button */}
      <button
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        onClick={zoomOut}
        disabled={!canZoomOut}
        title="Zoom Out (Ctrl+-)"
        aria-label="Zoom out"
      >
        <MagnifyingGlassMinus size={18} weight="regular" />
      </button>

      {/* Zoom Level Dropdown */}
      <select
        className="h-7 px-2 pr-7 border border-gray-300 rounded bg-white text-xs font-medium cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={zoomPercentage}
        onChange={handleZoomLevelChange}
        aria-label="Zoom level"
        style={{
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 6px center',
        }}
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
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        onClick={zoomIn}
        disabled={!canZoomIn}
        title="Zoom In (Ctrl++)"
        aria-label="Zoom in"
      >
        <MagnifyingGlassPlus size={18} weight="regular" />
      </button>

      {/* Fit to Width Button */}
      <button
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        onClick={handleFitToWidth}
        title="Fit to width"
        aria-label="Fit to width"
      >
        <ArrowsOutLineHorizontal size={18} weight="regular" />
      </button>
    </div>
  );
}
