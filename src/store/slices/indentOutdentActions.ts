/**
 * Indent/Outdent actions extracted from taskSlice.
 * Handles task hierarchy level changes.
 */

import type { Task } from "../../types/chart.types";
import {
  wouldCreateCircularHierarchy,
  getTaskLevel,
  MAX_HIERARCHY_DEPTH,
  buildFlattenedTaskList,
  recalculateSummaryAncestors,
  normalizeTaskOrder,
  getMaxDescendantLevel,
} from "../../utils/hierarchy";
import type { FlattenedTask } from "../../utils/hierarchy";
import { canHaveChildren } from "../../utils/validation";
import { useFileStore } from "./fileSlice";
import { CommandType } from "../../types/command.types";
import {
  captureHierarchySnapshot,
  recordCommand,
  getEffectiveTaskIds,
} from "./taskSliceHelpers";
import type { TaskSliceSet, TaskSliceGet, TaskActions } from "./taskSlice";

type IndentOutdentActions = Pick<
  TaskActions,
  | "indentSelectedTasks"
  | "outdentSelectedTasks"
  | "canIndentSelection"
  | "canOutdentSelection"
>;

/**
 * Compute which tasks can be indented and their new parent assignments.
 * Pure function operating on the original (pre-mutation) hierarchy.
 */
function computeIndentChanges(
  tasks: Task[],
  taskIds: string[],
  flatList: FlattenedTask[]
): Array<{
  taskId: string;
  oldParent: string | undefined;
  newParent: string | undefined;
}> {
  // Sort selection by display order (top to bottom)
  const sortedIds = [...taskIds].sort((a, b) => {
    const indexA = flatList.findIndex((t) => t.task.id === a);
    const indexB = flatList.findIndex((t) => t.task.id === b);
    return indexA - indexB;
  });

  const changes: Array<{
    taskId: string;
    oldParent: string | undefined;
    newParent: string | undefined;
  }> = [];

  for (const taskId of sortedIds) {
    const index = flatList.findIndex((t) => t.task.id === taskId);
    if (index === -1) continue;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) continue;

    const level = flatList[index].level;
    const oldParent = task.parent;

    // Find previous sibling (same level) - skip if it's also selected
    let newParentId: string | null = null;
    for (let i = index - 1; i >= 0; i--) {
      const prevTask = flatList[i];
      if (prevTask.level === level) {
        // Skip if this potential parent is also selected (would create cascade)
        if (!taskIds.includes(prevTask.task.id)) {
          newParentId = prevTask.task.id;
          break;
        }
      }
      if (prevTask.level < level) break; // No suitable sibling found
    }

    if (!newParentId) continue;

    const newParent = tasks.find((t) => t.id === newParentId);
    if (!newParent) continue;

    // Calculate new parent's level based on ORIGINAL hierarchy
    const newParentLevel = getTaskLevel(tasks, newParentId);

    // Validation: check deepest descendant won't exceed MAX_HIERARCHY_DEPTH
    const maxDescLevel = getMaxDescendantLevel(tasks, taskId);
    if (
      canHaveChildren(newParent) &&
      maxDescLevel + 1 < MAX_HIERARCHY_DEPTH &&
      !wouldCreateCircularHierarchy(tasks, newParentId, taskId) &&
      newParentLevel === level // Ensure parent is on same level (task will be level + 1)
    ) {
      changes.push({ taskId, oldParent, newParent: newParentId });
    }
  }

  return changes;
}

export function createIndentOutdentActions(
  set: TaskSliceSet,
  get: TaskSliceGet
): IndentOutdentActions {
  return {
    indentSelectedTasks: (): void => {
      const state = get();
      const taskIds = getEffectiveTaskIds(state);
      if (taskIds.length === 0) return;
      const { tasks } = state;

      // Create snapshot of current hierarchy BEFORE any changes
      const originalFlatList = buildFlattenedTaskList(tasks, new Set<string>());

      const changes = computeIndentChanges(tasks, taskIds, originalFlatList);
      if (changes.length === 0) return;

      const previousTaskSnapshot = captureHierarchySnapshot(tasks);

      // Apply all changes at once
      set((state) => {
        for (const { taskId, newParent } of changes) {
          const task = state.tasks.find((t) => t.id === taskId);
          if (task && newParent) {
            task.parent = newParent;

            // Auto-expand parent if collapsed
            const parent = state.tasks.find((t) => t.id === newParent);
            if (parent && parent.open === false) {
              parent.open = true;
            }
          }
        }

        // Recalculate summary dates for all affected parents
        const affectedParentIds = new Set(
          changes
            .map((c) => c.newParent)
            .filter((id): id is string => id !== undefined)
        );
        recalculateSummaryAncestors(state.tasks, affectedParentIds);

        // Normalize order so children follow their parent
        normalizeTaskOrder(state.tasks);
      });

      const afterTaskSnapshot = captureHierarchySnapshot(get().tasks);

      // Mark file as dirty
      useFileStore.getState().markDirty();

      recordCommand(
        CommandType.INDENT_TASKS,
        changes.length === 1
          ? "Indented 1 task"
          : `Indented ${changes.length} tasks`,
        {
          taskIds: changes.map((c) => c.taskId),
          changes,
          previousTaskSnapshot,
          afterTaskSnapshot,
        }
      );
    },

    outdentSelectedTasks: (): void => {
      const state = get();
      const taskIds = getEffectiveTaskIds(state);
      if (taskIds.length === 0) return;
      const { tasks } = state;

      // Create snapshot of current hierarchy BEFORE any changes
      const originalHierarchy = new Map(
        tasks.map((t) => [
          t.id,
          { parent: t.parent, level: getTaskLevel(tasks, t.id) },
        ])
      );

      // Calculate all changes based on ORIGINAL hierarchy (capture oldParent)
      const changes: Array<{
        taskId: string;
        oldParent: string | undefined;
        newParent: string | undefined;
      }> = [];

      for (const taskId of taskIds) {
        const task = tasks.find((t) => t.id === taskId);
        if (!task?.parent) continue; // Already on root level

        const currentLevel = originalHierarchy.get(taskId)?.level ?? 0;
        const parent = tasks.find((t) => t.id === task.parent);
        if (!parent) continue;

        const oldParent = task.parent;
        const grandParent = parent.parent;

        // Calculate new level based on ORIGINAL hierarchy
        const newLevel = grandParent
          ? (originalHierarchy.get(grandParent)?.level ?? 0) + 1
          : 0;

        // Validation: Ensure task only moves exactly one level up
        if (newLevel === currentLevel - 1) {
          changes.push({ taskId, oldParent, newParent: grandParent });
        }
      }

      if (changes.length === 0) return;

      const previousTaskSnapshot = captureHierarchySnapshot(tasks);

      // Track old parents for summary date recalculation
      const oldParentIds = new Set<string>();
      for (const { oldParent } of changes) {
        if (oldParent) {
          oldParentIds.add(oldParent);
        }
      }

      // Apply all changes at once
      set((state) => {
        for (const { taskId, newParent } of changes) {
          const task = state.tasks.find((t) => t.id === taskId);
          if (task) {
            task.parent = newParent || undefined;
          }
        }

        // Recalculate summary dates for old parents
        recalculateSummaryAncestors(state.tasks, oldParentIds);

        // Normalize order so children follow their parent
        normalizeTaskOrder(state.tasks);
      });

      const afterTaskSnapshot = captureHierarchySnapshot(get().tasks);

      // Mark file as dirty
      useFileStore.getState().markDirty();

      recordCommand(
        CommandType.OUTDENT_TASKS,
        changes.length === 1
          ? "Outdented 1 task"
          : `Outdented ${changes.length} tasks`,
        {
          taskIds: changes.map((c) => c.taskId),
          changes,
          previousTaskSnapshot,
          afterTaskSnapshot,
        }
      );
    },

    canIndentSelection: (): boolean => {
      const state = get();
      const taskIds = getEffectiveTaskIds(state);
      if (taskIds.length === 0) return false;
      const { tasks } = state;

      const flatList = buildFlattenedTaskList(tasks, new Set<string>());

      return taskIds.some((taskId) => {
        const index = flatList.findIndex((t) => t.task.id === taskId);
        if (index === -1) return false;

        const level = flatList[index].level;

        // Check if there's a previous sibling
        for (let i = index - 1; i >= 0; i--) {
          if (flatList[i].level === level) {
            const potentialParent = flatList[i].task;
            if (!canHaveChildren(potentialParent)) return false;
            const maxDescLevel = getMaxDescendantLevel(tasks, taskId);
            return maxDescLevel + 1 < MAX_HIERARCHY_DEPTH;
          }
          if (flatList[i].level < level) break;
        }
        return false;
      });
    },

    canOutdentSelection: (): boolean => {
      const state = get();
      const taskIds = getEffectiveTaskIds(state);
      if (taskIds.length === 0) return false;
      const { tasks } = state;

      return taskIds.some((taskId) => {
        const task = tasks.find((t) => t.id === taskId);
        return task?.parent !== undefined && task?.parent !== null;
      });
    },
  };
}
