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
import { canHaveChildren } from "../../utils/validation";
import toast from "react-hot-toast";
import { useHistoryStore } from "./historySlice";
import { useDependencyStore } from "./dependencySlice";
import { useFileStore } from "./fileSlice";
import {
  CommandType,
  type CommandParams,
  UngroupTasksParams,
} from "../../types/command.types";
import { TASK_COLUMNS } from "../../config/tableColumns";
import { calculateColumnWidth } from "../../utils/textMeasurement";
import { useUserPreferencesStore } from "./userPreferencesSlice";
import { useChartStore } from "./chartSlice";
import { COLORS } from "../../styles/design-tokens";

const DEFAULT_TASK_DURATION = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_TASK_NAME = "New Task";
const PLACEHOLDER_TEXT = "Add new task...";
const DEFAULT_GROUP_NAME = "New Group";
const UNKNOWN_TASK_NAME = "Unknown";
const EXPAND_BUTTON_WIDTH = 16;
const CELL_GAP_SIZE = 8;

/** Capture a lightweight snapshot of task hierarchy (parent + order) for undo/redo. */
function captureHierarchySnapshot(
  tasks: ReadonlyArray<Task>
): Array<{ id: string; parent: string | undefined; order: number }> {
  return tasks.map((t) => ({ id: t.id, parent: t.parent, order: t.order }));
}

/** Record a command for undo/redo. No-op during undo/redo replay. */
function recordCommand(
  type: CommandType,
  description: string,
  params: CommandParams
): void {
  const historyStore = useHistoryStore.getState();
  if (historyStore.isUndoing || historyStore.isRedoing) return;
  historyStore.recordCommand({
    id: crypto.randomUUID(),
    type,
    timestamp: Date.now(),
    description,
    params,
  });
}

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
interface TaskState {
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
interface TaskActions {
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
type TaskStore = TaskState & TaskActions;

/**
 * Given a set of selected task IDs, returns only the topmost ancestors.
 * If a parent and its child are both selected, only the parent is kept.
 */
function getRootSelectedIds(tasks: Task[], selectedIds: string[]): string[] {
  const selectedSet = new Set(selectedIds);
  return selectedIds.filter((id) => {
    let ancestor = tasks.find((t) => t.id === id);
    while (ancestor?.parent) {
      if (selectedSet.has(ancestor.parent)) return false;
      ancestor = tasks.find((t) => t.id === ancestor!.parent);
    }
    return true;
  });
}

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
    const level = getTaskLevel(tasks, id);
    if (level + 1 >= MAX_HIERARCHY_DEPTH) {
      return {
        error: "Cannot group: maximum nesting depth would be exceeded",
      };
    }
    const descendants = getTaskDescendants(tasks, id);
    for (const desc of descendants) {
      if (getTaskLevel(tasks, desc.id) + 1 >= MAX_HIERARCHY_DEPTH) {
        return {
          error: "Cannot group: maximum nesting depth would be exceeded",
        };
      }
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
 * Task store hook with immer middleware for immutable updates.
 */
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

/**
 * Set a single task's open state. Returns true if state changed.
 */
function setTaskOpen(state: TaskState, taskId: string, open: boolean): boolean {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task || task.type !== "summary") return false;
  const hasChildren = state.tasks.some((t) => t.parent === taskId);
  if (!hasChildren) return false;
  const currentOpen = task.open ?? true;
  if (currentOpen === open) return false;
  task.open = open;
  return true;
}

/**
 * Get the effective task IDs from selection or active cell.
 * Returns selected task IDs if any, otherwise the active cell's task ID.
 */
function getEffectiveTaskIds(state: TaskState): string[] {
  if (state.selectedTaskIds.length > 0) return state.selectedTaskIds;
  if (state.activeCell.taskId) return [state.activeCell.taskId];
  return [];
}

/**
 * Set all summary tasks to open or closed. Returns true if any changed.
 */
function setAllTasksOpen(state: TaskState, open: boolean): boolean {
  let changed = false;
  state.tasks.forEach((task) => {
    if (task.type !== "summary") return;
    const hasChildren = state.tasks.some((t) => t.parent === task.id);
    if (!hasChildren) return;
    const currentOpen = task.open ?? true;
    if (currentOpen !== open) {
      task.open = open;
      changed = true;
    }
  });
  return changed;
}

/**
 * Measure and set the optimal width for a single column.
 * Shared by autoFitColumn and autoFitAllColumns.
 */
function fitColumnToContent(state: TaskState, columnId: string): void {
  const column = TASK_COLUMNS.find((col) => col.id === columnId);
  if (!column || !column.field) return;

  const field = column.field;
  const densityConfig = useUserPreferencesStore.getState().getDensityConfig();
  const fontSize = densityConfig.fontSizeCell;
  const indentSize = densityConfig.indentSize;
  const iconSize = densityConfig.iconSize;
  const cellPadding =
    columnId === "name"
      ? densityConfig.cellPaddingX
      : densityConfig.cellPaddingX * 2;

  const cellValues: string[] = [];
  const extraWidths: number[] = [];

  state.tasks.forEach((task) => {
    let valueStr = "";
    if (column.formatter) {
      valueStr = column.formatter(task[field]);
    } else {
      const value = task[field];
      valueStr = value !== undefined && value !== null ? String(value) : "";
    }
    cellValues.push(valueStr);

    if (columnId === "name") {
      const level = getTaskLevel(state.tasks as Task[], task.id);
      const hierarchyIndent = level * indentSize;
      extraWidths.push(
        hierarchyIndent + EXPAND_BUTTON_WIDTH + CELL_GAP_SIZE + iconSize
      );
    } else {
      extraWidths.push(0);
    }
  });

  if (columnId === "name") {
    cellValues.push(PLACEHOLDER_TEXT);
    extraWidths.push(EXPAND_BUTTON_WIDTH + CELL_GAP_SIZE + iconSize);
  }

  state.columnWidths[columnId] = calculateColumnWidth(
    column.label,
    cellValues,
    fontSize,
    cellPadding,
    extraWidths
  );
}

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
      tasks: [] as Task[],
      selectedTaskIds: [] as string[],
      lastSelectedTaskId: null as string | null,
      activeCell: {
        taskId: null as string | null,
        field: null as EditableField | null,
      },
      isEditingCell: false,
      columnWidths: {} as Record<string, number>,
      taskTableWidth: null as number | null,
      clipboardTaskIds: [] as string[],
      cutCell: null as { taskId: string; field: EditableField } | null,

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

            // Apply update
            state.tasks[taskIndex] = {
              ...task,
              ...taskUpdates,
            };

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

            // Max depth check (3 levels = indices 0, 1, 2)
            const targetLevel = getTaskLevel(state.tasks, overTaskId);
            const descendants = getTaskDescendants(state.tasks, activeTaskId);
            let activeSubtreeDepth = 0;
            for (const desc of descendants) {
              const descLevel =
                getTaskLevel(state.tasks, desc.id) -
                getTaskLevel(state.tasks, activeTaskId);
              if (descLevel > activeSubtreeDepth)
                activeSubtreeDepth = descLevel;
            }
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

      // Multi-selection actions
      toggleTaskSelection: (id): void =>
        set((state) => {
          const index = state.selectedTaskIds.indexOf(id);
          if (index > -1) {
            state.selectedTaskIds.splice(index, 1);
          } else {
            state.selectedTaskIds.push(id);
          }
          state.lastSelectedTaskId = id;
        }),

      selectTaskRange: (startId, endId): void =>
        set((state) => {
          const collapsedIds = new Set(
            state.tasks.filter((t) => t.open === false).map((t) => t.id)
          );
          const flatList = buildFlattenedTaskList(state.tasks, collapsedIds);
          const startIndex = flatList.findIndex((ft) => ft.task.id === startId);
          const endIndex = flatList.findIndex((ft) => ft.task.id === endId);

          if (startIndex === -1 || endIndex === -1) return;

          const minIndex = Math.min(startIndex, endIndex);
          const maxIndex = Math.max(startIndex, endIndex);

          const idsToAdd = new Set(state.selectedTaskIds);
          for (let i = minIndex; i <= maxIndex; i++) {
            idsToAdd.add(flatList[i].task.id);
          }
          state.selectedTaskIds = Array.from(idsToAdd);
          state.lastSelectedTaskId = endId;
        }),

      selectAllTasks: (): void =>
        set((state) => {
          state.selectedTaskIds = state.tasks.map((task) => task.id);
        }),

      clearSelection: (): void =>
        set((state) => {
          state.selectedTaskIds = [];
          state.lastSelectedTaskId = null;
        }),

      setSelectedTaskIds: (ids, addToSelection = false): void =>
        set((state) => {
          if (addToSelection) {
            // Add to existing selection (avoid duplicates)
            const newIds = ids.filter(
              (id) => !state.selectedTaskIds.includes(id)
            );
            state.selectedTaskIds = [...state.selectedTaskIds, ...newIds];
          } else {
            // Replace selection
            state.selectedTaskIds = ids;
          }
          // Set last selected to the last id in the list
          if (ids.length > 0) {
            state.lastSelectedTaskId = ids[ids.length - 1];
          }
        }),

      // Cell navigation actions
      setActiveCell: (taskId, field): void =>
        set((state) => {
          state.activeCell.taskId = taskId;
          state.activeCell.field = field;
          state.isEditingCell = false;
        }),

      navigateCell: (direction): void =>
        set((state) => {
          const { activeCell, tasks } = state;
          if (!activeCell.taskId || !activeCell.field) return;

          // Build visible fields list by filtering out hidden columns
          const chartState = useChartStore.getState();
          const hiddenColumns = chartState.hiddenColumns;
          const visibleFields = EDITABLE_FIELDS.filter(
            (field) => !hiddenColumns.includes(field)
          );

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
        }),

      startCellEdit: (): void =>
        set((state) => {
          state.isEditingCell = true;
        }),

      stopCellEdit: (): void =>
        set((state) => {
          state.isEditingCell = false;
        }),

      setColumnWidth: (columnId, width): void =>
        set((state) => {
          state.columnWidths[columnId] = width;
        }),

      autoFitColumn: (columnId): void =>
        set((state) => {
          fitColumnToContent(state, columnId);
        }),

      autoFitAllColumns: (): void =>
        set((state) => {
          const autoFitColumnIds = TASK_COLUMNS.filter(
            (col) => col.field && col.id !== "color"
          ).map((col) => col.id);
          for (const colId of autoFitColumnIds) {
            fitColumnToContent(state, colId);
          }
        }),

      setTaskTableWidth: (width): void =>
        set((state) => {
          state.taskTableWidth = width;
        }),

      // Hierarchy actions
      toggleTaskCollapsed: (taskId): void => {
        let changed = false;
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task || task.type !== "summary") return;
          const hasChildren = state.tasks.some((t) => t.parent === taskId);
          if (!hasChildren) return;
          task.open = !(task.open ?? true);
          changed = true;
        });
        if (changed) useFileStore.getState().markDirty();
      },

      expandTask: (taskId): void => {
        let changed = false;
        set((state) => {
          changed = setTaskOpen(state, taskId, true);
        });
        if (changed) useFileStore.getState().markDirty();
      },

      collapseTask: (taskId): void => {
        let changed = false;
        set((state) => {
          changed = setTaskOpen(state, taskId, false);
        });
        if (changed) useFileStore.getState().markDirty();
      },

      expandAll: (): void => {
        let changed = false;
        set((state) => {
          changed = setAllTasksOpen(state, true);
        });
        if (changed) useFileStore.getState().markDirty();
      },

      collapseAll: (): void => {
        let changed = false;
        set((state) => {
          changed = setAllTasksOpen(state, false);
        });
        if (changed) useFileStore.getState().markDirty();
      },

      // Insert task relative to another
      insertTaskAbove: (referenceTaskId): void =>
        insertTasksRelative(referenceTaskId, "above"),

      insertMultipleTasksAbove: (referenceTaskId, count): void =>
        insertTasksRelative(referenceTaskId, "above", count),

      insertTaskBelow: (referenceTaskId): void =>
        insertTasksRelative(referenceTaskId, "below"),

      // Indent/Outdent actions
      indentSelectedTasks: (): void => {
        const state = get();
        const taskIds = getEffectiveTaskIds(state);
        if (taskIds.length === 0) return;
        const { tasks } = state;

        // Create snapshot of current hierarchy BEFORE any changes
        const originalFlatList = buildFlattenedTaskList(
          tasks,
          new Set<string>()
        );

        // Sort selection by display order (top to bottom)
        const sortedIds = [...taskIds].sort((a, b) => {
          const indexA = originalFlatList.findIndex((t) => t.task.id === a);
          const indexB = originalFlatList.findIndex((t) => t.task.id === b);
          return indexA - indexB;
        });

        // Calculate all changes based on ORIGINAL hierarchy (capture oldParent)
        const changes: Array<{
          taskId: string;
          oldParent: string | undefined;
          newParent: string | undefined;
        }> = [];

        sortedIds.forEach((taskId) => {
          const index = originalFlatList.findIndex((t) => t.task.id === taskId);
          if (index === -1) return;

          const task = tasks.find((t) => t.id === taskId);
          if (!task) return;

          const level = originalFlatList[index].level;
          const oldParent = task.parent;

          // Find previous sibling (same level) - skip if it's also selected
          let newParentId: string | null = null;
          for (let i = index - 1; i >= 0; i--) {
            const prevTask = originalFlatList[i];
            if (prevTask.level === level) {
              // Skip if this potential parent is also selected (would create cascade)
              if (!taskIds.includes(prevTask.task.id)) {
                newParentId = prevTask.task.id;
                break;
              }
            }
            if (prevTask.level < level) break; // No suitable sibling found
          }

          if (!newParentId) return;

          const newParent = tasks.find((t) => t.id === newParentId);
          if (!newParent) return;

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
        });

        if (changes.length === 0) return;

        const previousTaskSnapshot = captureHierarchySnapshot(tasks);

        // Apply all changes at once
        set((state) => {
          changes.forEach(({ taskId, newParent }) => {
            const task = state.tasks.find((t) => t.id === taskId);
            if (task && newParent) {
              task.parent = newParent;

              // Auto-expand parent if collapsed
              const parent = state.tasks.find((t) => t.id === newParent);
              if (parent && parent.open === false) {
                parent.open = true;
              }
            }
          });

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
            ? `Indented task`
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

        taskIds.forEach((taskId) => {
          const task = tasks.find((t) => t.id === taskId);
          if (!task?.parent) return; // Already on root level

          const currentLevel = originalHierarchy.get(taskId)?.level ?? 0;
          const parent = tasks.find((t) => t.id === task.parent);
          if (!parent) return;

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
        });

        if (changes.length === 0) return;

        const previousTaskSnapshot = captureHierarchySnapshot(tasks);

        // Track old parents for summary date recalculation
        const oldParentIds = new Set<string>();
        changes.forEach(({ oldParent }) => {
          if (oldParent) {
            oldParentIds.add(oldParent);
          }
        });

        // Apply all changes at once
        set((state) => {
          changes.forEach(({ taskId, newParent }) => {
            const task = state.tasks.find((t) => t.id === taskId);
            if (task) {
              task.parent = newParent || undefined;
            }
          });

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
            ? `Outdented task`
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
