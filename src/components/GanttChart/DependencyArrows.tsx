/**
 * DependencyArrows - Container for all dependency arrows
 * Renders all dependency arrows for the Gantt chart.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import { useMemo, useCallback, useState } from "react";
import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type { TaskPosition } from "@/types/dependency.types";
import type {
  TimelineScale,
  DensityGeometryConfig,
} from "@/utils/timelineUtils";
import {
  getTaskBarGeometry,
  DEFAULT_DENSITY_GEOMETRY,
} from "@/utils/timelineUtils";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import { DependencyArrow } from "./DependencyArrow";
import { DependencyDragPreview } from "./DependencyDragPreview";
import { DependencyPropertiesPanel } from "./DependencyPropertiesPanel";

interface DependencyArrowsProps {
  tasks: Task[];
  scale: TimelineScale;
  rowHeight?: number;
  dragState?: {
    isDragging: boolean;
    fromTaskId: TaskId | null;
    currentPosition: { x: number; y: number };
  };
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
  const selectedDependencyId = useDependencyStore(
    (state) => state.selectedDependencyId
  );
  const selectDependency = useDependencyStore(
    (state) => state.selectDependency
  );
  const removeDependency = useDependencyStore(
    (state) => state.removeDependency
  );
  const updateDependency = useDependencyStore(
    (state) => state.updateDependency
  );

  // Panel position for the properties panel (screen-space coordinates from click)
  const [panelPosition, setPanelPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

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
      selectDependency(newId);
      setPanelPosition(newId && position ? position : null);
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

  // Resolve selected dependency and its tasks for the properties panel
  const selectedDep = selectedDependencyId
    ? (dependencies.find((d) => d.id === selectedDependencyId) ?? null)
    : null;
  const selectedFromTask = selectedDep
    ? taskMap.get(selectedDep.fromTaskId)
    : undefined;
  const selectedToTask = selectedDep
    ? taskMap.get(selectedDep.toTaskId)
    : undefined;

  return (
    <>
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
      </g>

      {/* Dependency Properties Panel (portal-rendered to document.body) */}
      {selectedDep && selectedFromTask && selectedToTask && panelPosition && (
        <DependencyPropertiesPanel
          dependency={selectedDep}
          fromTaskName={selectedFromTask.name}
          toTaskName={selectedToTask.name}
          position={panelPosition}
          onUpdateType={(type) => updateDependency(selectedDep.id, { type })}
          onUpdateLag={(lag) => updateDependency(selectedDep.id, { lag })}
          onDelete={() => removeDependency(selectedDep.id)}
          onClose={() => selectDependency(null)}
        />
      )}
    </>
  );
}
