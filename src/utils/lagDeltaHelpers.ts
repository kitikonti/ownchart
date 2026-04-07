/**
 * Pure helpers for the live lag-delta indicator (#82 stage 4).
 *
 * Extracted from `useTaskBarInteraction` so the per-frame mousemove logic
 * stays in one place but the snapshot-in / delta-out math is independently
 * unit-testable.
 */

import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type { Dependency } from "@/types/dependency.types";
import type { WorkingDaysContext } from "@/utils/workingDaysCalculator";
import { calculateInitialLag } from "@/utils/graph/dateAdjustment";

export interface LagDelta {
  depId: string;
  oldLag: number;
  newLag: number;
}

/**
 * Compute the would-be new lag for the dependency that the dragged task
 * participates in, given a *preview* (start, end) for that task. Returns
 * `null` when:
 *   - the task isn't part of any dependency,
 *   - the would-be lag matches the stored lag (no visible delta), or
 *   - the predecessor or successor task can't be resolved.
 *
 * Selection rule (matches the "winning constraint" wording in the #82 spec
 * with a deliberate v1 simplification):
 *   - Prefer the *first incoming* dependency (the dragged task is the
 *     successor) — this anchors the pill near the dragged task itself,
 *     which is the natural "this is what your drag is doing" surface.
 *   - Fall back to the first outgoing dependency for tasks with no
 *     predecessors.
 *   - Sibling deps deliberately stay static. A future enhancement could
 *     pick the dep with the largest |newLag − oldLag| delta (still O(n)),
 *     but the spec only requires *one* pill per gesture.
 *
 * Pure: takes a snapshot of the relevant store slices so it can run inside
 * a RAF tick without re-reading state.
 */
export function computeLagDeltaForPreview(
  draggedTaskId: TaskId,
  previewStart: string,
  previewEnd: string,
  tasks: readonly Task[],
  dependencies: readonly Dependency[],
  wdCtx: WorkingDaysContext
): LagDelta | null {
  const incoming = dependencies.find((d) => d.toTaskId === draggedTaskId);
  const dep =
    incoming ?? dependencies.find((d) => d.fromTaskId === draggedTaskId);
  if (!dep) return null;

  const predecessor = tasks.find((t) => t.id === dep.fromTaskId);
  const successor = tasks.find((t) => t.id === dep.toTaskId);
  if (!predecessor || !successor) return null;

  // Substitute the preview position into whichever side of the dependency
  // the dragged task occupies. The other side keeps its current store
  // position so we measure the post-drop lag, not a transient half-state.
  const predDates =
    dep.fromTaskId === draggedTaskId
      ? { startDate: previewStart, endDate: previewEnd }
      : { startDate: predecessor.startDate, endDate: predecessor.endDate };
  const succDates =
    dep.toTaskId === draggedTaskId
      ? { startDate: previewStart, endDate: previewEnd }
      : { startDate: successor.startDate, endDate: successor.endDate };

  const newLag = calculateInitialLag(predDates, succDates, dep.type, wdCtx);
  const oldLag = dep.lag ?? 0;
  if (newLag === oldLag) return null;
  return { depId: dep.id, oldLag, newLag };
}
