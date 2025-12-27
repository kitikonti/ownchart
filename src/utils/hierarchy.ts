/**
 * Hierarchy utilities for task organization.
 * Implements the SVAR pattern where type and hierarchy are independent.
 * See: concept/docs/SPRINT_1.15_TASK_GROUPS.md
 */

import type { Task } from '../types/chart.types';

/**
 * Get all children of a task (direct children only).
 */
export function getTaskChildren(tasks: Task[], parentId: string | null): Task[] {
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
  if (summaryTask?.type !== 'summary') {
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

    if (child.type === 'summary') {
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
  const duration = Math.ceil((maxEnd.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    startDate: minStart.toISOString().split('T')[0],
    endDate: maxEnd.toISOString().split('T')[0],
    duration,
  };
}

/**
 * Build flattened list for rendering (respects collapsed state).
 * Based on SVAR React Gantt pattern - simple and clean.
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
  const result: FlattenedTask[] = [];

  function addTaskAndChildren(
    parentId: string | null,
    level: number,
    parentCollapsed: boolean
  ): void {
    const children = getTaskChildren(tasks, parentId);

    children.forEach((task) => {
      const hasChildren = getTaskChildren(tasks, task.id).length > 0;

      // Add task if parent is not collapsed
      if (!parentCollapsed) {
        result.push({ task, level, hasChildren });
      }

      // Recursively add children
      const isCollapsed = task.open === false || collapsedTaskIds.has(task.id);
      addTaskAndChildren(task.id, level + 1, parentCollapsed || isCollapsed);
    });
  }

  // Start from root level
  addTaskAndChildren(null, 0, false);

  return result;
}
