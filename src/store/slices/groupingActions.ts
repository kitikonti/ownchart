/**
 * Grouping actions extracted from taskSlice.
 * Handles group/ungroup of tasks into summary parents.
 */

import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import type { Dependency } from "../../types/dependency.types";
import type { UngroupTasksParams } from "../../types/command.types";
import {
  getTaskLevel,
  getTaskDescendants,
  MAX_HIERARCHY_DEPTH,
  getTaskChildren,
  buildFlattenedTaskList,
  recalculateSummaryAncestors,
  normalizeTaskOrder,
  getMaxDescendantLevel,
} from "../../utils/hierarchy";
import toast from "react-hot-toast";
import { useDependencyStore } from "./dependencySlice";
import { useFileStore } from "./fileSlice";
import { CommandType } from "../../types/command.types";
import { COLORS } from "../../styles/design-tokens";
import {
  MS_PER_DAY,
  DEFAULT_GROUP_NAME,
  recordCommand,
  getRootSelectedIds,
} from "./taskSliceHelpers";
import type { TaskSliceSet, TaskSliceGet, TaskActions } from "./taskSlice";

type GroupingActions = Pick<
  TaskActions,
  | "groupSelectedTasks"
  | "ungroupSelectedTasks"
  | "canGroupSelection"
  | "canUngroupSelection"
>;

/**
 * Validates whether the current selection can be grouped.
 * Returns root IDs on success, or an error message string on failure.
 */
function validateGroupSelection(
  tasks: Task[],
  selectedIds: TaskId[]
): { rootIds: TaskId[] } | { error: string } {
  if (selectedIds.length === 0) return { error: "No tasks selected" };

  const rootIds = getRootSelectedIds(tasks, selectedIds) as TaskId[];
  if (rootIds.length === 0) return { error: "No root tasks in selection" };

  // All must share the same parent
  const parents = new Set(
    rootIds.map((id) => tasks.find((t) => t.id === id)?.parent)
  );
  if (parents.size !== 1) {
    return { error: "Cannot group: selected tasks must share the same parent" };
  }

  // Check nesting depth: grouping pushes tasks one level deeper
  for (const id of rootIds) {
    if (getMaxDescendantLevel(tasks, id) + 1 >= MAX_HIERARCHY_DEPTH) {
      return {
        error: "Cannot group: maximum nesting depth would be exceeded",
      };
    }
  }

  return { rootIds };
}

/**
 * Calculate the date span across tasks and their descendants.
 */
function calculateGroupDates(
  tasks: Task[],
  rootIds: TaskId[]
): { startDate: string; endDate: string; duration: number } {
  const allDates: { start: string; end: string }[] = [];

  for (const id of rootIds) {
    const task = tasks.find((t) => t.id === id);
    if (task?.startDate && task.endDate) {
      allDates.push({ start: task.startDate, end: task.endDate });
    }
    const descs = getTaskDescendants(tasks, id);
    for (const d of descs) {
      if (d.startDate && d.endDate) {
        allDates.push({ start: d.startDate, end: d.endDate });
      }
    }
  }

  if (allDates.length === 0) {
    return { startDate: "", endDate: "", duration: 0 };
  }

  const startDate = allDates.reduce(
    (min, d) => (d.start < min ? d.start : min),
    allDates[0].start
  );
  const endDate = allDates.reduce(
    (max, d) => (d.end > max ? d.end : max),
    allDates[0].end
  );
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const duration = Math.round((endMs - startMs) / MS_PER_DAY) + 1;

  return { startDate, endDate, duration };
}

/**
 * Build undo data for ungroup: captures each summary's state,
 * child parent/order changes, and dependencies to remove.
 */
function buildUngroupUndoData(
  tasks: Task[],
  sortedSummaries: Task[],
  dependencies: Dependency[]
): {
  ungroupedSummaries: UngroupTasksParams["ungroupedSummaries"];
  childIdsAll: TaskId[];
} {
  const ungroupedSummaries: UngroupTasksParams["ungroupedSummaries"] = [];
  const childIdsAll: TaskId[] = [];

  for (const summary of sortedSummaries) {
    const children = getTaskChildren(tasks, summary.id);
    const childChanges = children.map((child) => ({
      taskId: child.id,
      oldParent: child.parent,
      oldOrder: child.order,
    }));

    const deps = dependencies.filter(
      (d) => d.fromTaskId === summary.id || d.toTaskId === summary.id
    );

    ungroupedSummaries.push({
      summaryTask: structuredClone(summary),
      childChanges,
      removedDependencies: structuredClone(deps),
    });

    childIdsAll.push(...children.map((c) => c.id));
  }

  return { ungroupedSummaries, childIdsAll };
}

export function createGroupingActions(
  set: TaskSliceSet,
  get: TaskSliceGet
): GroupingActions {
  return {
    canGroupSelection: (): boolean => {
      const { tasks, selectedTaskIds } = get();
      const result = validateGroupSelection(tasks, selectedTaskIds);
      return "rootIds" in result;
    },

    groupSelectedTasks: (): void => {
      const { tasks, selectedTaskIds } = get();

      const validation = validateGroupSelection(tasks, selectedTaskIds);
      if ("error" in validation) {
        if (selectedTaskIds.length > 0) {
          toast.error(validation.error);
        }
        return;
      }

      const { rootIds } = validation;
      const commonParent = tasks.find((t) => t.id === rootIds[0])?.parent;

      // Find insertion position: topmost selected task in visual order
      const flatList = buildFlattenedTaskList(tasks, new Set<string>());
      const rootIdSet = new Set(rootIds);
      let insertVisualIndex = flatList.length;
      for (let i = 0; i < flatList.length; i++) {
        if (rootIdSet.has(flatList[i].task.id)) {
          insertVisualIndex = i;
          break;
        }
      }

      // Calculate summary dates from selected tasks and their descendants
      const dates = calculateGroupDates(tasks, rootIds);

      // Capture snapshots for undo
      const previousOrder = tasks.map((t) => ({ id: t.id, order: t.order }));
      const changes = rootIds.map((id) => {
        const task = tasks.find((t) => t.id === id);
        return {
          taskId: id,
          oldParent: task?.parent,
          oldOrder: task?.order ?? 0,
        };
      });

      // Create summary task
      const summaryId = crypto.randomUUID() as TaskId;
      const insertOrder =
        insertVisualIndex < flatList.length
          ? flatList[insertVisualIndex].task.order
          : tasks.length;

      const summaryTask: Task = {
        id: summaryId,
        name: DEFAULT_GROUP_NAME,
        startDate: dates.startDate,
        endDate: dates.endDate,
        duration: dates.duration,
        progress: 0,
        color: COLORS.chart.taskDefault,
        order: insertOrder,
        type: "summary",
        parent: commonParent,
        open: true,
        metadata: {},
      };

      const cascadeUpdates: Array<{
        id: TaskId;
        updates: Partial<Task>;
        previousValues: Partial<Task>;
      }> = [];

      set((state) => {
        state.tasks.push(summaryTask);

        for (const id of rootIds) {
          const task = state.tasks.find((t) => t.id === id);
          if (task) {
            task.parent = summaryId;
          }
        }

        normalizeTaskOrder(state.tasks);

        const affectedParents = new Set<TaskId>([summaryId]);
        if (commonParent) affectedParents.add(commonParent);
        const results = recalculateSummaryAncestors(
          state.tasks,
          affectedParents
        );
        cascadeUpdates.push(...results);

        state.activeCell = { taskId: summaryId, field: "name" };
        state.selectedTaskIds = [];
      });

      useFileStore.getState().markDirty();

      recordCommand(
        CommandType.GROUP_TASKS,
        rootIds.length === 1
          ? "Grouped 1 task"
          : `Grouped ${rootIds.length} tasks`,
        {
          summaryTaskId: summaryId,
          summaryTask,
          changes,
          previousOrder,
          cascadeUpdates,
        }
      );
    },

    canUngroupSelection: (): boolean => {
      const { tasks, selectedTaskIds } = get();
      return selectedTaskIds.some((id) => {
        const task = tasks.find((t) => t.id === id);
        return (
          task?.type === "summary" && tasks.some((t) => t.parent === task.id)
        );
      });
    },

    ungroupSelectedTasks: (): void => {
      const depStore = useDependencyStore.getState();
      const { tasks, selectedTaskIds } = get();

      // Filter to summaries with children
      const summariesToUngroup = selectedTaskIds
        .map((id) => tasks.find((t) => t.id === id))
        .filter(
          (t): t is Task =>
            t !== undefined &&
            t.type === "summary" &&
            tasks.some((child) => child.parent === t.id)
        );

      if (summariesToUngroup.length === 0) return;

      // Sort bottom-up: deepest summaries first to avoid parent invalidation
      const sortedSummaries = [...summariesToUngroup].sort((a, b) => {
        const levelA = getTaskLevel(tasks, a.id);
        const levelB = getTaskLevel(tasks, b.id);
        return levelB - levelA;
      });

      // Capture previous order for undo
      const previousOrder = tasks.map((t) => ({ id: t.id, order: t.order }));

      // Build undo data for each summary
      const { ungroupedSummaries, childIdsAll } = buildUngroupUndoData(
        tasks,
        sortedSummaries,
        depStore.dependencies
      );

      const summaryIds = new Set(sortedSummaries.map((s) => s.id));

      // Collect affected parent IDs for cascade recalculation
      const affectedParentIds = new Set<TaskId>();
      for (const summary of sortedSummaries) {
        if (summary.parent) affectedParentIds.add(summary.parent);
      }

      const cascadeUpdates: Array<{
        id: TaskId;
        updates: Partial<Task>;
        previousValues: Partial<Task>;
      }> = [];

      set((state) => {
        for (const summary of sortedSummaries) {
          const children = state.tasks.filter((t) => t.parent === summary.id);
          // Reparent children to summary's parent
          for (const child of children) {
            child.parent = summary.parent;
          }
        }

        // Remove all ungrouped summaries
        state.tasks = state.tasks.filter((t) => !summaryIds.has(t.id));

        normalizeTaskOrder(state.tasks);

        // Recalculate ancestor summaries
        cascadeUpdates.push(
          ...recalculateSummaryAncestors(state.tasks, affectedParentIds)
        );

        // Update selection: select the former children
        state.selectedTaskIds = childIdsAll;
        state.clipboardTaskIds = state.clipboardTaskIds.filter(
          (id) => !summaryIds.has(id)
        );
      });

      // Remove dependencies for deleted summaries
      for (const summary of sortedSummaries) {
        depStore.removeDependenciesForTask(summary.id);
      }

      useFileStore.getState().markDirty();

      recordCommand(
        CommandType.UNGROUP_TASKS,
        summariesToUngroup.length === 1
          ? "Ungrouped 1 task"
          : `Ungrouped ${summariesToUngroup.length} tasks`,
        { ungroupedSummaries, previousOrder, cascadeUpdates }
      );
    },
  };
}
