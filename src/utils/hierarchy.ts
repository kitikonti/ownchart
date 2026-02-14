/**
 * Hierarchy utilities for task organization.
 * Implements the SVAR pattern where type and hierarchy are independent.
 * See: concept/sprints/SPRINT_1.1.1_TASK_GROUPS.md
 */

import type { Task } from "../types/chart.types";

/**
 * Maximum hierarchy depth (number of levels: 0, 1, 2).
 * Used by clipboard paste validation and group-selection validation.
 */
export const MAX_HIERARCHY_DEPTH = 3;

/**
 * Get all children of a task (direct children only).
 */
export function getTaskChildren(
  tasks: Task[],
  parentId: string | null
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
export function getTaskDescendants(tasks: Task[], parentId: string): Task[] {
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
export function getTaskPath(tasks: Task[], taskId: string): string[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || !task.parent) return [];

  return [...getTaskPath(tasks, task.parent), task.parent];
}

/**
 * Get nesting level of a task (0 = root).
 */
export function getTaskLevel(tasks: Task[], taskId: string): number {
  return getTaskPath(tasks, taskId).length;
}

/**
 * Check if moving a task would create a circular hierarchy.
 */
export function wouldCreateCircularHierarchy(
  tasks: Task[],
  taskId: string,
  newParentId: string | null
): boolean {
  if (!newParentId) return false;
  if (taskId === newParentId) return true;

  // Check if newParent is a descendant of task
  const descendants = getTaskDescendants(tasks, taskId);
  return descendants.some((d) => d.id === newParentId);
}

/**
 * Get max nesting depth in hierarchy.
 */
export function getMaxDepth(tasks: Task[]): number {
  let maxDepth = 0;

  for (const task of tasks) {
    const depth = getTaskLevel(tasks, task.id);
    if (depth > maxDepth) maxDepth = depth;
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
  summaryTaskId: string
): { startDate: string; endDate: string; duration: number } | null {
  const summaryTask = tasks.find((t) => t.id === summaryTaskId);

  // Only calculate for summary type!
  if (summaryTask?.type !== "summary") {
    return null;
  }

  const children = getTaskChildren(tasks, summaryTaskId);

  if (children.length === 0) {
    return null; // No children, no dates
  }

  // Find earliest start date and latest end date
  let minStart: Date | null = null;
  let maxEnd: Date | null = null;

  for (const child of children) {
    // For summary children, recursively calculate their dates
    let childStart: Date;
    let childEnd: Date;

    if (child.type === "summary") {
      const summaryDates = calculateSummaryDates(tasks, child.id);
      if (!summaryDates) continue; // Skip empty summaries
      childStart = new Date(summaryDates.startDate);
      childEnd = new Date(summaryDates.endDate);
    } else {
      if (!child.startDate || !child.endDate) continue;
      childStart = new Date(child.startDate);
      childEnd = new Date(child.endDate);
    }

    if (!minStart || childStart < minStart) minStart = childStart;
    if (!maxEnd || childEnd > maxEnd) maxEnd = childEnd;
  }

  if (!minStart || !maxEnd) return null;

  // Calculate duration in days (inclusive of start and end dates)
  const duration =
    Math.ceil((maxEnd.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24)) +
    1;

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
export interface FlattenedTask {
  task: Task;
  level: number;
  hasChildren: boolean;
}

export function buildFlattenedTaskList(
  tasks: Task[],
  collapsedTaskIds: Set<string>
): FlattenedTask[] {
  // Build children map: parentId → children sorted by order
  const childrenMap = new Map<string | undefined, Task[]>();
  const childrenSet = new Set<string>(); // Tasks that have children
  const taskIds = new Set(tasks.map((t) => t.id));

  for (const task of tasks) {
    // Orphan safety: if parent doesn't exist, treat as root
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

  // Recursive tree-walk
  const result: FlattenedTask[] = [];

  function walk(parentId: string | undefined, level: number): void {
    const children = childrenMap.get(parentId);
    if (!children) return;

    for (const task of children) {
      const hasChildren = childrenSet.has(task.id);
      result.push({ task, level, hasChildren });

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
  const flattened = buildFlattenedTaskList(tasks, new Set<string>());
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  let order = 0;
  for (const { task } of flattened) {
    const original = taskMap.get(task.id);
    if (original) {
      original.order = order++;
    }
  }
}

/**
 * Summary date fields used for cascade recalculation.
 */
export interface SummaryDateUpdates {
  startDate: string;
  endDate: string;
  duration: number;
}

/**
 * Result of a single summary recalculation, capturing previous values for undo.
 */
export interface SummaryCascadeEntry {
  id: string;
  updates: SummaryDateUpdates;
  previousValues: SummaryDateUpdates;
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
  parentIds: Set<string>
): SummaryCascadeEntry[] {
  const cascadeUpdates: SummaryCascadeEntry[] = [];
  const processed = new Set<string>();
  const queue = Array.from(parentIds);

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    if (processed.has(parentId)) continue;
    processed.add(parentId);

    const parentIndex = tasks.findIndex((t) => t.id === parentId);
    if (parentIndex === -1) continue;

    const parent = tasks[parentIndex];
    if (parent.type !== "summary") continue;

    const previousValues: SummaryDateUpdates = {
      startDate: parent.startDate,
      endDate: parent.endDate,
      duration: parent.duration,
    };

    const hasChildren = tasks.some((t) => t.parent === parentId);

    if (hasChildren) {
      const summaryDates = calculateSummaryDates(tasks, parentId);
      if (summaryDates) {
        const updates: SummaryDateUpdates = {
          startDate: summaryDates.startDate,
          endDate: summaryDates.endDate,
          duration: summaryDates.duration,
        };

        cascadeUpdates.push({ id: parentId, updates, previousValues });

        tasks[parentIndex] = {
          ...tasks[parentIndex],
          startDate: summaryDates.startDate,
          endDate: summaryDates.endDate,
          duration: summaryDates.duration,
        };
      }
    } else {
      // No more children - clear dates
      const updates: SummaryDateUpdates = {
        startDate: "",
        endDate: "",
        duration: 0,
      };

      cascadeUpdates.push({ id: parentId, updates, previousValues });

      tasks[parentIndex] = {
        ...tasks[parentIndex],
        startDate: "",
        endDate: "",
        duration: 0,
      };
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
  selectedIds: string[]
): string[] {
  // For simple case with no hierarchical selections, just return selected non-summary tasks
  if (selectedIds.length === 0) return [];

  const result = new Set<string>();

  // Check if any selected task is a summary that would expand to include descendants
  const selectedSummaryIds = new Set<string>();
  for (const id of selectedIds) {
    const task = tasks.find((t) => t.id === id);
    if (task?.type === "summary") {
      selectedSummaryIds.add(id);
    }
  }

  // For each selected ID, determine if it should be included
  for (const id of selectedIds) {
    const task = tasks.find((t) => t.id === id);
    if (!task) continue;

    if (task.type === "summary") {
      // For summaries: add all their non-summary descendants
      const descendants = getTaskDescendants(tasks, id);
      for (const descendant of descendants) {
        if (descendant.type !== "summary") {
          result.add(descendant.id);
        }
      }
    } else {
      // For non-summary tasks: check if already covered by a selected summary ancestor
      let coveredBySelectedSummary = false;
      let currentParentId = task.parent;

      while (currentParentId) {
        if (selectedSummaryIds.has(currentParentId)) {
          coveredBySelectedSummary = true;
          break;
        }
        const parent = tasks.find((t) => t.id === currentParentId);
        currentParentId = parent?.parent;
      }

      // Only add if not already covered by a selected summary ancestor
      if (!coveredBySelectedSummary) {
        result.add(id);
      }
    }
  }

  return Array.from(result);
}
