/**
 * ChartCanvas - Main Gantt chart SVG container
 * Features: ResizeObserver, layer architecture, scale management
 */

import { useRef, useEffect, useState } from 'react';
import type { Task } from '../../types/chart.types';
import { useChartStore } from '../../store/slices/chartSlice';
import { GridLines } from './GridLines';
import { TaskBar } from './TaskBar';
import { TimelineHeader } from './TimelineHeader';
import { TodayMarker } from './TodayMarker';

interface ChartCanvasProps {
  tasks: Task[];
  selectedTaskIds: string[];
  onTaskClick?: (taskId: string) => void;
  onTaskDoubleClick?: (taskId: string) => void;
}

const ROW_HEIGHT = 44; // Match TaskTable cell height (h-[44px] with border-box)
const HEADER_HEIGHT = 48; // 2×24px rows (border drawn separately in SVG)

export function ChartCanvas({
  tasks,
  selectedTaskIds,
  onTaskClick,
  onTaskDoubleClick,
}: ChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600); // Default height
  const {
    scale,
    showWeekends,
    showTodayMarker,
    setContainerWidth,
    updateScale,
  } = useChartStore();

  // ResizeObserver with debouncing (Frontend review)
  useEffect(() => {
    if (!containerRef.current) return;

    let timeoutId: number;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        const width = entries[0].contentRect.width;
        const height = entries[0].contentRect.height;
        setContainerWidth(width);
        setContainerHeight(height);
      }, 150); // Debounce 150ms
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [setContainerWidth]);

  // Trigger scale calculation when tasks or container width changes
  useEffect(() => {
    updateScale(tasks);
  }, [tasks, updateScale]);

  // Calculate how many rows fit in the visible area (for grid rendering)
  const visibleRowCount = Math.max(tasks.length, Math.ceil((containerHeight - HEADER_HEIGHT) / ROW_HEIGHT));

  // Calculate content SVG height (without header)
  const contentHeight = visibleRowCount * ROW_HEIGHT;

  // Don't render if scale not ready
  if (!scale) {
    return (
      <div ref={containerRef} className="chart-canvas-container">
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading timeline...
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="chart-canvas-container min-h-full w-full overflow-x-auto bg-white relative">
      {/* Chart Content (Header now on App level) */}
      <svg
        width={scale.totalWidth}
        height={contentHeight}
        className="gantt-chart block select-none"
      >
        {/* Layer 2: Background (Grid Lines) */}
        <g className="layer-background">
          <GridLines
            scale={scale}
            taskCount={visibleRowCount}
            showWeekends={showWeekends}
          />
        </g>

        {/* Layer 3: Task Bars */}
        <g className="layer-tasks">
          {tasks.map((task, index) => (
            <TaskBar
              key={task.id}
              task={task}
              scale={scale}
              rowIndex={index}
              isSelected={selectedTaskIds.includes(task.id)}
              onClick={() => onTaskClick?.(task.id)}
              onDoubleClick={() => onTaskDoubleClick?.(task.id)}
            />
          ))}
        </g>

        {/* Layer 4: Today Marker */}
        {showTodayMarker && (
          <TodayMarker scale={scale} svgHeight={contentHeight} />
        )}
      </svg>
    </div>
  );
}
