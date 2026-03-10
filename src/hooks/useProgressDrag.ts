/**
 * Hook for dragging a progress handle on the task bar to visually adjust progress.
 * The handle appears at the bottom edge of the bar at the progress boundary.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Task } from "../types/chart.types";
import type { TaskBarGeometry } from "../utils/timelineUtils";
import { useTaskStore } from "../store/slices/taskSlice";
import { getSVGPoint } from "../utils/svgUtils";

export interface UseProgressDragReturn {
  isDragging: boolean;
  previewProgress: number | null; // 0-100 during drag, null otherwise
  onHandleMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Custom hook for progress-drag interaction on a task bar.
 * Internally no-ops when showProgress is false.
 */
export function useProgressDrag(
  task: Task,
  geometry: TaskBarGeometry,
  showProgress: boolean
): UseProgressDragReturn {
  const updateTask = useTaskStore((state) => state.updateTask);

  const [previewProgress, setPreviewProgress] = useState<number | null>(null);
  const isDragging = previewProgress !== null;

  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const initialProgressRef = useRef<number>(0);

  // Store the latest geometry values in a ref so handleMouseMove is always
  // stable and never needs to be recreated mid-drag when geometry changes.
  const geometryRef = useRef(geometry);
  geometryRef.current = geometry;

  // Store latest task values in a ref for the same reason.
  const taskRef = useRef(task);
  taskRef.current = task;

  // Store latest updateTask in a ref to keep handleMouseUp stable.
  const updateTaskRef = useRef(updateTask);
  updateTaskRef.current = updateTask;

  // Keep stable references to the listener functions so that the same function
  // is always added and removed from document events. Storing them in refs
  // prevents stale-listener bugs if hook parameters change mid-drag.
  const handleMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const handleMouseUpRef = useRef<(() => void) | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!svgRef.current) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!svgRef.current) return;
      const svgPoint = getSVGPoint(e, svgRef.current);
      const { x, width } = geometryRef.current;
      const relativeX = svgPoint.x - x;
      const newProgress = Math.round(
        Math.min(100, Math.max(0, (relativeX / width) * 100))
      );
      setPreviewProgress(newProgress);
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Read the latest preview from state via a synchronous getter
    // to avoid stale closure issues.
    setPreviewProgress((currentPreview) => {
      const finalProgress = currentPreview ?? initialProgressRef.current;
      if (finalProgress !== initialProgressRef.current) {
        updateTaskRef.current(taskRef.current.id, { progress: finalProgress });
      }
      return null;
    });

    if (handleMouseMoveRef.current) {
      document.removeEventListener("mousemove", handleMouseMoveRef.current);
    }
    if (handleMouseUpRef.current) {
      document.removeEventListener("mouseup", handleMouseUpRef.current);
    }
    document.body.style.cursor = "";
    svgRef.current = null;
  }, []);

  const onHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!showProgress) return;

      e.stopPropagation();
      e.preventDefault();

      const svg = (e.target as SVGElement).ownerSVGElement;
      if (!svg) return;

      svgRef.current = svg;
      initialProgressRef.current = taskRef.current.progress;
      setPreviewProgress(taskRef.current.progress);

      // Store the stable listener references before adding them
      handleMouseMoveRef.current = handleMouseMove;
      handleMouseUpRef.current = handleMouseUp;

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    },
    [showProgress, handleMouseMove, handleMouseUp]
  );

  // Cleanup on unmount — uses the refs to remove whichever listeners are active
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (handleMouseMoveRef.current) {
        document.removeEventListener("mousemove", handleMouseMoveRef.current);
      }
      if (handleMouseUpRef.current) {
        document.removeEventListener("mouseup", handleMouseUpRef.current);
      }
      document.body.style.cursor = "";
    };
  }, []);

  return {
    isDragging,
    previewProgress,
    onHandleMouseDown,
  };
}
