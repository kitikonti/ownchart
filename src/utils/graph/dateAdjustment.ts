/**
 * Auto-Scheduling Date Adjustment Algorithm
 *
 * Calculates and propagates date constraints through the dependency graph.
 * Used when auto-scheduling is enabled to cascade predecessor date changes
 * to successor tasks based on dependency type (FS, SS, FF, SF) and lag.
 *
 * ## Working-days awareness (since #82)
 *
 * `calculateConstrainedDates`, `calculateInitialLag`, and `propagateDateChanges`
 * all accept an optional {@link WorkingDaysContext}. When `ctx?.enabled` is
 * true, *all* arithmetic — duration counting, lag offsets, successor placement
 * — runs in working days. When the context is omitted or disabled, the module
 * falls back to its original calendar-day behaviour, which is what off-mode
 * projects continue to use.
 *
 * Lag is interpreted in the unit dictated by the context: working days when
 * WD mode is on, calendar days otherwise. The store layer is responsible for
 * passing the correct context — see `taskSlice.updateTask`,
 * `dependencySlice.updateDependency`.
 *
 * The previous "post-process via `enforceDepConstraint` in dependencySlice"
 * pattern is being deleted in stage 3 of #82 in favour of this centralised
 * implementation.
 *
 * All functions remain pure — no store dependencies.
 */

import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type {
  Dependency,
  DependencyType,
  DateAdjustment,
} from "@/types/dependency.types";
import { addDays, calculateDuration } from "@/utils/dateUtils";
import { differenceInDays, parseISO } from "date-fns";
import { topologicalSort, getSuccessors } from "./topologicalSort";
import {
  calculateWorkingDays,
  addWorkingDays,
  subtractWorkingDays,
  snapForwardToWorkingDay,
  type WorkingDaysContext,
} from "@/utils/workingDaysCalculator";

export type { WorkingDaysContext };

/**
 * Sentinel "calendar mode" working-days context. Used by code paths that
 * need to call the now-required-ctx versions of calculateInitialLag /
 * calculateConstrainedDates without consulting the store (e.g. unit tests
 * or pure helpers in calendar-only contexts).
 *
 * Holding this as a frozen module constant — rather than constructing a
 * fresh object on each call — guarantees referential stability for any
 * future React.memo / useMemo dependency that compares it.
 */
export const DISABLED_WD_CONTEXT: WorkingDaysContext = Object.freeze({
  enabled: false,
  config: Object.freeze({
    excludeSaturday: false,
    excludeSunday: false,
    excludeHolidays: false,
  }),
  holidayRegion: undefined,
}) as WorkingDaysContext;

// ---------------------------------------------------------------------------
// Constraint calculation
// ---------------------------------------------------------------------------

interface PredecessorDates {
  startDate: string;
  endDate: string;
}

interface ConstrainedDates {
  startDate: string;
  endDate: string;
}

/**
 * Calculate the earliest allowed dates for a successor task based on a single
 * predecessor constraint.
 *
 * **Unit semantics**: when `ctx?.enabled` is true, `successorDuration` and
 * `lag` are interpreted as working days, and the returned start/end are always
 * working days (the result is snapped forward via `addWorkingDays`/
 * `subtractWorkingDays`, which only land on working days). Otherwise both
 * arguments are calendar days.
 *
 * ### Worked examples (WD mode, Sat+Sun excluded)
 *
 * Predecessor = Mon-Fri 2025-01-06 .. 2025-01-10, successorDuration = 3wd:
 *
 * - **FS, lag=0wd** → successor starts on the 1st working day on/after the day
 *   after pred.end (Sat 11). That snaps to Mon 13. End = Wed 15.
 * - **FS, lag=2wd** → successor starts on the 3rd working day on/after Sat 11
 *   (Mon 13 → Tue 14 → Wed 15). End = Fri 17.
 * - **SS, lag=0wd** → successor starts on pred.start (Mon 06). End = Wed 08.
 * - **SS, lag=1wd** → successor starts 1 working day after Mon 06 = Tue 07.
 * - **FF, lag=0wd** → successor.end = pred.end (Fri 10). Start = 3rd working
 *   day backward from Fri = Wed 08.
 * - **FF, lag=2wd** → successor.end = 2 working days after Fri = Tue 14.
 * - **SF, lag=0wd** → successor.end = pred.start (Mon 06). Start = backward 3
 *   working days from Mon = Thu 02 (assuming Thu/Fri the prior week are work).
 * - **SF, lag=2wd** → successor.end = 2 working days after Mon 06 = Wed 08.
 *
 * Negative lag (overlap) reverses the direction: `FS, lag=-1wd` places the
 * successor *one working day before* the day after pred.end — i.e. it starts
 * on pred.end (Fri 10).
 *
 * @param predecessor - Start/end dates of the predecessor task
 * @param successorDuration - Duration of the successor (inclusive). Working
 *   days when `ctx?.enabled`, calendar days otherwise.
 * @param type - Dependency type (FS, SS, FF, SF)
 * @param lag - Offset (positive = gap, negative = overlap). Same unit as
 *   `successorDuration`. Defaults to 0.
 * @param ctx - Working-days context. **Required** to prevent the
 *   double-conversion bug class (#82 F036): callers must always pass the
 *   active WD context so the unit of `lag` and `successorDuration` is
 *   unambiguous. Pass `{ enabled: false, ... }` for calendar-mode behaviour;
 *   use `getWorkingDaysContext()` from the selector module for the
 *   store-bound case.
 * @returns The earliest allowed `{ startDate, endDate }` for the successor
 */
export function calculateConstrainedDates(
  predecessor: PredecessorDates,
  successorDuration: number,
  type: DependencyType,
  lag: number,
  ctx: WorkingDaysContext
): ConstrainedDates {
  return ctx.enabled
    ? calculateConstrainedDatesWD(
        predecessor,
        successorDuration,
        type,
        lag,
        ctx
      )
    : calculateConstrainedDatesCal(predecessor, successorDuration, type, lag);
}

/**
 * Calendar-day variant of {@link calculateConstrainedDates}. Pure date
 * arithmetic — no working-days knowledge. Symmetric counterpart to
 * {@link calculateConstrainedDatesWD}.
 */
function calculateConstrainedDatesCal(
  predecessor: PredecessorDates,
  successorDuration: number,
  type: DependencyType,
  lag: number
): ConstrainedDates {
  switch (type) {
    case "FS": {
      // successor.start >= predecessor.end + 1 + lag
      // +1 because endDate is the last work day (inclusive)
      const start = addDays(predecessor.endDate, 1 + lag);
      const end = addDays(start, successorDuration - 1);
      return { startDate: start, endDate: end };
    }
    case "SS": {
      // successor.start >= predecessor.start + lag
      const start = addDays(predecessor.startDate, lag);
      const end = addDays(start, successorDuration - 1);
      return { startDate: start, endDate: end };
    }
    case "FF": {
      // successor.end >= predecessor.end + lag
      const end = addDays(predecessor.endDate, lag);
      const start = addDays(end, -(successorDuration - 1));
      return { startDate: start, endDate: end };
    }
    case "SF": {
      // successor.end >= predecessor.start + lag
      const end = addDays(predecessor.startDate, lag);
      const start = addDays(end, -(successorDuration - 1));
      return { startDate: start, endDate: end };
    }
  }
}

/**
 * Working-days variant of {@link calculateConstrainedDates}.
 *
 * Extracted into a private helper so the public function stays under the
 * complexity threshold and the calendar-day path remains a clean fallback for
 * projects with WD mode off.
 *
 * Both forward (FS/SS — start anchored, end derived) and backward (FF/SF —
 * end anchored, start derived) directions use the symmetric pair
 * {@link addWorkingDays} / {@link subtractWorkingDays}, which both treat the
 * anchor day as day 1 when it is itself a working day. This is what makes
 * `lag=0wd` after Friday land on Monday rather than Saturday.
 *
 * Negative lag is implemented as `subtract(addWorkingDays anchor, |lag| + 1)`
 * (forward types) or `add(subtractWorkingDays anchor, |lag| + 1)` (backward
 * types) — the symmetric inverse of the positive case.
 */
function calculateConstrainedDatesWD(
  predecessor: PredecessorDates,
  successorDurationWD: number,
  type: DependencyType,
  lagWD: number,
  ctx: WorkingDaysContext
): ConstrainedDates {
  const { config, holidayRegion } = ctx;
  // Successor duration is measured in working days; minimum 1 to avoid
  // zero/negative ranges from corrupted state.
  const dur = Math.max(1, successorDurationWD);

  // `kthWorkingDayFrom(rawAnchor, lag)` returns the working day that
  // corresponds to a given lag value, with these invariants:
  //
  //   lag = 0  → first working day on/after `rawAnchor` (snap-forward)
  //   lag = +N → N working days after the lag=0 anchor
  //   lag = −N → N working days before the lag=0 anchor
  //
  // The two-step shape (snap-forward, then walk N WDs in either direction)
  // makes the formula symmetric across all four dependency types regardless
  // of whether `rawAnchor` is itself a working day. Without the snap step,
  // the negative-lag branch would silently mis-anchor when `rawAnchor` falls
  // on a non-working day (e.g. FS dayAfterPred = Sat).
  const kthWorkingDayFrom = (rawAnchor: string, lag: number): string => {
    const lagZero = addWorkingDays(rawAnchor, 1, config, holidayRegion);
    if (lag === 0) return lagZero;
    if (lag > 0) {
      return addWorkingDays(lagZero, lag + 1, config, holidayRegion);
    }
    return subtractWorkingDays(lagZero, -lag + 1, config, holidayRegion);
  };

  switch (type) {
    case "FS": {
      // Anchor: day after predecessor.end. Successor starts on the (lag+1)th
      // working day from there. Lag=0 → first working day on/after dayAfter.
      const dayAfterPred = addDays(predecessor.endDate, 1);
      const start = kthWorkingDayFrom(dayAfterPred, lagWD);
      const end = addWorkingDays(start, dur, config, holidayRegion);
      return { startDate: start, endDate: end };
    }
    case "SS": {
      // Anchor: predecessor.start. Successor starts on the (lag+1)th working
      // day from there. Lag=0 → same start as predecessor (when working day).
      const start = kthWorkingDayFrom(predecessor.startDate, lagWD);
      const end = addWorkingDays(start, dur, config, holidayRegion);
      return { startDate: start, endDate: end };
    }
    case "FF": {
      // Anchor: predecessor.end. Successor ends on the (lag+1)th working day
      // from there. Lag=0 → same end as predecessor.
      const end = kthWorkingDayFrom(predecessor.endDate, lagWD);
      const start = subtractWorkingDays(end, dur, config, holidayRegion);
      return { startDate: start, endDate: end };
    }
    case "SF": {
      // Anchor: predecessor.start, but the constraint is on successor.end.
      // Successor ends on the (lag+1)th working day from pred.start.
      const end = kthWorkingDayFrom(predecessor.startDate, lagWD);
      const start = subtractWorkingDays(end, dur, config, holidayRegion);
      return { startDate: start, endDate: end };
    }
  }

}

/**
 * Calculate the initial lag that preserves the current task positions when
 * creating a dependency. This is the inverse of calculateConstrainedDates:
 * given the actual positions of predecessor and successor, it computes the lag
 * that would produce those exact positions under the given dependency type.
 *
 * **Unit semantics**: returns a working-day count when `ctx?.enabled`, else a
 * calendar-day count. Working-day rounding rule: when the successor anchor
 * lands on a non-working day, the inverse normalises it via snap-forward
 * (matching the snap-forward anchor rule in {@link calculateConstrainedDates}).
 * This makes the inverse a true inverse for working-day inputs but means
 * **round-trip is intentionally NOT stable for non-working-day inputs**:
 *
 *     calculateConstrainedDates(
 *       calculateInitialLag(pred, succ-on-saturday, ...),
 *       ...
 *     ) ≠ succ-on-saturday  // returns succ-on-monday instead
 *
 * In other words, calling the inverse on a corrupt or imported successor
 * whose start happens to be a weekend day will silently shift it to the
 * following Monday on the next forward pass. No call site triggers this
 * implicitly today (file load preserves stored lag values without
 * recomputing), but any future code that round-trips through these helpers
 * must be aware that the normalisation is by design — see
 * `tests/e2e/lag-delta-indicator.spec.ts` for the user-facing scenario
 * that forced the asymmetry.
 *
 * @param predecessor - Start/end dates of the predecessor task
 * @param successor - Start/end dates of the successor task
 * @param type - Dependency type (FS, SS, FF, SF)
 * @param ctx - Working-days context. **Required** to prevent the
 *   double-conversion bug class (#82 F036): callers must always pass the
 *   active WD context so the unit of the returned lag is unambiguous.
 *   Pass `{ enabled: false, ... }` for calendar-mode behaviour; use
 *   `getWorkingDaysContext()` from the selector module for the
 *   store-bound case.
 * @returns The lag in days (positive = gap, negative = overlap)
 */
export function calculateInitialLag(
  predecessor: PredecessorDates,
  successor: PredecessorDates,
  type: DependencyType,
  ctx: WorkingDaysContext
): number {
  return ctx.enabled
    ? calculateInitialLagWD(predecessor, successor, type, ctx)
    : calculateInitialLagCal(predecessor, successor, type);
}

/**
 * Calendar-day inverse — symmetric counterpart to {@link calculateInitialLagWD}.
 */
function calculateInitialLagCal(
  predecessor: PredecessorDates,
  successor: PredecessorDates,
  type: DependencyType
): number {
  switch (type) {
    case "FS":
      // Inverse of: successor.start = predecessor.end + 1 + lag
      return (
        differenceInDays(
          parseISO(successor.startDate),
          parseISO(predecessor.endDate)
        ) - 1
      );
    case "SS":
      // Inverse of: successor.start = predecessor.start + lag
      return differenceInDays(
        parseISO(successor.startDate),
        parseISO(predecessor.startDate)
      );
    case "FF":
      // Inverse of: successor.end = predecessor.end + lag
      return differenceInDays(
        parseISO(successor.endDate),
        parseISO(predecessor.endDate)
      );
    case "SF":
      // Inverse of: successor.end = predecessor.start + lag
      return differenceInDays(
        parseISO(successor.endDate),
        parseISO(predecessor.startDate)
      );
  }
}

/**
 * Working-days variant of {@link calculateInitialLag}. Counts working days
 * in the gap (or overlap) using {@link calculateWorkingDays}, which is
 * inclusive on both endpoints — the helpers below subtract 1 where needed
 * to match the unit convention used by `calculateConstrainedDates`
 * (lag=0 → successor anchor lands on predecessor anchor / dayAfter).
 */
function calculateInitialLagWD(
  predecessor: PredecessorDates,
  successor: PredecessorDates,
  type: DependencyType,
  ctx: WorkingDaysContext
): number {
  const { config, holidayRegion } = ctx;

  // Inverse of {@link calculateConstrainedDatesWD}'s `kthWorkingDayFrom`:
  // given the same `rawAnchor` and the actual successor anchor `target`,
  // recover the lag. We snap BOTH endpoints forward to their nearest
  // working day, then count working-day steps between them. Steps forward
  // yield positive lag, steps backward yield negative lag.
  //
  // **Why snap target forward** (#82 follow-up — wd-pill-non-working-target
  // bug): the forward direction (`kthWorkingDayFrom`) treats lag as the
  // (lag+1)-th working day from a snap-forward anchor. When the user drops
  // the successor onto a non-working day (e.g. Saturday), the semantic
  // position is the next working day after that drop — anything else makes
  // the inverse a non-inverse and breaks the live lag-delta indicator.
  // Without this snap, dragging a successor from Friday to Saturday produces
  // the same WD count as the previous Friday position, the delta is 0,
  // and the pill mistakenly stays hidden.
  const lagFromAnchor = (rawAnchor: string, target: string): number => {
    const lagZero = addWorkingDays(rawAnchor, 1, config, holidayRegion);
    const snappedTarget = snapForwardToWorkingDay(
      target,
      config,
      holidayRegion
    );
    if (snappedTarget === lagZero) return 0;
    if (snappedTarget > lagZero) {
      return (
        calculateWorkingDays(lagZero, snappedTarget, config, holidayRegion) -
        1
      );
    }
    return -(
      calculateWorkingDays(snappedTarget, lagZero, config, holidayRegion) - 1
    );
  };

  switch (type) {
    case "FS":
      return lagFromAnchor(
        addDays(predecessor.endDate, 1),
        successor.startDate
      );
    case "SS":
      return lagFromAnchor(predecessor.startDate, successor.startDate);
    case "FF":
      return lagFromAnchor(predecessor.endDate, successor.endDate);
    case "SF":
      return lagFromAnchor(predecessor.startDate, successor.endDate);
  }
}

// Removed in #82 stage 7: lagCalendarToWorking, lagWorkingToCalendar, and
// LagWorkingDaysContext. They predated #82 and assumed `Dependency.lag` was
// always stored in calendar days. After D1 (lag stored in the unit dictated
// by `workingDaysMode`), they would have been a double-conversion bug —
// see tests/e2e/wd-lag-panel-edit-bug.spec.ts for the regression.

// ---------------------------------------------------------------------------
// Date propagation
// ---------------------------------------------------------------------------

interface WorkingDates {
  startDate: string;
  endDate: string;
  /**
   * Inclusive duration used by calculateConstrainedDates() — measured in
   * **working days** when the propagation context has WD mode enabled,
   * **calendar days** otherwise. The unit always matches the lag unit, so
   * the constraint calculator stays unit-agnostic and consistent.
   */
  duration: number;
}

/**
 * Propagate date constraints through the dependency graph.
 *
 * Uses topological sort to process tasks in dependency order, then enforces
 * each predecessor constraint. When a task has multiple predecessors, the most
 * restrictive constraint (latest required start date) wins.
 *
 * **Working-days mode**: when `options?.workingDays?.enabled` is true, *all*
 * arithmetic in this pass — task duration counting, lag offsets, successor
 * placement — runs in working days via `addWorkingDays`/`subtractWorkingDays`.
 * The propagation walks the topological order once; the per-task working copy
 * stores the WD duration (computed once via `calculateWorkingDays`) so that
 * downstream constraints reuse it without recomputation.
 *
 * @param tasks - All tasks in the project
 * @param dependencies - All dependencies
 * @param changedTaskIds - Tasks whose dates just changed (optimization filter).
 *   When provided, only successor tasks reachable from these are processed.
 *   When omitted, all tasks are processed (full recalculation for toggle-ON).
 * @param options.bidirectional - When true, tasks can move *earlier* if the
 *   constraint allows; otherwise constraints can only push tasks later.
 * @param options.workingDays - Working-days context. Omit / disable for
 *   calendar-day mode.
 * @returns Array of DateAdjustment records for undo/redo support
 */
export function propagateDateChanges(
  tasks: Task[],
  dependencies: Dependency[],
  changedTaskIds?: TaskId[],
  options?: { bidirectional?: boolean; workingDays?: WorkingDaysContext }
): DateAdjustment[] {
  if (tasks.length === 0 || dependencies.length === 0) return [];

  // Normalise the working-days context: callers may pass an enabled ctx,
  // a disabled ctx, or omit it entirely. Internally we always work with a
  // concrete ctx so calculateConstrainedDates / calculateInitialLag (which
  // require ctx after #82 F042) get a single, unambiguous value.
  const wdCtx: WorkingDaysContext = options?.workingDays?.enabled
    ? options.workingDays
    : DISABLED_WD_CONTEXT;

  // Compute the duration of a task in the active unit (WD or calendar).
  // Encapsulated so the build-working-copy and apply-adjustment paths agree.
  const taskDuration = (start: string, end: string): number =>
    wdCtx.enabled
      ? Math.max(
          1,
          calculateWorkingDays(start, end, wdCtx.config, wdCtx.holidayRegion)
        )
      : calculateDuration(start, end);

  // 1. Build working copy of task dates
  const workingCopy = new Map<TaskId, WorkingDates>();
  for (const task of tasks) {
    workingCopy.set(task.id, {
      startDate: task.startDate,
      endDate: task.endDate,
      duration: taskDuration(task.startDate, task.endDate),
    });
  }

  // 2. Compute reachable set (optimization)
  let scope: Set<TaskId> | null = null;
  if (changedTaskIds && changedTaskIds.length > 0) {
    scope = new Set<TaskId>();
    for (const taskId of changedTaskIds) {
      const successors = getSuccessors(taskId, dependencies);
      for (const s of successors) {
        scope.add(s);
      }
    }
    if (scope.size === 0) return [];
  }

  // 3. Topological sort for processing order
  const sorted = topologicalSort(tasks, dependencies);

  // 4. Build reverse dependency map: toTaskId → Dependency[]
  const predecessorMap = new Map<TaskId, Dependency[]>();
  for (const dep of dependencies) {
    let list = predecessorMap.get(dep.toTaskId);
    if (!list) {
      list = [];
      predecessorMap.set(dep.toTaskId, list);
    }
    list.push(dep);
  }

  // 5. Walk topological order and enforce constraints
  const adjustments: DateAdjustment[] = [];

  for (const task of sorted) {
    // Skip tasks outside the reachable scope
    if (scope && !scope.has(task.id)) continue;

    // Skip summary tasks (dates derived from children)
    if (task.type === "summary") continue;

    const deps = predecessorMap.get(task.id);
    if (!deps || deps.length === 0) continue;

    const current = workingCopy.get(task.id);
    if (!current) continue;

    // Find the most restrictive constraint across all predecessors
    let latestRequiredStart: string | null = null;
    let latestRequiredEnd: string | null = null;

    for (const dep of deps) {
      const predDates = workingCopy.get(dep.fromTaskId);
      if (!predDates) continue;

      const constrained = calculateConstrainedDates(
        predDates,
        current.duration,
        dep.type,
        dep.lag ?? 0,
        wdCtx
      );

      // Compare by start date — take the latest (most restrictive)
      if (
        latestRequiredStart === null ||
        constrained.startDate > latestRequiredStart
      ) {
        latestRequiredStart = constrained.startDate;
        latestRequiredEnd = constrained.endDate;
      }
    }

    // Apply adjustment if the task needs to move.
    // Forward-only (default): only move if constraint requires a later start.
    // Bidirectional: move to the exact constraint position (earlier or later).
    const needsMove =
      latestRequiredStart !== null &&
      latestRequiredEnd !== null &&
      (options?.bidirectional
        ? latestRequiredStart !== current.startDate
        : latestRequiredStart > current.startDate);
    if (
      needsMove &&
      latestRequiredStart !== null &&
      latestRequiredEnd !== null
    ) {
      adjustments.push({
        taskId: task.id,
        oldStartDate: current.startDate,
        oldEndDate: current.endDate,
        newStartDate: latestRequiredStart,
        newEndDate: latestRequiredEnd,
      });

      // Update working copy so downstream tasks see the new dates
      workingCopy.set(task.id, {
        startDate: latestRequiredStart,
        endDate: latestRequiredEnd,
        duration: current.duration,
      });
    }
  }

  return adjustments;
}

// ---------------------------------------------------------------------------
// Batch apply helpers
// ---------------------------------------------------------------------------

/**
 * Apply or reverse date adjustments on a mutable tasks array (Immer draft).
 * Uses a Map index for O(1) lookup per adjustment.
 *
 * @param adjustments - DateAdjustment records to apply/reverse
 * @param tasks - Mutable tasks array (Immer draft)
 * @param direction - "apply" uses new dates, "reverse" restores old dates
 * @returns Set of parent task IDs that may need summary recalculation
 */
function batchUpdateDates(
  adjustments: DateAdjustment[],
  tasks: Task[],
  direction: "apply" | "reverse"
): Set<TaskId> {
  if (adjustments.length === 0) return new Set();

  // Build index for O(1) lookup
  const taskIndex = new Map<TaskId, number>();
  for (let i = 0; i < tasks.length; i++) {
    taskIndex.set(tasks[i].id, i);
  }

  const affectedParentIds = new Set<TaskId>();

  for (const adj of adjustments) {
    const idx = taskIndex.get(adj.taskId);
    if (idx === undefined) continue;

    const task = tasks[idx];
    const startDate =
      direction === "apply" ? adj.newStartDate : adj.oldStartDate;
    const endDate = direction === "apply" ? adj.newEndDate : adj.oldEndDate;

    task.startDate = startDate;
    task.endDate = endDate;
    task.duration = calculateDuration(startDate, endDate);

    if (task.parent) {
      affectedParentIds.add(task.parent);
    }
  }

  return affectedParentIds;
}

/** Apply date adjustments (use new dates). Returns affected parent IDs. */
export function applyDateAdjustments(
  adjustments: DateAdjustment[],
  tasks: Task[]
): Set<TaskId> {
  return batchUpdateDates(adjustments, tasks, "apply");
}

/** Reverse date adjustments (restore old dates). Returns affected parent IDs. */
export function reverseDateAdjustments(
  adjustments: DateAdjustment[],
  tasks: Task[]
): Set<TaskId> {
  return batchUpdateDates(adjustments, tasks, "reverse");
}
