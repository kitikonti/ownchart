/**
 * useDependencyDrag - Hook for dependency drag interaction
 * Manages the state and logic for creating dependencies via drag.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { Task } from "../types/chart.types";
import type { TaskId } from "../types/branded.types";
import type { DependencyDragState } from "../types/dependency.types";
import { useDependencyStore } from "../store/slices/dependencySlice";
import toast from "react-hot-toast";

interface UseDependencyDragOptions {
  tasks: Task[];
  svgRef?: React.RefObject<SVGSVGElement | null>;
  enabled?: boolean;
}

interface UseDependencyDragReturn {
  dragState: DependencyDragState;
  startDrag: (
    taskId: TaskId,
    side: "start" | "end",
    e: React.MouseEvent
  ) => void;
  updateDragPosition: (e: MouseEvent | React.MouseEvent) => void;
  endDrag: (targetTaskId?: TaskId) => void;
  cancelDrag: () => void;
  isValidTarget: (taskId: TaskId) => boolean;
  isInvalidTarget: (taskId: TaskId) => boolean;
  getHoveredTaskId: (
    x: number,
    y: number,
    taskPositions: Map<
      TaskId,
      { x: number; y: number; width: number; height: number }
    >
  ) => TaskId | null;
}

const initialDragState: DependencyDragState = {
  isDragging: false,
  fromTaskId: null,
  fromSide: null,
  currentPosition: { x: 0, y: 0 },
  validTargets: new Set<TaskId>(),
  invalidTargets: new Set<TaskId>(),
};

export function useDependencyDrag({
  tasks,
  svgRef,
  enabled = true,
}: UseDependencyDragOptions): UseDependencyDragReturn {
  const [dragState, setDragState] =
    useState<DependencyDragState>(initialDragState);
  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const { addDependency, checkWouldCreateCycle } = useDependencyStore();

  // Calculate valid and invalid targets when starting drag
  const startDrag = useCallback(
    (taskId: TaskId, side: "start" | "end", e: React.MouseEvent) => {
      if (!enabled) return;

      const validTargets = new Set<TaskId>();
      const invalidTargets = new Set<TaskId>();

      for (const task of tasks) {
        if (task.id === taskId) continue;

        // For FS: dragging from END creates "taskId -> target"
        // For SS: dragging from START creates "target -> taskId"
        const fromId = side === "end" ? taskId : task.id;
        const toId = side === "end" ? task.id : taskId;

        const cycleCheck = checkWouldCreateCycle(fromId, toId);
        if (cycleCheck.hasCycle) {
          invalidTargets.add(task.id);
        } else {
          validTargets.add(task.id);
        }
      }

      // Get initial position from event
      const svg = svgRef?.current;
      let x = e.clientX;
      let y = e.clientY;

      if (svg) {
        const rect = svg.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      setDragState({
        isDragging: true,
        fromTaskId: taskId,
        fromSide: side,
        currentPosition: { x, y },
        validTargets,
        invalidTargets,
      });
    },
    [enabled, tasks, checkWouldCreateCycle, svgRef]
  );

  // Update drag position
  const updateDragPosition = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const svg = svgRef?.current;
      if (!svg) {
        setDragState((prev) => ({
          ...prev,
          currentPosition: { x: e.clientX, y: e.clientY },
        }));
        return;
      }

      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDragState((prev) => ({
        ...prev,
        currentPosition: { x, y },
      }));
    },
    [svgRef]
  );

  // End drag and potentially create dependency
  const endDrag = useCallback(
    (targetTaskId?: TaskId) => {
      const { fromTaskId, fromSide, validTargets, invalidTargets } =
        dragStateRef.current;

      if (targetTaskId && fromTaskId) {
        if (validTargets.has(targetTaskId)) {
          // Create dependency
          const fromId = fromSide === "end" ? fromTaskId : targetTaskId;
          const toId = fromSide === "end" ? targetTaskId : fromTaskId;

          const result = addDependency(fromId, toId);

          if (result.success) {
            const fromTask = tasks.find((t) => t.id === fromId);
            const toTask = tasks.find((t) => t.id === toId);
            toast.success(
              `Dependency created: ${fromTask?.name || "?"} → ${toTask?.name || "?"}`
            );
          } else {
            toast.error(result.error);
          }
        } else if (invalidTargets.has(targetTaskId)) {
          toast.error("Cannot create: Would create circular dependency");
        }
      }

      setDragState(initialDragState);
    },
    [addDependency, tasks]
  );

  // Cancel drag without creating dependency
  const cancelDrag = useCallback(() => {
    setDragState(initialDragState);
  }, []);

  // Check if a task is a valid drop target
  const isValidTarget = useCallback(
    (taskId: TaskId) => {
      return dragState.validTargets.has(taskId);
    },
    [dragState.validTargets]
  );

  // Check if a task is an invalid drop target (would create cycle)
  const isInvalidTarget = useCallback(
    (taskId: TaskId) => {
      return dragState.invalidTargets.has(taskId);
    },
    [dragState.invalidTargets]
  );

  // Find which task is under the cursor (for drop detection)
  const getHoveredTaskId = useCallback(
    (
      x: number,
      y: number,
      taskPositions: Map<
        TaskId,
        { x: number; y: number; width: number; height: number }
      >
    ): TaskId | null => {
      for (const [taskId, pos] of taskPositions) {
        if (
          x >= pos.x &&
          x <= pos.x + pos.width &&
          y >= pos.y &&
          y <= pos.y + pos.height
        ) {
          return taskId;
        }
      }
      return null;
    },
    []
  );

  // Handle global mouse events during drag
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent): void => {
      updateDragPosition(e);
    };

    const handleMouseUp = (): void => {
      // Try to find target task under cursor
      // This is a simplified version - actual implementation
      // would need access to taskPositions
      endDrag();
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        cancelDrag();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dragState.isDragging, updateDragPosition, endDrag, cancelDrag]);

  return {
    dragState,
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,
    isValidTarget,
    isInvalidTarget,
    getHoveredTaskId,
  };
}
