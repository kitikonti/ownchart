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

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!svgRef.current) return;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!svgRef.current) return;
        const svgPoint = getSVGPoint(e, svgRef.current);
        const relativeX = svgPoint.x - geometry.x;
        const newProgress = Math.round(
          Math.min(100, Math.max(0, (relativeX / geometry.width) * 100))
        );
        setPreviewProgress(newProgress);
      });
    },
    [geometry.x, geometry.width]
  );

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Read the latest preview from state via a synchronous getter
    // We use a ref to avoid stale closure issues
    setPreviewProgress((currentPreview) => {
      const finalProgress = currentPreview ?? initialProgressRef.current;
      if (finalProgress !== initialProgressRef.current) {
        updateTask(task.id, { progress: finalProgress });
      }
      return null;
    });

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    svgRef.current = null;
  }, [task.id, updateTask, handleMouseMove]);

  const onHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!showProgress) return;

      e.stopPropagation();
      e.preventDefault();

      const svg = (e.target as SVGElement).ownerSVGElement;
      if (!svg) return;

      svgRef.current = svg;
      initialProgressRef.current = task.progress;
      setPreviewProgress(task.progress);

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    },
    [showProgress, task.progress, handleMouseMove, handleMouseUp]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    previewProgress,
    onHandleMouseDown,
  };
}
