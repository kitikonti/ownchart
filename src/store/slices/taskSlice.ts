/**
 * Task slice for Zustand store.
 * Manages task state and provides CRUD operations.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { current } from "immer";
import type { Task } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";
import {
  wouldCreateCircularHierarchy,
  getTaskLevel,
  getTaskDescendants,
  MAX_HIERARCHY_DEPTH,
  getTaskChildren,
  buildFlattenedTaskList,
  calculateSummaryDates,
  recalculateSummaryAncestors,
  normalizeTaskOrder,
  getMaxDescendantLevel,
  collectDescendantIds,
} from "../../utils/hierarchy";
import toast from "react-hot-toast";
import { useDependencyStore } from "./dependencySlice";
import { useFileStore } from "./fileSlice";
import { CommandType, type UngroupTasksParams } from "../../types/command.types";
import { useChartStore } from "./chartSlice";
import { COLORS } from "../../styles/design-tokens";
import {
  DEFAULT_TASK_DURATION,
  MS_PER_DAY,
  DEFAULT_TASK_NAME,
  DEFAULT_GROUP_NAME,
  UNKNOWN_TASK_NAME,
  captureHierarchySnapshot,
  recordCommand,
  getRootSelectedIds,
} from "./taskSliceHelpers";
import { createSelectionActions } from "./selectionActions";
import { createExpansionActions } from "./expansionActions";
import { createColumnActions } from "./columnActions";
import { createIndentOutdentActions } from "./indentOutdentActions";

/**
 * Editable field types for cell-based editing.
 */
export type EditableField =
  | "name"
  | "startDate"
  | "endDate"
  | "duration"
  | "progress"
  | "color"
  | "type";

/**
 * Cell navigation direction.
 */
export type NavigationDirection = "up" | "down" | "left" | "right";

/**
 * Task state interface.
 */
export interface TaskState {
  tasks: Task[];

  // Multi-selection state
  selectedTaskIds: string[];
  lastSelectedTaskId: string | null;

  // Cell navigation state
  activeCell: {
    taskId: string | null;
    field: EditableField | null;
  };
  isEditingCell: boolean;
  columnWidths: Record<string, number>;

  // Split pane state
  taskTableWidth: number | null; // null = auto (total column width)

  // Clipboard state (for visual feedback - both copy and cut)
  clipboardTaskIds: string[];
  cutCell: { taskId: string; field: EditableField } | null;
}

/**
 * Task actions interface.
 */
export interface TaskActions {
  addTask: (taskData: Omit<Task, "id">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateMultipleTasks: (
    updates: Array<{ id: string; updates: Partial<Task> }>
  ) => void;
  deleteTask: (id: string, cascade?: boolean) => void;
  deleteSelectedTasks: () => void;
  reorderTasks: (activeTaskId: string, overTaskId: string) => void;
  setTasks: (tasks: Task[]) => void;

  // Multi-selection actions
  toggleTaskSelection: (id: string) => void;
  selectTaskRange: (startId: string, endId: string) => void;
  selectAllTasks: () => void;
  clearSelection: () => void;
  setSelectedTaskIds: (ids: string[], addToSelection?: boolean) => void;

  // Cell navigation actions
  setActiveCell: (taskId: string | null, field: EditableField | null) => void;
  navigateCell: (direction: NavigationDirection) => void;
  startCellEdit: () => void;
  stopCellEdit: () => void;
  setColumnWidth: (columnId: string, width: number) => void;
  autoFitColumn: (columnId: string) => void;
  autoFitAllColumns: () => void;

  // Split pane actions
  setTaskTableWidth: (width: number | null) => void;

  // Hierarchy actions
  toggleTaskCollapsed: (taskId: string) => void;
  expandTask: (taskId: string) => void;
  collapseTask: (taskId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  indentSelectedTasks: () => void;
  outdentSelectedTasks: () => void;
  canIndentSelection: () => boolean;
  canOutdentSelection: () => boolean;
  groupSelectedTasks: () => void;
  canGroupSelection: () => boolean;
  ungroupSelectedTasks: () => void;
  canUngroupSelection: () => boolean;

  // Insert task relative to another
  insertTaskAbove: (referenceTaskId: string) => void;
  insertTaskBelow: (referenceTaskId: string) => void;
  insertMultipleTasksAbove: (referenceTaskId: string, count: number) => void;
}

/**
 * Combined store interface.
 */
export type TaskStore = TaskState & TaskActions;

/** Zustand set function (Immer-style: mutate draft directly). */
export type TaskSliceSet = (fn: (state: TaskStore) => void) => void;
/** Zustand get function. */
export type TaskSliceGet = () => TaskStore;

/**
 * Validates whether the current selection can be grouped.
 * Returns root IDs on success, or an error message string on failure.
 */
function validateGroupSelection(
  tasks: Task[],
  selectedIds: string[]
): { rootIds: string[] } | { error: string } {
  if (selectedIds.length === 0) return { error: "No tasks selected" };

  const rootIds = getRootSelectedIds(tasks, selectedIds);
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
  rootIds: string[]
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
  childIdsAll: string[];
} {
  const ungroupedSummaries: UngroupTasksParams["ungroupedSummaries"] = [];
  const childIdsAll: string[] = [];

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

/**
 * Editable fields in order of tab navigation.
 */
const EDITABLE_FIELDS: EditableField[] = [
  "color",
  "name",
  "type",
  "startDate",
  "endDate",
  "duration",
  "progress",
];

export const useTaskStore = create<TaskStore>()(
  immer((set, get) => {
    /** Insert tasks above or below a reference task. */
    function insertTasksRelative(
      referenceTaskId: string,
      direction: "above" | "below",
      count = 1
    ): void {
      const state = get();
      const refIndex = state.tasks.findIndex((t) => t.id === referenceTaskId);
      if (refIndex === -1 || count < 1) return;

      const refTask = state.tasks[refIndex];
      const spliceIndex = direction === "above" ? refIndex : refIndex + 1;

      const tasksToInsert: Array<Omit<Task, "id">> = [];
      const generatedIds: string[] = [];

      for (let i = 0; i < count; i++) {
        let startDate = "";
        let endDate = "";

        if (direction === "above") {
          if (refTask.startDate) {
            const refStart = new Date(refTask.startDate);
            const end = new Date(refStart);
            end.setDate(
              refStart.getDate() - 1 - i * (DEFAULT_TASK_DURATION + 1)
            );
            endDate = end.toISOString().split("T")[0];
            const start = new Date(end);
            start.setDate(end.getDate() - DEFAULT_TASK_DURATION + 1);
            startDate = start.toISOString().split("T")[0];
          } else {
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - DEFAULT_TASK_DURATION + 1);
            startDate = weekAgo.toISOString().split("T")[0];
            endDate = today.toISOString().split("T")[0];
          }
        } else {
          if (refTask.endDate) {
            const refEnd = new Date(refTask.endDate);
            const start = new Date(refEnd);
            start.setDate(
              refEnd.getDate() + 1 + i * (DEFAULT_TASK_DURATION + 1)
            );
            startDate = start.toISOString().split("T")[0];
            const end = new Date(start);
            end.setDate(start.getDate() + DEFAULT_TASK_DURATION - 1);
            endDate = end.toISOString().split("T")[0];
          } else {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + DEFAULT_TASK_DURATION - 1);
            startDate = today.toISOString().split("T")[0];
            endDate = nextWeek.toISOString().split("T")[0];
          }
        }

        tasksToInsert.push({
          name: DEFAULT_TASK_NAME,
          startDate,
          endDate,
          duration: DEFAULT_TASK_DURATION,
          progress: 0,
          color: COLORS.chart.taskDefault,
          order: spliceIndex + i,
          type: "task",
          parent: refTask.parent,
          metadata: {},
        });
        generatedIds.push(crypto.randomUUID());
      }

      // For "above" with multiple tasks: reverse so earliest comes first
      if (direction === "above" && count > 1) {
        tasksToInsert.reverse();
        generatedIds.reverse();
      }

      set((state) => {
        const newTasks: Task[] = tasksToInsert.map((taskData, i) => ({
          ...taskData,
          id: generatedIds[i],
        }));

        state.tasks.splice(spliceIndex, 0, ...newTasks);
        // Set sequential order so normalizeTaskOrder can sort correctly
        state.tasks.forEach((task, index) => {
          task.order = index;
        });
        normalizeTaskOrder(state.tasks);

        if (refTask.parent) {
          recalculateSummaryAncestors(state.tasks, new Set([refTask.parent]));
        }
      });

      useFileStore.getState().markDirty();

      const description =
        count === 1
          ? `Inserted task ${direction}`
          : `Inserted ${count} tasks ${direction}`;

      if (count === 1) {
        recordCommand(CommandType.ADD_TASK, description, {
          task: tasksToInsert[0],
          generatedId: generatedIds[0],
        });
      } else {
        recordCommand(CommandType.ADD_TASK, description, {
          task: tasksToInsert[0],
          tasks: tasksToInsert,
          generatedIds,
        });
      }
    }

    return {
      // State (start with empty list - placeholder row allows adding new tasks)
      tasks: [],
      selectedTaskIds: [],
      lastSelectedTaskId: null,
      activeCell: {
        taskId: null,
        field: null,
      },
      isEditingCell: false,
      columnWidths: {},
      taskTableWidth: null,
      clipboardTaskIds: [],
      cutCell: null,

      // Actions
      addTask: (taskData): void => {
        let generatedId = "";

        set((state) => {
          const newTask: Task = {
            ...taskData,
            id: crypto.randomUUID(),
          };
          generatedId = newTask.id;
          state.tasks.push(newTask);
        });

        useFileStore.getState().markDirty();

        recordCommand(CommandType.ADD_TASK, `Created task "${taskData.name}"`, {
          task: taskData,
          generatedId,
        });
      },

      updateTask: (id, updates): void => {
        const previousValues: Partial<Task> = {};
        let taskName = "";
        const parentUpdates: Array<{
          id: string;
          updates: Partial<Task>;
          previousValues: Partial<Task>;
        }> = [];

        set((state) => {
          // Create mutable copy to avoid read-only errors during redo
          updates = { ...updates };

          const taskIndex = state.tasks.findIndex((task) => task.id === id);
          if (taskIndex !== -1) {
            const currentTask = state.tasks[taskIndex];
            taskName = currentTask.name;

            // Validate type change to milestone
            if (updates.type === "milestone") {
              const hasChildren = state.tasks.some((t) => t.parent === id);
              if (hasChildren) {
                return;
              }
              // Milestone is a point in time: endDate = startDate
              const currentStart =
                (updates.startDate as string) || currentTask.startDate;
              updates.endDate =
                currentStart || new Date().toISOString().split("T")[0];
              if (!currentStart) {
                updates.startDate = updates.endDate;
              }
              updates.duration = 0;
              updates.progress = 0;
            }

            // Handle type change from milestone to task
            if (updates.type === "task" && currentTask.type === "milestone") {
              const milestoneDate = currentTask.startDate;
              if (milestoneDate) {
                updates.startDate = milestoneDate;
                const end = new Date(milestoneDate);
                end.setDate(end.getDate() + (DEFAULT_TASK_DURATION - 1));
                updates.endDate = end.toISOString().split("T")[0];
                updates.duration = DEFAULT_TASK_DURATION;
              }
            }

            // Handle type change to summary
            if (updates.type === "summary") {
              // Spread-replace (not direct mutation) so `currentTask` ref retains
              // original values for previousValues capture below
              state.tasks[taskIndex] = {
                ...currentTask,
                type: "summary",
              };

              const hasChildren = state.tasks.some((t) => t.parent === id);

              if (hasChildren) {
                // Has children - recalculate dates from children
                const summaryDates = calculateSummaryDates(state.tasks, id);
                if (summaryDates) {
                  updates.startDate = summaryDates.startDate;
                  updates.endDate = summaryDates.endDate;
                  updates.duration = summaryDates.duration;
                }
              } else {
                // No children - keep existing dates so they survive type cycling
                // (dates will be recalculated when children are added)
              }
              updates.open = true; // Summaries should be open by default
            }

            // Capture previous values for undo
            Object.keys(updates).forEach((key) => {
              const typedKey = key as keyof Task;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              previousValues[typedKey] = currentTask[typedKey] as any;
            });

            // Apply update — uses Object.assign to mutate the existing draft/object
            Object.assign(state.tasks[taskIndex], updates);

            // Check if parent needs recalculation (summary cascade)
            if (currentTask.parent && (updates.startDate || updates.endDate)) {
              const cascadeResults = recalculateSummaryAncestors(
                state.tasks,
                new Set([currentTask.parent])
              );
              parentUpdates.push(...cascadeResults);
            }
          }
        });

        // Mark file as dirty
        if (Object.keys(previousValues).length > 0) {
          useFileStore.getState().markDirty();
        }

        // Record command for undo/redo
        if (Object.keys(previousValues).length > 0) {
          recordCommand(
            CommandType.UPDATE_TASK,
            `Updated task "${taskName}"${parentUpdates.length > 0 ? " (and parent)" : ""}`,
            {
              id,
              updates,
              previousValues,
              cascadeUpdates: parentUpdates,
            }
          );
        }
      },

      updateMultipleTasks: (updates): void => {
        const taskChanges: Array<{
          id: string;
          previousStartDate: string;
          previousEndDate: string;
          newStartDate: string;
          newEndDate: string;
        }> = [];
        const cascadeUpdates: Array<{
          id: string;
          updates: Partial<Task>;
          previousValues: Partial<Task>;
        }> = [];

        set((state) => {
          const affectedParentIds = new Set<string>();

          // Apply all task updates
          for (const { id, updates: taskUpdates } of updates) {
            const taskIndex = state.tasks.findIndex((t) => t.id === id);
            if (taskIndex === -1) continue;

            const task = state.tasks[taskIndex];

            // Capture previous values
            taskChanges.push({
              id,
              previousStartDate: task.startDate,
              previousEndDate: task.endDate,
              newStartDate: taskUpdates.startDate || task.startDate,
              newEndDate: taskUpdates.endDate || task.endDate,
            });

            // Apply update — mutate the Immer draft directly
            Object.assign(state.tasks[taskIndex], taskUpdates);

            // Track affected parents for cascade
            if (task.parent) {
              affectedParentIds.add(task.parent);
            }
          }

          // Cascade up through all ancestor summaries
          const cascadeResults = recalculateSummaryAncestors(
            state.tasks,
            affectedParentIds
          );
          cascadeUpdates.push(...cascadeResults);
        });

        // Mark file as dirty
        if (taskChanges.length > 0) {
          useFileStore.getState().markDirty();
        }

        // Record command for undo/redo
        if (taskChanges.length > 0) {
          recordCommand(
            CommandType.MULTI_DRAG_TASKS,
            `Moved ${taskChanges.length} task(s)`,
            { taskChanges, cascadeUpdates }
          );
        }
      },

      deleteTask: (id, cascade = false): void => {
        const deletedTasks: Task[] = [];
        let cascadeUpdates: Array<{
          id: string;
          updates: Partial<Task>;
          previousValues: Partial<Task>;
        }> = [];

        set((state) => {
          if (!cascade) {
            // Simple delete - capture the task before removing
            const taskToDelete = state.tasks.find((task) => task.id === id);
            if (taskToDelete) {
              deletedTasks.push(current(taskToDelete));
            }

            const parentId = taskToDelete?.parent;

            // Simple delete - just remove the task
            state.tasks = state.tasks.filter((task) => task.id !== id);
            // Clear selection for deleted task
            state.selectedTaskIds = state.selectedTaskIds.filter(
              (selectedId) => selectedId !== id
            );
            // Clear active cell if it referenced the deleted task
            if (state.activeCell.taskId === id) {
              state.activeCell = { taskId: null, field: null };
            }

            // Recalculate parent summary dates if it was a child
            if (parentId) {
              cascadeUpdates = recalculateSummaryAncestors(
                state.tasks,
                new Set([parentId])
              );
            }

            return;
          }

          // Cascading delete - collect all descendants recursively
          const idsToDelete = collectDescendantIds(state.tasks, id);
          idsToDelete.add(id);

          // Capture all tasks before deleting
          state.tasks.forEach((task) => {
            if (idsToDelete.has(task.id)) {
              deletedTasks.push(current(task));
            }
          });

          // Find the parent of the root deleted task (for cascade recalculation)
          const rootDeletedTask = state.tasks.find((task) => task.id === id);
          const rootParentId = rootDeletedTask?.parent;

          // Remove all collected tasks
          state.tasks = state.tasks.filter((task) => !idsToDelete.has(task.id));

          // Clear selection for deleted tasks
          state.selectedTaskIds = state.selectedTaskIds.filter(
            (selectedId) => !idsToDelete.has(selectedId)
          );
          // Clear active cell if it referenced a deleted task
          if (
            state.activeCell.taskId &&
            idsToDelete.has(state.activeCell.taskId)
          ) {
            state.activeCell = { taskId: null, field: null };
          }

          // Recalculate parent summary dates if the root task had a parent
          if (rootParentId && !idsToDelete.has(rootParentId)) {
            cascadeUpdates = recalculateSummaryAncestors(
              state.tasks,
              new Set([rootParentId])
            );
          }
        });

        // Mark file as dirty
        if (deletedTasks.length > 0) {
          useFileStore.getState().markDirty();
        }

        // Record command for undo/redo
        if (deletedTasks.length > 0) {
          const taskName = deletedTasks[0]?.name || UNKNOWN_TASK_NAME;
          const description =
            deletedTasks.length === 1
              ? `Deleted task "${taskName}"`
              : `Deleted ${deletedTasks.length} tasks`;

          recordCommand(CommandType.DELETE_TASK, description, {
            id,
            deletedIds: deletedTasks.map((t) => t.id),
            cascade,
            deletedTasks,
            cascadeUpdates,
          });
        }
      },

      deleteSelectedTasks: (): void => {
        const state = get();
        const selectedIds = state.selectedTaskIds;

        if (selectedIds.length === 0) return;

        // Collect all tasks to delete (including children of selected tasks)
        const idsToDelete = new Set<string>();
        const deletedTasks: Task[] = [];

        // Add selected tasks and their children
        selectedIds.forEach((id) => {
          idsToDelete.add(id);
          collectDescendantIds(state.tasks, id, idsToDelete);
        });

        // Capture all tasks before deleting
        state.tasks.forEach((task) => {
          if (idsToDelete.has(task.id)) {
            deletedTasks.push(structuredClone(task));
          }
        });

        // Collect parent IDs of deleted tasks that are NOT themselves deleted
        const affectedParentIds = new Set<string>();
        deletedTasks.forEach((task) => {
          if (task.parent && !idsToDelete.has(task.parent)) {
            affectedParentIds.add(task.parent);
          }
        });

        // Remove all collected tasks and recalculate summaries
        let cascadeUpdates: Array<{
          id: string;
          updates: { startDate: string; endDate: string; duration: number };
          previousValues: {
            startDate: string;
            endDate: string;
            duration: number;
          };
        }> = [];

        set((s) => {
          s.tasks = s.tasks.filter((task) => !idsToDelete.has(task.id));
          s.selectedTaskIds = [];
          s.clipboardTaskIds = s.clipboardTaskIds.filter(
            (id) => !idsToDelete.has(id)
          );
          // Clear active cell if it referenced a deleted task
          if (s.activeCell.taskId && idsToDelete.has(s.activeCell.taskId)) {
            s.activeCell = { taskId: null, field: null };
          }

          // Recalculate summary ancestors for affected parents
          cascadeUpdates = recalculateSummaryAncestors(
            s.tasks,
            affectedParentIds
          );
        });

        // Mark file as dirty
        if (deletedTasks.length > 0) {
          useFileStore.getState().markDirty();
        }

        // Record command for undo/redo
        if (deletedTasks.length > 0) {
          const description =
            deletedTasks.length === 1
              ? `Deleted task "${deletedTasks[0].name}"`
              : `Deleted ${deletedTasks.length} tasks`;

          recordCommand(CommandType.DELETE_TASK, description, {
            id: selectedIds[0],
            deletedIds: Array.from(idsToDelete),
            cascade: true,
            deletedTasks,
            cascadeUpdates,
          });
        }
      },

      reorderTasks: (activeTaskId, overTaskId): void => {
        // Capture previous order before making changes
        const previousOrder = captureHierarchySnapshot(get().tasks);

        let changed = false;
        let movedTaskName = UNKNOWN_TASK_NAME;

        set((state) => {
          const activeTask = state.tasks.find((t) => t.id === activeTaskId);
          const overTask = state.tasks.find((t) => t.id === overTaskId);
          if (!activeTask || !overTask) return;

          movedTaskName = activeTask.name;

          const oldParent = activeTask.parent ?? null;
          const newParent = overTask.parent ?? null;

          // Cross-parent guards
          if (oldParent !== newParent) {
            // Circular hierarchy check
            if (
              wouldCreateCircularHierarchy(state.tasks, activeTaskId, newParent)
            ) {
              return;
            }

            // Max depth check
            const targetLevel = getTaskLevel(state.tasks, overTaskId);
            const activeLevel = getTaskLevel(state.tasks, activeTaskId);
            const activeSubtreeDepth =
              getMaxDescendantLevel(state.tasks, activeTaskId) - activeLevel;
            if (targetLevel + activeSubtreeDepth >= MAX_HIERARCHY_DEPTH) {
              return;
            }
          }

          // Build flattened list to determine visual positions BEFORE re-parenting
          const flatBefore = buildFlattenedTaskList(
            state.tasks,
            new Set<string>()
          );
          const activeVisualIdx = flatBefore.findIndex(
            (f) => f.task.id === activeTaskId
          );
          const overVisualIdx = flatBefore.findIndex(
            (f) => f.task.id === overTaskId
          );

          // Re-parent if needed
          if (oldParent !== newParent) {
            activeTask.parent = newParent ?? undefined;
          }

          // Get target sibling group (same parent as over, excluding active), sorted by order
          const siblings = getTaskChildren(state.tasks, newParent).filter(
            (t) => t.id !== activeTaskId
          );

          // Find position of overTask within siblings
          const overIdxInSiblings = siblings.findIndex(
            (t) => t.id === overTaskId
          );

          // Determine insert position: before or after over
          let insertIdx: number;
          if (activeVisualIdx < overVisualIdx) {
            // Moving down → insert AFTER over
            insertIdx = overIdxInSiblings + 1;
          } else {
            // Moving up → insert BEFORE over
            insertIdx = overIdxInSiblings;
          }

          // Insert active task into siblings at the determined position
          siblings.splice(insertIdx, 0, activeTask);

          // Reassign order values for the sibling group
          for (let i = 0; i < siblings.length; i++) {
            const t = state.tasks.find((task) => task.id === siblings[i].id);
            if (t) t.order = i;
          }

          // Normalize all task orders globally for consistency
          normalizeTaskOrder(state.tasks);

          // If parent changed, recalculate summary dates for old and new parents
          if (oldParent !== newParent) {
            const affectedParents = new Set<string>();
            if (oldParent) affectedParents.add(oldParent);
            if (newParent) affectedParents.add(newParent);
            recalculateSummaryAncestors(state.tasks, affectedParents);
          }

          changed = true;
        });

        if (!changed) return;

        // Mark file as dirty
        useFileStore.getState().markDirty();

        recordCommand(
          CommandType.REORDER_TASKS,
          `Reordered task "${movedTaskName}"`,
          { activeTaskId, overTaskId, previousOrder }
        );
      },

      setTasks: (tasks): void =>
        set((state) => {
          state.tasks = tasks;
          state.selectedTaskIds = [];
          state.lastSelectedTaskId = null;
          state.activeCell = { taskId: null, field: null };
          state.isEditingCell = false;
        }),

      // Selection actions (extracted)
      ...createSelectionActions(set, get),

      // Cell navigation actions
      setActiveCell: (taskId, field): void =>
        set((state) => {
          state.activeCell.taskId = taskId;
          state.activeCell.field = field;
          state.isEditingCell = false;
        }),

      navigateCell: (direction): void => {
        // Read cross-store state before set() to avoid anti-pattern
        const hiddenColumns = useChartStore.getState().hiddenColumns;
        const visibleFields = EDITABLE_FIELDS.filter(
          (field) => !hiddenColumns.includes(field)
        );
        if (visibleFields.length === 0) return;

        set((state) => {
          const { activeCell, tasks } = state;
          if (!activeCell.taskId || !activeCell.field) return;

          const fieldIndex = visibleFields.indexOf(activeCell.field);
          if (fieldIndex === -1) return;

          let newFieldIndex = fieldIndex;
          let newTaskId: string | null = activeCell.taskId;

          switch (direction) {
            case "up":
            case "down": {
              const collapsedIds = new Set(
                tasks.filter((t) => t.open === false).map((t) => t.id)
              );
              const flatList = buildFlattenedTaskList(tasks, collapsedIds);
              const visualIndex = flatList.findIndex(
                (ft) => ft.task.id === activeCell.taskId
              );
              if (visualIndex === -1) return;
              const newIndex =
                direction === "up"
                  ? Math.max(0, visualIndex - 1)
                  : Math.min(flatList.length - 1, visualIndex + 1);
              newTaskId = flatList[newIndex]?.task.id || null;
              break;
            }
            case "left":
              newFieldIndex = Math.max(0, fieldIndex - 1);
              break;
            case "right":
              newFieldIndex = Math.min(
                visibleFields.length - 1,
                fieldIndex + 1
              );
              break;
          }

          state.activeCell.taskId = newTaskId;
          state.activeCell.field = visibleFields[newFieldIndex];
          state.isEditingCell = false;
        });
      },

      startCellEdit: (): void =>
        set((state) => {
          state.isEditingCell = true;
        }),

      stopCellEdit: (): void =>
        set((state) => {
          state.isEditingCell = false;
        }),

      // Column actions (extracted)
      ...createColumnActions(set, get),

      setTaskTableWidth: (width): void =>
        set((state) => {
          state.taskTableWidth = width;
        }),

      // Expansion actions (extracted)
      ...createExpansionActions(set, get),

      // Insert task relative to another
      insertTaskAbove: (referenceTaskId): void =>
        insertTasksRelative(referenceTaskId, "above"),

      insertMultipleTasksAbove: (referenceTaskId, count): void =>
        insertTasksRelative(referenceTaskId, "above", count),

      insertTaskBelow: (referenceTaskId): void =>
        insertTasksRelative(referenceTaskId, "below"),

      // Indent/Outdent actions (extracted)
      ...createIndentOutdentActions(set, get),

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
        const summaryId = crypto.randomUUID();
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
          id: string;
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

          const affectedParents = new Set<string>([summaryId]);
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
        const affectedParentIds = new Set<string>();
        for (const summary of sortedSummaries) {
          if (summary.parent) affectedParentIds.add(summary.parent);
        }

        let cascadeUpdates: Array<{
          id: string;
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
          cascadeUpdates = recalculateSummaryAncestors(
            state.tasks,
            affectedParentIds
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
  })
);
