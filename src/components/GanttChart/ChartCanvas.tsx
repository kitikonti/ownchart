/**
 * ChartCanvas - Main Gantt chart SVG container
 * Features: Layer architecture, scale management, zoom navigation
 * Sprint 1.2 Package 3: Navigation & Scale
 * Sprint 1.4: Dependencies (Finish-to-Start Only)
 *
 * Note: Container dimensions are measured at App.tsx level and passed as props
 * to avoid feedback loop when zooming (zoom -> SVG grows -> width measurement -> repeat)
 */

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import type { Task } from "../../types/chart.types";
import { useChartStore } from "../../store/slices/chartSlice";
import { useZoom } from "../../hooks/useZoom";
import { useDependencyDrag } from "../../hooks/useDependencyDrag";
import { GridLines } from "./GridLines";
import { TaskBar } from "./TaskBar";
import { TodayMarker } from "./TodayMarker";
import { DependencyArrows } from "./DependencyArrows";
import { ConnectionHandles } from "./ConnectionHandles";
import { getTaskBarGeometry } from "../../utils/timelineUtils";

interface ChartCanvasProps {
  tasks: Task[];
  selectedTaskIds: string[];
  onTaskClick?: (taskId: string) => void;
  onTaskDoubleClick?: (taskId: string) => void;
  containerHeight?: number; // Height from parent container
  containerWidth?: number; // Width from parent container (viewport, not content)
}

const ROW_HEIGHT = 44; // Match TaskTable cell height (h-[44px] with border-box)

export function ChartCanvas({
  tasks,
  selectedTaskIds,
  onTaskClick,
  onTaskDoubleClick,
  containerHeight = 600,
  containerWidth: propContainerWidth = 800,
}: ChartCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // State for tracking which task's connection handles are visible
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // Use individual selectors for proper Zustand re-render (like ZoomIndicator)
  const scale = useChartStore((state) => state.scale);
  const zoom = useChartStore((state) => state.zoom);
  const showWeekends = useChartStore((state) => state.showWeekends);
  const showTodayMarker = useChartStore((state) => state.showTodayMarker);
  const setContainerWidth = useChartStore((state) => state.setContainerWidth);
  const updateScale = useChartStore((state) => state.updateScale);

  // Sprint 1.4: Dependency drag interaction
  const { dragState, startDrag, endDrag, isValidTarget, isInvalidTarget } =
    useDependencyDrag({
      tasks,
      svgRef,
      enabled: true,
    });

  // Use prop as containerWidth (measured at App.tsx level to avoid feedback loop)
  const containerWidth = propContainerWidth;

  // Zoom hook (Sprint 1.2 Package 3)
  const { handlers } = useZoom({
    containerRef: svgContainerRef,
    enabled: true,
  });

  // Sync containerWidth to Zustand store (so other components can use it)
  useEffect(() => {
    setContainerWidth(containerWidth);
  }, [containerWidth, setContainerWidth]);

  // Trigger scale calculation when tasks, container width, or zoom changes
  useEffect(() => {
    updateScale(tasks);
  }, [tasks, containerWidth, zoom, updateScale]);

  // Sprint 1.4: Calculate task geometries for connection handles
  const taskGeometries = useMemo(() => {
    if (!scale)
      return new Map<
        string,
        { x: number; y: number; width: number; height: number }
      >();

    const geometries = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >();
    tasks.forEach((task, index) => {
      if (!task.startDate || (!task.endDate && task.type !== "milestone")) {
        return;
      }
      if (task.type === "summary") {
        // Summary tasks don't have connection handles
        return;
      }
      const geo = getTaskBarGeometry(task, scale, index, ROW_HEIGHT, 0);
      geometries.set(task.id, {
        x: geo.x,
        y: geo.y,
        width: geo.width,
        height: geo.height,
      });
    });
    return geometries;
  }, [tasks, scale]);

  // Sprint 1.4: Handle mouse up on task for dependency drop
  const handleTaskMouseUp = useCallback(
    (taskId: string) => {
      if (dragState.isDragging) {
        endDrag(taskId);
      }
    },
    [dragState.isDragging, endDrag]
  );

  // Don't render if scale not ready
  if (!scale) {
    return (
      <div
        ref={outerRef}
        className="chart-canvas-container w-full min-h-screen"
      >
        <div ref={containerRef} className="w-full min-h-screen">
          <div className="flex items-center justify-center min-h-screen text-gray-500">
            Loading timeline...
          </div>
        </div>
      </div>
    );
  }

  // Height calculation: Always render full task-based height
  // With SVAR-style layout, parent handles virtual scrolling via translateY
  const taskBasedHeight = tasks.length * ROW_HEIGHT;

  // Use task-based height, but ensure at least container height for grid lines
  const rowCount = Math.max(
    tasks.length,
    Math.floor(containerHeight / ROW_HEIGHT)
  );
  const contentHeight = Math.max(taskBasedHeight, containerHeight);

  // Ensure timeline fills at least the container width (prevent horizontal whitespace)
  // Use the larger of scale.totalWidth or container width
  const timelineWidth = Math.max(scale.totalWidth, containerWidth);

  return (
    <div
      ref={outerRef}
      className="chart-canvas-container w-full bg-white relative"
    >
      {/* Chart Content Container with Pan/Zoom */}
      <div ref={containerRef} className="w-full overflow-visible relative">
        <div ref={svgContainerRef} className="w-full" {...handlers}>
          <svg
            ref={svgRef}
            width={timelineWidth}
            height={contentHeight}
            className="gantt-chart block select-none"
          >
            {/* Layer 2: Background (Grid Lines) */}
            <g className="layer-background">
              <GridLines
                scale={scale}
                taskCount={rowCount}
                showWeekends={showWeekends}
                width={timelineWidth}
              />
            </g>

            {/* Layer 2.5: Dependency Arrows (behind tasks) */}
            <DependencyArrows
              tasks={tasks}
              scale={scale}
              rowHeight={ROW_HEIGHT}
              dragState={dragState}
            />

            {/* Layer 3: Task Bars */}
            <g className="layer-tasks">
              {tasks.map((task, index) => (
                <g
                  key={task.id}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  onMouseUp={() => handleTaskMouseUp(task.id)}
                >
                  <TaskBar
                    task={task}
                    scale={scale}
                    rowIndex={index}
                    isSelected={selectedTaskIds.includes(task.id)}
                    onClick={() => onTaskClick?.(task.id)}
                    onDoubleClick={() => onTaskDoubleClick?.(task.id)}
                  />
                </g>
              ))}
            </g>

            {/* Layer 3.6: Connection Handles (Sprint 1.4) */}
            <g className="layer-connection-handles">
              {Array.from(taskGeometries.entries()).map(([taskId, geo]) => (
                <ConnectionHandles
                  key={`handles-${taskId}`}
                  taskId={taskId}
                  x={geo.x}
                  y={geo.y}
                  width={geo.width}
                  height={geo.height}
                  isVisible={hoveredTaskId === taskId && !dragState.isDragging}
                  isValidDropTarget={
                    dragState.isDragging && isValidTarget(taskId)
                  }
                  isInvalidDropTarget={
                    dragState.isDragging && isInvalidTarget(taskId)
                  }
                  onDragStart={startDrag}
                  onHover={setHoveredTaskId}
                  onDrop={handleTaskMouseUp}
                />
              ))}
            </g>

            {/* Layer 4: Today Marker */}
            {showTodayMarker && (
              <TodayMarker scale={scale} svgHeight={contentHeight} />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
