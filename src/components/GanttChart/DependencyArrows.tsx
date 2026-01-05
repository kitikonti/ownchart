/**
 * DependencyArrows - Container for all dependency arrows
 * Renders all dependency arrows for the Gantt chart.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import { useMemo, useCallback } from "react";
import type { Task } from "../../types/chart.types";
import type { TaskPosition } from "../../types/dependency.types";
import type { TimelineScale, DensityGeometryConfig } from "../../utils/timelineUtils";
import { getTaskBarGeometry, DEFAULT_DENSITY_GEOMETRY } from "../../utils/timelineUtils";
import { useDependencyStore } from "../../store/slices/dependencySlice";
import { DependencyArrow } from "./DependencyArrow";
import { DependencyDragPreview } from "./DependencyDragPreview";

interface DependencyArrowsProps {
  tasks: Task[];
  scale: TimelineScale;
  rowHeight?: number;
  dragState?: {
    isDragging: boolean;
    fromTaskId: string | null;
    currentPosition: { x: number; y: number };
  };
}

export function DependencyArrows({
  tasks,
  scale,
  rowHeight = DEFAULT_DENSITY_GEOMETRY.rowHeight,
  dragState,
}: DependencyArrowsProps) {
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
    return new Map(tasks.map((t) => [t.id, t]));
  }, [tasks]);

  // Calculate positions for all tasks
  const taskPositions = useMemo(() => {
    const positions = new Map<string, TaskPosition>();

    tasks.forEach((task, index) => {
      // Skip tasks without valid dates
      if (!task.startDate || (!task.endDate && task.type !== "milestone")) {
        return;
      }

      const geometry = getTaskBarGeometry(task, scale, index, densityGeometry, 0);

      positions.set(task.id, {
        x: geometry.x,
        y: geometry.y,
        width: geometry.width,
        height: geometry.height,
      });
    });

    return positions;
  }, [tasks, scale, densityGeometry]);

  // Handle dependency selection
  const handleSelect = useCallback(
    (id: string) => {
      selectDependency(id === selectedDependencyId ? null : id);
    },
    [selectDependency, selectedDependencyId]
  );

  // Handle dependency deletion
  const handleDelete = useCallback(
    (id: string) => {
      removeDependency(id);
    },
    [removeDependency]
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

  // Get start position for drag preview
  const dragStartPosition = useMemo(() => {
    if (!dragState?.isDragging || !dragState.fromTaskId) {
      return null;
    }
    const pos = taskPositions.get(dragState.fromTaskId);
    if (!pos) return null;

    // Start from right edge of task (for FS dependencies)
    return {
      x: pos.x + pos.width,
      y: pos.y + pos.height / 2,
    };
  }, [dragState, taskPositions]);

  return (
    <g className="layer-dependencies">
      {/* Render all visible dependency arrows */}
      {visibleDependencies.map((dep) => {
        const fromTask = taskMap.get(dep.fromTaskId)!;
        const toTask = taskMap.get(dep.toTaskId)!;

        return (
          <DependencyArrow
            key={dep.id}
            dependency={dep}
            fromTask={fromTask}
            toTask={toTask}
            taskPositions={taskPositions}
            rowHeight={rowHeight}
            isSelected={selectedDependencyId === dep.id}
            onSelect={handleSelect}
            onDelete={handleDelete}
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
        />
      )}
    </g>
  );
}
