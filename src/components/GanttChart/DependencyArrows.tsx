/**
 * DependencyArrows - Container for all dependency arrows in the Gantt chart.
 * Supports all 4 dependency types (FS/SS/FF/SF).
 */

import { useMemo, useCallback } from "react";
import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type {
  DependencyDragState,
  TaskPosition,
} from "@/types/dependency.types";
import type {
  TimelineScale,
  DensityGeometryConfig,
} from "@/utils/timelineUtils";
import {
  getTaskBarGeometry,
  DEFAULT_DENSITY_GEOMETRY,
} from "@/utils/timelineUtils";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { DependencyArrow } from "./DependencyArrow";
import { DependencyDragPreview } from "./DependencyDragPreview";
import { LagDeltaIndicator } from "./LagDeltaIndicator";

interface DependencyArrowsProps {
  tasks: Task[];
  scale: TimelineScale;
  rowHeight?: number;
  dragState?: DependencyDragState;
}

export function DependencyArrows({
  tasks,
  scale,
  rowHeight = DEFAULT_DENSITY_GEOMETRY.rowHeight,
  dragState,
}: DependencyArrowsProps): JSX.Element {
  // Create density config from rowHeight for backwards compatibility
  const densityGeometry: DensityGeometryConfig = useMemo(() => {
    // Calculate proportional values based on rowHeight
    const ratio = rowHeight / DEFAULT_DENSITY_GEOMETRY.rowHeight;
    return {
      rowHeight,
      taskBarHeight: Math.round(DEFAULT_DENSITY_GEOMETRY.taskBarHeight * ratio),
      taskBarOffset: Math.round(DEFAULT_DENSITY_GEOMETRY.taskBarOffset * ratio),
    };
  }, [rowHeight]);
  // Get dependencies and selection from store
  const dependencies = useDependencyStore((state) => state.dependencies);
  // Live lag-delta indicator (#82 stage 4) — set during a drag/resize gesture
  // in auto-update-lag mode (auto-scheduling OFF). Cleared on mouseup.
  const lagDelta = useChartStore((state) => state.lagDelta);
  const selectedDependencyId = useDependencyStore(
    (state) => state.selectedDependencyId
  );
  const selectDependency = useDependencyStore(
    (state) => state.selectDependency
  );
  const removeDependency = useDependencyStore(
    (state) => state.removeDependency
  );

  // Create task map for quick lookup
  const taskMap = useMemo(() => {
    return new Map<TaskId, Task>(tasks.map((t) => [t.id, t]));
  }, [tasks]);

  // Calculate positions for all tasks
  const taskPositions = useMemo(() => {
    const positions = new Map<TaskId, TaskPosition>();

    tasks.forEach((task, index) => {
      // Skip tasks without valid dates
      if (!task.startDate || (!task.endDate && task.type !== "milestone")) {
        return;
      }

      const geometry = getTaskBarGeometry({
        task,
        scale,
        rowIndex: index,
        densityConfig: densityGeometry,
        headerHeight: 0, // header in separate SVG
      });

      positions.set(task.id, {
        x: geometry.x,
        y: geometry.y,
        width: geometry.width,
        height: geometry.height,
      });
    });

    return positions;
  }, [tasks, scale, densityGeometry]);

  // Handle dependency selection (with optional click position for panel placement)
  const handleSelect = useCallback(
    (id: string, position?: { x: number; y: number }) => {
      const newId = id === selectedDependencyId ? null : id;
      selectDependency(newId, position);
    },
    [selectDependency, selectedDependencyId]
  );

  // Filter dependencies to only render those where both tasks are visible
  const visibleDependencies = useMemo(() => {
    return dependencies.filter((dep) => {
      const fromTask = taskMap.get(dep.fromTaskId);
      const toTask = taskMap.get(dep.toTaskId);
      return (
        fromTask &&
        toTask &&
        taskPositions.has(dep.fromTaskId) &&
        taskPositions.has(dep.toTaskId)
      );
    });
  }, [dependencies, taskMap, taskPositions]);

  // Get start position for drag preview (respects which handle initiated the drag)
  const dragStartPosition = useMemo(() => {
    if (!dragState?.isDragging || !dragState.fromTaskId) {
      return null;
    }
    const pos = taskPositions.get(dragState.fromTaskId);
    if (!pos) return null;

    const x = dragState.fromSide === "start" ? pos.x : pos.x + pos.width;
    return {
      x,
      y: pos.y + pos.height / 2,
    };
  }, [dragState, taskPositions]);

  return (
    <g className="layer-dependencies">
      {/* Render all visible dependency arrows */}
      {visibleDependencies.map((dep) => {
        const fromTask = taskMap.get(dep.fromTaskId);
        const toTask = taskMap.get(dep.toTaskId);
        if (!fromTask || !toTask) return null;

        return (
          <DependencyArrow
            key={dep.id}
            dependency={dep}
            fromTaskName={fromTask.name}
            toTaskName={toTask.name}
            taskPositions={taskPositions}
            rowHeight={rowHeight}
            isSelected={selectedDependencyId === dep.id}
            onSelect={handleSelect}
            onDelete={removeDependency}
          />
        );
      })}

      {/* Drag preview (temporary arrow while creating dependency) */}
      {dragState?.isDragging && dragStartPosition && (
        <DependencyDragPreview
          startX={dragStartPosition.x}
          startY={dragStartPosition.y}
          endX={dragState.currentPosition.x}
          endY={dragState.currentPosition.y}
          rowHeight={rowHeight}
        />
      )}

      {/* Live lag-delta pill — rendered last so it sits above the arrows. */}
      {lagDelta && (
        <LagDeltaIndicator
          delta={lagDelta}
          dependencies={dependencies}
          taskPositions={taskPositions}
          rowHeight={rowHeight}
        />
      )}
    </g>
  );
}
