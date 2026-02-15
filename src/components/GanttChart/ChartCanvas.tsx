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
import { useTaskStore } from "../../store/slices/taskSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { useZoom } from "../../hooks/useZoom";
import { useDependencyDrag } from "../../hooks/useDependencyDrag";
import {
  useMarqueeSelection,
  type TaskGeometry,
} from "../../hooks/useMarqueeSelection";
import { GridLines } from "./GridLines";
import { TaskBar } from "./TaskBar";
import { TodayMarker } from "./TodayMarker";
import { DependencyArrows } from "./DependencyArrows";
import { ConnectionHandles } from "./ConnectionHandles";
import {
  getTaskBarGeometry,
  type DensityGeometryConfig,
} from "../../utils/timelineUtils";

interface ChartCanvasProps {
  tasks: Task[];
  selectedTaskIds: string[];
  onTaskClick?: (taskId: string) => void;
  onTaskDoubleClick?: (taskId: string) => void;
  containerHeight?: number; // Height from parent container
  containerWidth?: number; // Width from parent container (viewport, not content)
}

const SCROLLBAR_HEIGHT = 17; // Reserve space for horizontal scrollbar

export function ChartCanvas({
  tasks,
  selectedTaskIds,
  onTaskClick,
  onTaskDoubleClick,
  containerHeight = 600,
  containerWidth: propContainerWidth = 800,
}: ChartCanvasProps): JSX.Element {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // State for tracking which task's connection handles are visible
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // Get density configuration for dynamic row height
  const densityConfig = useDensityConfig();
  const ROW_HEIGHT = densityConfig.rowHeight;

  // Create density geometry config for getTaskBarGeometry
  const densityGeometry: DensityGeometryConfig = useMemo(
    () => ({
      rowHeight: densityConfig.rowHeight,
      taskBarHeight: densityConfig.taskBarHeight,
      taskBarOffset: densityConfig.taskBarOffset,
    }),
    [
      densityConfig.rowHeight,
      densityConfig.taskBarHeight,
      densityConfig.taskBarOffset,
    ]
  );

  // Use individual selectors for proper Zustand re-render (like ZoomIndicator)
  const scale = useChartStore((state) => state.scale);
  const zoom = useChartStore((state) => state.zoom);
  const showWeekends = useChartStore((state) => state.showWeekends);
  const showTodayMarker = useChartStore((state) => state.showTodayMarker);
  const showHolidays = useChartStore((state) => state.showHolidays);
  const showDependencies = useChartStore((state) => state.showDependencies);
  const taskLabelPosition = useChartStore((state) => state.taskLabelPosition);
  const setContainerWidth = useChartStore((state) => state.setContainerWidth);
  const updateScale = useChartStore((state) => state.updateScale);

  // Get holiday region from chart settings (Sprint 1.5.9 - now per-project)
  const holidayRegion = useChartStore((state) => state.holidayRegion);

  // Get setSelectedTaskIds from task store for marquee selection
  const setSelectedTaskIds = useTaskStore((state) => state.setSelectedTaskIds);

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

  // Calculate task geometries for connection handles and marquee selection
  const { taskGeometriesMap, taskGeometriesArray } = useMemo(() => {
    if (!scale)
      return {
        taskGeometriesMap: new Map<
          string,
          { x: number; y: number; width: number; height: number }
        >(),
        taskGeometriesArray: [] as TaskGeometry[],
      };

    const geometriesMap = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >();
    const geometriesArray: TaskGeometry[] = [];

    tasks.forEach((task, index) => {
      if (!task.startDate || (!task.endDate && task.type !== "milestone")) {
        return;
      }
      const geo = getTaskBarGeometry(task, scale, index, densityGeometry, 0);
      const geometry = {
        id: task.id,
        x: geo.x,
        y: geo.y,
        width: geo.width,
        height: geo.height,
      };
      geometriesArray.push(geometry);

      // Only add to map for connection handles (not for summary tasks)
      if (task.type !== "summary") {
        geometriesMap.set(task.id, {
          x: geo.x,
          y: geo.y,
          width: geo.width,
          height: geo.height,
        });
      }
    });

    return {
      taskGeometriesMap: geometriesMap,
      taskGeometriesArray: geometriesArray,
    };
  }, [tasks, scale, densityGeometry]);

  // Sprint 1.4: Handle mouse up on task for dependency drop
  const handleTaskMouseUp = useCallback(
    (taskId: string) => {
      if (dragState.isDragging) {
        endDrag(taskId);
      }
    },
    [dragState.isDragging, endDrag]
  );

  // Marquee selection handler
  const handleMarqueeSelection = useCallback(
    (taskIds: string[], addToSelection: boolean) => {
      setSelectedTaskIds(taskIds, addToSelection);
    },
    [setSelectedTaskIds]
  );

  // Marquee selection hook
  const { normalizedRect: marqueeRect, onMouseDown: onMarqueeMouseDown } =
    useMarqueeSelection({
      svgRef,
      taskGeometries: taskGeometriesArray,
      onSelectionChange: handleMarqueeSelection,
      enabled: !dragState.isDragging, // Disable during dependency drag
    });

  // Don't render if scale not ready
  if (!scale) {
    return (
      <div
        ref={outerRef}
        className="chart-canvas-container w-full min-h-screen"
      >
        <div ref={containerRef} className="w-full min-h-screen">
          <div className="flex items-center justify-center min-h-screen text-neutral-500">
            Loading timeline...
          </div>
        </div>
      </div>
    );
  }

  // Height calculation: Always render full task-based height
  // With SVAR-style layout, parent handles virtual scrolling via translateY
  // +1 for placeholder row (NewTaskPlaceholderRow in TaskTable)
  // +SCROLLBAR_HEIGHT to ensure last row isn't hidden behind horizontal scrollbar
  const taskBasedHeight = (tasks.length + 1) * ROW_HEIGHT + SCROLLBAR_HEIGHT;

  // Use task-based height, but ensure at least container height for grid lines
  // +1 for placeholder row to keep TaskTable and Timeline synchronized
  const rowCount = Math.max(
    tasks.length + 1,
    Math.floor(containerHeight / ROW_HEIGHT)
  );
  const contentHeight = Math.max(taskBasedHeight, containerHeight);

  // Ensure timeline is always wider than container to guarantee horizontal scrollbar
  // This enables infinite scroll to work in both directions
  // Must be > 2 * THRESHOLD (100px) + initial scroll offset (~175px) to allow scrolling both ways
  const MIN_OVERFLOW = 400;
  const timelineWidth = Math.max(
    scale.totalWidth,
    containerWidth + MIN_OVERFLOW
  );

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
            onMouseDown={onMarqueeMouseDown}
          >
            {/* Layer 2: Background (Grid Lines) */}
            <g className="layer-background">
              <GridLines
                scale={scale}
                taskCount={rowCount}
                showWeekends={showWeekends}
                showHolidays={showHolidays}
                holidayRegion={holidayRegion}
                width={timelineWidth}
                rowHeight={ROW_HEIGHT}
              />
            </g>

            {/* Layer 2.5: Selection Highlights (full row, brand color) */}
            <g className="layer-selection">
              {tasks.map((task, index) => {
                const isSelected = selectedTaskIds.includes(task.id);
                if (!isSelected) return null;

                // Check if prev/next rows are also selected for contiguous borders
                const prevSelected =
                  index > 0 && selectedTaskIds.includes(tasks[index - 1].id);
                const nextSelected =
                  index < tasks.length - 1 &&
                  selectedTaskIds.includes(tasks[index + 1].id);

                const BRAND_COLOR = "#0F6CBD";
                const y = index * ROW_HEIGHT;

                return (
                  <g key={`selection-${task.id}`}>
                    {/* Background fill */}
                    <rect
                      x={0}
                      y={y}
                      width={timelineWidth}
                      height={ROW_HEIGHT}
                      fill={BRAND_COLOR}
                      fillOpacity={0.08}
                    />
                    {/* Top border (only if first in selection group) */}
                    {!prevSelected && (
                      <line
                        x1={0}
                        y1={y}
                        x2={timelineWidth}
                        y2={y}
                        stroke={BRAND_COLOR}
                        strokeWidth={2}
                      />
                    )}
                    {/* Bottom border (only if last in selection group) */}
                    {!nextSelected && (
                      <line
                        x1={0}
                        y1={y + ROW_HEIGHT}
                        x2={timelineWidth}
                        y2={y + ROW_HEIGHT}
                        stroke={BRAND_COLOR}
                        strokeWidth={2}
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* Layer 2.6: Dependency Arrows (behind tasks) */}
            {showDependencies && (
              <DependencyArrows
                tasks={tasks}
                scale={scale}
                rowHeight={ROW_HEIGHT}
                dragState={dragState}
              />
            )}

            {/* Layer 3: Task Bars */}
            <g className="layer-tasks">
              {tasks.map((task, index) => {
                return (
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
                      onClick={() => onTaskClick?.(task.id)}
                      onDoubleClick={() => onTaskDoubleClick?.(task.id)}
                      labelPosition={taskLabelPosition}
                    />
                  </g>
                );
              })}
            </g>

            {/* Layer 3.6: Connection Handles (Sprint 1.4) */}
            {showDependencies && (
              <g className="layer-connection-handles">
                {Array.from(taskGeometriesMap.entries()).map(
                  ([taskId, geo]) => (
                    <ConnectionHandles
                      key={`handles-${taskId}`}
                      taskId={taskId}
                      x={geo.x}
                      y={geo.y}
                      width={geo.width}
                      height={geo.height}
                      isVisible={
                        hoveredTaskId === taskId && !dragState.isDragging
                      }
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
                  )
                )}
              </g>
            )}

            {/* Layer 4: Today Marker */}
            {showTodayMarker && (
              <TodayMarker scale={scale} svgHeight={contentHeight} />
            )}

            {/* Layer 5: Marquee Selection Rectangle */}
            {marqueeRect && (
              <rect
                x={marqueeRect.x}
                y={marqueeRect.y}
                width={marqueeRect.width}
                height={marqueeRect.height}
                fill="#334155"
                fillOpacity={0.1}
                stroke="#334155"
                strokeWidth={1}
                strokeDasharray="4 2"
                pointerEvents="none"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
