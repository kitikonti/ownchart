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
 * Compute the would-be new lag for every dependency that the dragged task
 * participates in, given a *preview* (start, end) for that task. Returns
 * an empty array when no dependency lag would change.
 *
 * Pure: takes a snapshot of the relevant store slices so it can run inside
 * a RAF tick without re-reading state.
 */
export function computeLagDeltasForPreview(
  draggedTaskId: TaskId,
  previewStart: string,
  previewEnd: string,
  tasks: readonly Task[],
  dependencies: readonly Dependency[],
  wdCtx: WorkingDaysContext
): LagDelta[] {
  const affected = dependencies.filter(
    (d) => d.fromTaskId === draggedTaskId || d.toTaskId === draggedTaskId
  );
  if (affected.length === 0) return [];

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const deltas: LagDelta[] = [];

  for (const dep of affected) {
    const predecessor = taskMap.get(dep.fromTaskId);
    const successor = taskMap.get(dep.toTaskId);
    if (!predecessor || !successor) continue;

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
    if (newLag !== oldLag) {
      deltas.push({ depId: dep.id, oldLag, newLag });
    }
  }

  return deltas;
}
