/**
 * Hierarchy utilities for task organization.
 * Implements the SVAR pattern where type and hierarchy are independent.
 * See: concept/sprints/SPRINT_1.1.1_TASK_GROUPS.md
 */

import type { TaskId } from "../types/branded.types";
import type { Task } from "../types/chart.types";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Maximum hierarchy depth (number of levels: 0, 1, 2).
 * Used by clipboard paste validation and group-selection validation.
 */
export const MAX_HIERARCHY_DEPTH = 3;

/** Milliseconds in one calendar day. Used for date-span calculations. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ─── Exported Types ───────────────────────────────────────────────────────────

/** Represents a task positioned in the flattened render tree with layout metadata. */
export interface FlattenedTask {
  task: Task;
  level: number;
  hasChildren: boolean;
  /** 1-based position in the full (non-hidden-filtered) list. Used for Excel-style row number gaps. */
  globalRowNumber: number;
}

/** Summary date fields used for cascade recalculation. */
export interface SummaryDateUpdates {
  startDate: string;
  endDate: string;
  duration: number;
}

/** Result of a single summary recalculation, capturing previous values for undo. */
export interface SummaryCascadeEntry {
  id: TaskId;
  updates: SummaryDateUpdates;
  previousValues: SummaryDateUpdates;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Builds a map from each task ID to its nesting level (0 = root) in a single
 * O(n) pass using memoised top-down recursion. Much more efficient than calling
 * getTaskLevel (O(n × depth)) for every task in a loop.
 *
 * Includes a circular-reference guard: if a cycle is detected during recursion,
 * the task is treated as root level (0) to prevent infinite recursion.
 */
function buildLevelMap(tasks: Task[]): Map<TaskId, number> {
  const taskById = new Map<TaskId, Task>(tasks.map((t) => [t.id, t]));
  const levelCache = new Map<TaskId, number>();
  const computing = new Set<TaskId>(); // Guard against circular refs in data

  function computeLevel(taskId: TaskId): number {
    const cached = levelCache.get(taskId);
    if (cached !== undefined) return cached;

    // Already in the call stack — circular reference detected; treat as root.
    if (computing.has(taskId)) {
      levelCache.set(taskId, 0);
      return 0;
    }

    computing.add(taskId);
    const task = taskById.get(taskId);
    if (!task?.parent) {
      computing.delete(taskId);
      levelCache.set(taskId, 0);
      return 0;
    }

    const level = computeLevel(task.parent) + 1;
    computing.delete(taskId);
    levelCache.set(taskId, level);
    return level;
  }

  for (const task of tasks) {
    computeLevel(task.id);
  }
  return levelCache;
}

/**
 * Resolves the effective date range for a child during summary date computation.
 * For summary children, recursively computes their derived dates.
 * Returns null if the child has no usable or valid dates.
 */
function resolveChildDateRange(
  tasks: Task[],
  child: Task
): { start: Date; end: Date } | null {
  let startStr: string;
  let endStr: string;

  if (child.type === "summary") {
    const summaryDates = calculateSummaryDates(tasks, child.id);
    if (!summaryDates) return null;
    startStr = summaryDates.startDate;
    endStr = summaryDates.endDate;
  } else {
    if (!child.startDate || !child.endDate) return null;
    startStr = child.startDate;
    endStr = child.endDate;
  }

  const start = new Date(startStr);
  const end = new Date(endStr);

  // Guard against malformed date strings producing Invalid Date
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  return { start, end };
}

/** Return type of buildChildrenLookup. */
interface ChildrenLookup {
  /** Maps parentId (undefined = root) to sorted children. */
  childrenMap: Map<TaskId | undefined, Task[]>;
  /** Set of task IDs that have at least one child. */
  childrenSet: Set<TaskId>;
}

/**
 * Builds parent→children lookup structures for tree-walk operations.
 * Orphan tasks (parent ID not found in the task list) are placed at root level.
 * Siblings within each group are sorted by their `order` field.
 */
function buildChildrenLookup(tasks: Task[]): ChildrenLookup {
  const childrenMap = new Map<TaskId | undefined, Task[]>();
  const childrenSet = new Set<TaskId>();
  const taskIds = new Set(tasks.map((t) => t.id));

  for (const task of tasks) {
    // Orphan safety: if parent doesn't exist in task list, treat as root
    const parentKey =
      task.parent && taskIds.has(task.parent) ? task.parent : undefined;
    let siblings = childrenMap.get(parentKey);
    if (!siblings) {
      siblings = [];
      childrenMap.set(parentKey, siblings);
    }
    siblings.push(task);
    if (task.parent && taskIds.has(task.parent)) {
      childrenSet.add(task.parent);
    }
  }

  // Sort each sibling group by order
  for (const siblings of childrenMap.values()) {
    siblings.sort((a, b) => a.order - b.order);
  }

  return { childrenMap, childrenSet };
}

/**
 * Applies date updates to a summary task via direct property mutation (Immer-compatible).
 * Records and returns the cascade entry with previous values for undo tracking.
 */
function applySummaryUpdate(
  task: Task,
  updates: SummaryDateUpdates,
  previousValues: SummaryDateUpdates
): SummaryCascadeEntry {
  task.startDate = updates.startDate;
  task.endDate = updates.endDate;
  task.duration = updates.duration;
  return { id: task.id, updates, previousValues };
}

/**
 * Returns true if any selected-summary task is an ancestor of the given task,
 * meaning the task will be moved implicitly through its ancestor's expansion.
 */
function isDescendantOfSelectedSummary(
  task: Task,
  selectedSummaryIds: Set<TaskId>,
  taskById: Map<TaskId, Task>
): boolean {
  let currentParentId = task.parent;
  while (currentParentId) {
    if (selectedSummaryIds.has(currentParentId)) return true;
    currentParentId = taskById.get(currentParentId)?.parent;
  }
  return false;
}

// ─── Exported Functions ───────────────────────────────────────────────────────

/**
 * Get all children of a task (direct children only).
 */
export function getTaskChildren(
  tasks: Task[],
  parentId: TaskId | null
): Task[] {
  return tasks
    .filter((task) => {
      // Handle both null and undefined for root level tasks
      if (parentId === null) {
        return !task.parent; // matches both null and undefined
      }
      return task.parent === parentId;
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Get all descendants of a task (recursive).
 */
export function getTaskDescendants(tasks: Task[], parentId: TaskId): Task[] {
  const children = getTaskChildren(tasks, parentId);
  const descendants = [...children];

  for (const child of children) {
    descendants.push(...getTaskDescendants(tasks, child.id));
  }

  return descendants;
}

/**
 * Get path from root to task (array of parent IDs).
 */
export function getTaskPath(tasks: Task[], taskId: TaskId): TaskId[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || !task.parent) return [];

  return [...getTaskPath(tasks, task.parent), task.parent];
}

/**
 * Get nesting level of a task (0 = root).
 */
export function getTaskLevel(tasks: Task[], taskId: TaskId): number {
  return getTaskPath(tasks, taskId).length;
}

/**
 * Check if moving a task would create a circular hierarchy.
 */
export function wouldCreateCircularHierarchy(
  tasks: Task[],
  taskId: TaskId,
  newParentId: TaskId | null
): boolean {
  if (!newParentId) return false;
  if (taskId === newParentId) return true;

  // Check if newParent is a descendant of task
  const descendants = getTaskDescendants(tasks, taskId);
  return descendants.some((d) => d.id === newParentId);
}

/**
 * Get the deepest absolute level among a task's descendants (including the task itself).
 * Returns the task's own level if it has no descendants.
 *
 * Uses a single-pass O(n) level map instead of per-task O(n × depth) lookups.
 */
export function getMaxDescendantLevel(tasks: Task[], taskId: TaskId): number {
  const levelMap = buildLevelMap(tasks);
  const ownLevel = levelMap.get(taskId) ?? 0;
  const descendants = getTaskDescendants(tasks, taskId);

  if (descendants.length === 0) return ownLevel;

  let maxLevel = ownLevel;
  for (const desc of descendants) {
    const level = levelMap.get(desc.id) ?? 0;
    if (level > maxLevel) maxLevel = level;
  }

  return maxLevel;
}

/**
 * Get max nesting depth in hierarchy.
 *
 * Uses a single-pass O(n) level map instead of per-task O(n × depth) lookups.
 */
export function getMaxDepth(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const levelMap = buildLevelMap(tasks);
  let maxDepth = 0;
  for (const level of levelMap.values()) {
    if (level > maxDepth) maxDepth = level;
  }
  return maxDepth;
}

/**
 * Calculate summary task dates from children.
 *
 * IMPORTANT: Only applies to type='summary'!
 * Regular tasks (type='task') with children keep their manual dates.
 */
export function calculateSummaryDates(
  tasks: Task[],
  summaryTaskId: TaskId
): SummaryDateUpdates | null {
  const summaryTask = tasks.find((t) => t.id === summaryTaskId);

  // Only calculate for summary type!
  if (summaryTask?.type !== "summary") return null;

  const children = getTaskChildren(tasks, summaryTaskId);
  if (children.length === 0) return null;

  let minStart: Date | null = null;
  let maxEnd: Date | null = null;

  for (const child of children) {
    const range = resolveChildDateRange(tasks, child);
    if (!range) continue;
    if (!minStart || range.start < minStart) minStart = range.start;
    if (!maxEnd || range.end > maxEnd) maxEnd = range.end;
  }

  if (!minStart || !maxEnd) return null;

  const duration =
    Math.ceil((maxEnd.getTime() - minStart.getTime()) / MS_PER_DAY) + 1;

  return {
    startDate: minStart.toISOString().split("T")[0],
    endDate: maxEnd.toISOString().split("T")[0],
    duration,
  };
}

/**
 * Build flattened list for rendering (respects collapsed state).
 *
 * Uses recursive tree-walk to ensure children always appear directly
 * below their parent, sorted by `order` within each sibling group.
 */
export function buildFlattenedTaskList(
  tasks: Task[],
  collapsedTaskIds: Set<TaskId>
): FlattenedTask[] {
  const { childrenMap, childrenSet } = buildChildrenLookup(tasks);
  const result: FlattenedTask[] = [];

  function walk(parentId: TaskId | undefined, level: number): void {
    const children = childrenMap.get(parentId);
    if (!children) return;

    for (const task of children) {
      const hasChildren = childrenSet.has(task.id);
      // Assign globalRowNumber inline (1-based) to avoid a second pass
      result.push({
        task,
        level,
        hasChildren,
        globalRowNumber: result.length + 1,
      });

      // Recurse into children if not collapsed
      const isCollapsed = task.open === false || collapsedTaskIds.has(task.id);
      if (hasChildren && !isCollapsed) {
        walk(task.id, level + 1);
      }
    }
  }

  walk(undefined, 0);
  return result;
}

/**
 * Normalize task order values using tree-walk order.
 * Assigns sequential order values (0, 1, 2, ...) based on the hierarchical
 * tree-walk position. Mutates tasks in-place (Immer-compatible).
 *
 * Note: uses the existing sibling `order` values as input (for intra-group
 * sorting inside buildFlattenedTaskList) and produces globally sequential
 * order values as output.
 */
export function normalizeTaskOrder(tasks: Task[]): void {
  const flattened = buildFlattenedTaskList(tasks, new Set<TaskId>());
  let order = 0;
  // task references in FlattenedTask point to the original objects in the
  // input array, so direct mutation here is safe (and Immer-compatible).
  for (const { task } of flattened) {
    task.order = order++;
  }
}

/**
 * Recalculate summary dates for a set of parent IDs, cascading up the hierarchy.
 * Mutates the tasks array in place (designed for use inside Immer drafts).
 *
 * @param tasks - The tasks array (mutable, e.g. Immer draft)
 * @param parentIds - Set of parent IDs whose summary dates may need recalculation
 * @returns Array of cascade entries with previous values for undo tracking
 */
export function recalculateSummaryAncestors(
  tasks: Task[],
  parentIds: Set<TaskId>
): SummaryCascadeEntry[] {
  const cascadeUpdates: SummaryCascadeEntry[] = [];
  const processed = new Set<TaskId>();
  // O(1) task lookup; task references in this map are Immer draft proxies
  // when called from a store action, so direct mutation propagates correctly.
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const queue = Array.from(parentIds);

  while (queue.length > 0) {
    const parentId = queue.shift();
    if (parentId === undefined) continue;
    if (processed.has(parentId)) continue;
    processed.add(parentId);

    const parent = taskById.get(parentId);
    if (!parent || parent.type !== "summary") continue;

    const previousValues: SummaryDateUpdates = {
      startDate: parent.startDate,
      endDate: parent.endDate,
      duration: parent.duration,
    };

    const hasChildren = tasks.some((t) => t.parent === parentId);

    if (hasChildren) {
      const summaryDates = calculateSummaryDates(tasks, parentId);
      if (summaryDates) {
        cascadeUpdates.push(
          applySummaryUpdate(parent, summaryDates, previousValues)
        );
      }
    } else {
      // No more children — clear dates
      const clearedDates: SummaryDateUpdates = {
        startDate: "",
        endDate: "",
        duration: 0,
      };
      cascadeUpdates.push(
        applySummaryUpdate(parent, clearedDates, previousValues)
      );
    }

    // Continue cascading up
    if (parent.parent) {
      queue.push(parent.parent);
    }
  }

  return cascadeUpdates;
}

/**
 * Get the effective set of tasks to move for multi-drag operations.
 * Handles overlapping selections (e.g., summary + one of its children selected).
 *
 * Logic:
 * 1. If a summary task is selected, all its descendants are included
 * 2. If a child is already covered by a selected ancestor summary, skip it
 *    (it will be moved through the summary's expansion)
 * 3. Summary tasks are filtered out (they auto-recalculate from children)
 *
 * @returns Array of non-summary task IDs to move
 */
export function getEffectiveTasksToMove(
  tasks: Task[],
  selectedIds: TaskId[]
): TaskId[] {
  if (selectedIds.length === 0) return [];

  const taskById = new Map<TaskId, Task>(tasks.map((t) => [t.id, t]));
  const result = new Set<TaskId>();

  // Collect selected summary IDs upfront for O(1) ancestor-coverage checks
  const selectedSummaryIds = new Set<TaskId>();
  for (const id of selectedIds) {
    if (taskById.get(id)?.type === "summary") {
      selectedSummaryIds.add(id);
    }
  }

  for (const id of selectedIds) {
    const task = taskById.get(id);
    if (!task) continue;

    if (task.type === "summary") {
      // For summaries: add all their non-summary descendants
      for (const descendant of getTaskDescendants(tasks, id)) {
        if (descendant.type !== "summary") {
          result.add(descendant.id);
        }
      }
    } else if (
      !isDescendantOfSelectedSummary(task, selectedSummaryIds, taskById)
    ) {
      // Only add if not already covered by a selected summary ancestor
      result.add(id);
    }
  }

  return Array.from(result);
}

/**
 * Collect all descendant IDs of a given root task as a `Set<TaskId>`.
 *
 * Compared to {@link getTaskDescendants} (which returns `Task[]`), this function:
 * - Returns a `Set<TaskId>` for O(1) membership tests at call sites
 * - Accepts `ReadonlyArray<Task>` since no mutation is performed
 * - Accepts an optional accumulator `result` to incrementally collect IDs
 *   across multiple root tasks without intermediate allocations
 */
export function collectDescendantIds(
  tasks: ReadonlyArray<Task>,
  rootId: TaskId,
  result?: Set<TaskId>
): Set<TaskId> {
  const ids = result ?? new Set<TaskId>();
  for (const desc of getTaskDescendants(tasks as Task[], rootId)) {
    ids.add(desc.id);
  }
  return ids;
}
