/**
 * Task slice for Zustand store.
 * Manages task state and provides CRUD operations.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
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
} from "../../utils/hierarchy";
import { canHaveChildren } from "../../utils/validation";
import toast from "react-hot-toast";
import { useHistoryStore } from "./historySlice";
import { useDependencyStore } from "./dependencySlice";
import { useFileStore } from "./fileSlice";
import { CommandType, UngroupTasksParams } from "../../types/command.types";
import { TASK_COLUMNS } from "../../config/tableColumns";
import { calculateColumnWidth } from "../../utils/textMeasurement";
import { useUserPreferencesStore } from "./userPreferencesSlice";
import { useChartStore } from "./chartSlice";
import { COLORS } from "../../styles/design-tokens";

/** Capture a lightweight snapshot of task hierarchy (parent + order) for undo/redo. */
function captureHierarchySnapshot(
  tasks: ReadonlyArray<Task>
): Array<{ id: string; parent: string | undefined; order: number }> {
  return tasks.map((t) => ({ id: t.id, parent: t.parent, order: t.order }));
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
  moveTaskToParent: (taskId: string, newParentId: string | null) => void;
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

  // Summary task creation
  createSummaryTask: (data: Omit<Task, "id" | "type">) => string;
  convertToSummary: (taskId: string) => void;
  convertToTask: (taskId: string) => void;

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
    let current = tasks.find((t) => t.id === id);
    while (current?.parent) {
      if (selectedSet.has(current.parent)) return false;
      current = tasks.find((t) => t.id === current!.parent);
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
  const duration = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;

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
      summaryTask: JSON.parse(JSON.stringify(summary)),
      childChanges,
      removedDependencies: JSON.parse(JSON.stringify(deps)),
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

export const useTaskStore = create<TaskStore>()(
  immer((set, get) => ({
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
      const historyStore = useHistoryStore.getState();
      let generatedId = "";

      set((state) => {
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
        };
        generatedId = newTask.id;
        state.tasks.push(newTask);
      });

      // Mark file as dirty
      useFileStore.getState().markDirty();

      // Record command for undo/redo
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.ADD_TASK,
          timestamp: Date.now(),
          description: `Created task "${taskData.name}"`,
          params: {
            task: taskData,
            generatedId,
          },
        });
      }
    },

    updateTask: (id, updates): void => {
      const historyStore = useHistoryStore.getState();
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
              console.warn("Cannot convert to milestone: task has children");
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
              end.setDate(end.getDate() + 6); // 7 calendar days total
              updates.endDate = end.toISOString().split("T")[0];
              updates.duration = 7;
            }
          }

          // Handle type change to summary
          if (updates.type === "summary") {
            // Apply type change first so calculateSummaryDates can see it
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

          // Apply update to child task
          state.tasks[taskIndex] = {
            ...currentTask,
            ...updates,
          };

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
      if (
        !historyStore.isUndoing &&
        !historyStore.isRedoing &&
        Object.keys(previousValues).length > 0
      ) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.UPDATE_TASK,
          timestamp: Date.now(),
          description: `Updated task "${taskName}"${parentUpdates.length > 0 ? " (and parent)" : ""}`,
          params: {
            id,
            updates,
            previousValues,
            cascadeUpdates: parentUpdates, // NEW: Include parent updates for proper undo
          },
        });
      }
    },

    updateMultipleTasks: (updates): void => {
      const historyStore = useHistoryStore.getState();
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
      if (
        !historyStore.isUndoing &&
        !historyStore.isRedoing &&
        taskChanges.length > 0
      ) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.MULTI_DRAG_TASKS,
          timestamp: Date.now(),
          description: `Moved ${taskChanges.length} task(s)`,
          params: {
            taskChanges,
            cascadeUpdates,
          },
        });
      }
    },

    deleteTask: (id, cascade = false): void => {
      const historyStore = useHistoryStore.getState();
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
            // Deep clone to avoid Immer draft proxy issues
            deletedTasks.push(JSON.parse(JSON.stringify(taskToDelete)));
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
        const idsToDelete = new Set<string>([id]);

        // Recursively find all children of a given parent
        const findChildren = (parentId: string): void => {
          state.tasks.forEach((task) => {
            if (task.parent === parentId && !idsToDelete.has(task.id)) {
              idsToDelete.add(task.id);
              findChildren(task.id); // Recursively find grandchildren
            }
          });
        };

        findChildren(id);

        // Capture all tasks before deleting
        state.tasks.forEach((task) => {
          if (idsToDelete.has(task.id)) {
            // Deep clone to avoid Immer draft proxy issues
            deletedTasks.push(JSON.parse(JSON.stringify(task)));
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
      if (
        !historyStore.isUndoing &&
        !historyStore.isRedoing &&
        deletedTasks.length > 0
      ) {
        const taskName = deletedTasks[0]?.name || "Unknown";
        const description =
          deletedTasks.length === 1
            ? `Deleted task "${taskName}"`
            : `Deleted ${deletedTasks.length} tasks`;

        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.DELETE_TASK,
          timestamp: Date.now(),
          description,
          params: {
            id,
            deletedIds: deletedTasks.map((t) => t.id),
            cascade,
            deletedTasks,
            cascadeUpdates,
          },
        });
      }
    },

    deleteSelectedTasks: (): void => {
      const historyStore = useHistoryStore.getState();
      const state = get();
      const selectedIds = state.selectedTaskIds;

      if (selectedIds.length === 0) return;

      // Collect all tasks to delete (including children of selected tasks)
      const idsToDelete = new Set<string>();
      const deletedTasks: Task[] = [];

      // Recursively find all children
      const findChildren = (parentId: string): void => {
        state.tasks.forEach((task) => {
          if (task.parent === parentId && !idsToDelete.has(task.id)) {
            idsToDelete.add(task.id);
            findChildren(task.id);
          }
        });
      };

      // Add selected tasks and their children
      selectedIds.forEach((id) => {
        idsToDelete.add(id);
        findChildren(id);
      });

      // Capture all tasks before deleting
      state.tasks.forEach((task) => {
        if (idsToDelete.has(task.id)) {
          deletedTasks.push(JSON.parse(JSON.stringify(task)));
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
      if (
        !historyStore.isUndoing &&
        !historyStore.isRedoing &&
        deletedTasks.length > 0
      ) {
        const description =
          deletedTasks.length === 1
            ? `Deleted task "${deletedTasks[0].name}"`
            : `Deleted ${deletedTasks.length} tasks`;

        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.DELETE_TASK,
          timestamp: Date.now(),
          description,
          params: {
            id: selectedIds[0],
            deletedIds: Array.from(idsToDelete),
            cascade: true,
            deletedTasks,
            cascadeUpdates,
          },
        });
      }
    },

    reorderTasks: (activeTaskId, overTaskId): void => {
      const historyStore = useHistoryStore.getState();

      // Capture previous order before making changes
      const previousOrder = JSON.parse(JSON.stringify(get().tasks));

      let changed = false;
      let movedTaskName = "Unknown";

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
            if (descLevel > activeSubtreeDepth) activeSubtreeDepth = descLevel;
          }
          if (targetLevel + activeSubtreeDepth >= MAX_HIERARCHY_DEPTH) {
            toast.error(
              `Cannot move: maximum nesting depth of ${MAX_HIERARCHY_DEPTH} levels would be exceeded`
            );
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

      // Record command for undo/redo
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.REORDER_TASKS,
          timestamp: Date.now(),
          description: `Reordered task "${movedTaskName}"`,
          params: {
            activeTaskId,
            overTaskId,
            previousOrder,
          },
        });
      }
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
        const visibleFields = EDITABLE_FIELDS.filter((field) => {
          if (hiddenColumns.includes(field)) return false;
          return true;
        });

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
            newFieldIndex = Math.min(visibleFields.length - 1, fieldIndex + 1);
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
        const column = TASK_COLUMNS.find((col) => col.id === columnId);
        if (!column || !column.field) return;

        const field = column.field;

        // Get density config for accurate measurements
        const densityConfig = useUserPreferencesStore
          .getState()
          .getDensityConfig();
        const fontSize = densityConfig.fontSizeCell;
        const indentSize = densityConfig.indentSize;
        const iconSize = densityConfig.iconSize;
        // Name column has no left padding (handled by indent), others have both
        const cellPadding =
          columnId === "name"
            ? densityConfig.cellPaddingX
            : densityConfig.cellPaddingX * 2;

        // Prepare cell values and extra widths
        const cellValues: string[] = [];
        const extraWidths: number[] = [];

        state.tasks.forEach((task) => {
          let valueStr = "";
          if (column.formatter) {
            valueStr = column.formatter(task[field]);
          } else {
            const value = task[field];
            valueStr =
              value !== undefined && value !== null ? String(value) : "";
          }
          cellValues.push(valueStr);

          // For name column, calculate extra width for UI elements
          if (columnId === "name") {
            const level = getTaskLevel(state.tasks as Task[], task.id);
            const hierarchyIndent = level * indentSize;
            const expandButton = 16; // w-4 expand/collapse button
            const gaps = 8; // gap-1 (4px) × 2 between elements
            const typeIcon = iconSize;
            extraWidths.push(hierarchyIndent + expandButton + gaps + typeIcon);
          } else {
            extraWidths.push(0);
          }
        });

        // For name column, include "Add new task..." placeholder
        if (columnId === "name") {
          cellValues.push("Add new task...");
          // Placeholder row has same UI elements as a level-0 task
          const expandButton = 16;
          const gaps = 8;
          const typeIcon = iconSize;
          extraWidths.push(expandButton + gaps + typeIcon);
        }

        // Use shared utility function for width calculation
        state.columnWidths[columnId] = calculateColumnWidth(
          column.label,
          cellValues,
          fontSize,
          cellPadding,
          extraWidths
        );
      }),

    autoFitAllColumns: (): void =>
      set((state) => {
        // Columns with variable content that need auto-fit
        const autoFitColumnIds = [
          "name",
          "startDate",
          "endDate",
          "duration",
          "progress",
        ];

        // Get density config for accurate measurements
        const densityConfig = useUserPreferencesStore
          .getState()
          .getDensityConfig();
        const fontSize = densityConfig.fontSizeCell;
        const indentSize = densityConfig.indentSize;
        const iconSize = densityConfig.iconSize;

        for (const columnId of autoFitColumnIds) {
          const column = TASK_COLUMNS.find((col) => col.id === columnId);
          if (!column || !column.field) continue;

          const field = column.field;

          // Name column has no left padding (handled by indent), others have both
          const cellPadding =
            columnId === "name"
              ? densityConfig.cellPaddingX
              : densityConfig.cellPaddingX * 2;

          // Prepare cell values and extra widths
          const cellValues: string[] = [];
          const extraWidths: number[] = [];

          state.tasks.forEach((task) => {
            let valueStr = "";
            if (column.formatter) {
              valueStr = column.formatter(task[field]);
            } else {
              const value = task[field];
              valueStr =
                value !== undefined && value !== null ? String(value) : "";
            }
            cellValues.push(valueStr);

            // For name column, calculate extra width for UI elements
            if (columnId === "name") {
              const level = getTaskLevel(state.tasks as Task[], task.id);
              const hierarchyIndent = level * indentSize;
              const expandButton = 16; // w-4 expand/collapse button
              const gaps = 8; // gap-1 (4px) × 2 between elements
              const typeIcon = iconSize;
              extraWidths.push(
                hierarchyIndent + expandButton + gaps + typeIcon
              );
            } else {
              extraWidths.push(0);
            }
          });

          // For name column, include "Add new task..." placeholder
          if (columnId === "name") {
            cellValues.push("Add new task...");
            // Placeholder row has same UI elements as a level-0 task
            const expandButton = 16;
            const gaps = 8;
            const typeIcon = iconSize;
            extraWidths.push(expandButton + gaps + typeIcon);
          }

          // Use shared utility function for width calculation
          state.columnWidths[columnId] = calculateColumnWidth(
            column.label,
            cellValues,
            fontSize,
            cellPadding,
            extraWidths
          );
        }
      }),

    setTaskTableWidth: (width): void =>
      set((state) => {
        state.taskTableWidth = width;
      }),

    // Hierarchy actions
    moveTaskToParent: (taskId, newParentId): void =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Validate: prevent circular hierarchy
        if (
          newParentId &&
          wouldCreateCircularHierarchy(state.tasks, taskId, newParentId)
        ) {
          console.error("Cannot move task: would create circular hierarchy");
          return;
        }

        // Validate: parent must be able to have children (milestones cannot be parents)
        if (newParentId) {
          const newParent = state.tasks.find((t) => t.id === newParentId);
          if (newParent && !canHaveChildren(newParent)) {
            console.error("Cannot move task: milestones cannot be parents");
            return;
          }
        }

        // Validate: max depth 3 levels
        if (newParentId) {
          const newLevel = getTaskLevel(state.tasks, newParentId) + 1;
          if (newLevel > 3) {
            console.error(
              "Cannot move task: maximum nesting depth is 3 levels"
            );
            return;
          }
        }

        const oldParentId = task.parent;
        task.parent = newParentId ?? undefined;

        // Recalculate summary dates for affected parents
        const affectedParents = new Set<string>();
        if (newParentId) affectedParents.add(newParentId);
        if (oldParentId) affectedParents.add(oldParentId);
        if (affectedParents.size > 0) {
          recalculateSummaryAncestors(state.tasks, affectedParents);
        }

        // Normalize order so children follow their parent
        normalizeTaskOrder(state.tasks);
      }),

    toggleTaskCollapsed: (taskId): void =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Only summary tasks with children can be collapsed
        if (task.type !== "summary") return;
        const hasChildren = state.tasks.some((t) => t.parent === taskId);
        if (!hasChildren) return;

        task.open = !(task.open ?? true);
      }),

    expandTask: (taskId): void =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Only summary tasks can be expanded/collapsed
        if (task.type !== "summary") return;
        const hasChildren = state.tasks.some((t) => t.parent === taskId);
        if (hasChildren) {
          task.open = true;
        }
      }),

    collapseTask: (taskId): void =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Only summary tasks can be expanded/collapsed
        if (task.type !== "summary") return;
        const hasChildren = state.tasks.some((t) => t.parent === taskId);
        if (hasChildren) {
          task.open = false;
        }
      }),

    expandAll: (): void =>
      set((state) => {
        state.tasks.forEach((task) => {
          // Only summary tasks can be expanded
          if (task.type !== "summary") return;
          const hasChildren = state.tasks.some((t) => t.parent === task.id);
          if (hasChildren) {
            task.open = true;
          }
        });
      }),

    collapseAll: (): void =>
      set((state) => {
        state.tasks.forEach((task) => {
          // Only summary tasks can be collapsed
          if (task.type !== "summary") return;
          const hasChildren = state.tasks.some((t) => t.parent === task.id);
          if (hasChildren) {
            task.open = false;
          }
        });
      }),

    // Summary task creation
    createSummaryTask: (data): string => {
      let newId = "";
      set((state) => {
        const newTask: Task = {
          ...data,
          id: crypto.randomUUID(),
          type: "summary",
          open: true, // Expanded by default
        };
        newId = newTask.id;
        state.tasks.push(newTask);
      });
      return newId;
    },

    convertToSummary: (taskId): void =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        task.type = "summary";
        task.open = true;

        // Check if task has children
        const hasChildren = state.tasks.some((t) => t.parent === taskId);

        if (hasChildren) {
          // Recalculate dates from children
          const summaryDates = calculateSummaryDates(state.tasks, taskId);
          if (summaryDates) {
            task.startDate = summaryDates.startDate;
            task.endDate = summaryDates.endDate;
            task.duration = summaryDates.duration;
          }
        } else {
          // No children - clear dates (summary should have no bar)
          task.startDate = "";
          task.endDate = "";
          task.duration = 0;
        }
      }),

    convertToTask: (taskId): void =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Tasks CAN have children - just switch the date calculation mode
        // Children's dates will no longer affect this task's dates
        task.type = "task";

        // Keep 'open' state if has children (for expand/collapse)
        const hasChildren = state.tasks.some((t) => t.parent === taskId);
        if (!hasChildren) {
          task.open = undefined; // Not needed if no children
        }

        // User notification: Dates are now manual
        console.info(
          "Task dates are now manual. Children dates do not affect this task."
        );
      }),

    // Insert task relative to another
    insertTaskAbove: (referenceTaskId): void => {
      const historyStore = useHistoryStore.getState();
      const state = get();

      const refIndex = state.tasks.findIndex((t) => t.id === referenceTaskId);
      if (refIndex === -1) return;

      const refTask = state.tasks[refIndex];
      const DEFAULT_DURATION = 7;

      // Calculate dates: new task ends one day before reference starts
      let endDate = "";
      let startDate = "";

      if (refTask.startDate) {
        const refStart = new Date(refTask.startDate);
        const end = new Date(refStart);
        end.setDate(refStart.getDate() - 1); // Day before reference starts
        endDate = end.toISOString().split("T")[0];

        const start = new Date(end);
        start.setDate(end.getDate() - DEFAULT_DURATION + 1);
        startDate = start.toISOString().split("T")[0];
      } else {
        // Reference has no start date, use today
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - DEFAULT_DURATION + 1);
        startDate = weekAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
      }

      const taskData: Omit<Task, "id"> = {
        name: "New Task",
        startDate,
        endDate,
        duration: DEFAULT_DURATION,
        progress: 0,
        color: COLORS.chart.taskDefault,
        order: refIndex,
        type: "task",
        parent: refTask.parent, // Same hierarchy level
        metadata: {},
      };

      const generatedId = crypto.randomUUID();

      set((state) => {
        const newTask: Task = {
          ...taskData,
          id: generatedId,
        };

        // Insert at reference position (pushing reference down)
        state.tasks.splice(refIndex, 0, newTask);

        // Update order for all tasks
        state.tasks.forEach((task, index) => {
          task.order = index;
        });
      });

      // Recalculate parent summary dates
      if (taskData.parent) {
        set((state) => {
          recalculateSummaryAncestors(state.tasks, new Set([taskData.parent!]));
        });
      }

      // Mark file as dirty
      useFileStore.getState().markDirty();

      // Record command for undo/redo
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.ADD_TASK,
          timestamp: Date.now(),
          description: "Inserted task above",
          params: {
            task: taskData,
            generatedId,
          },
        });
      }
    },

    insertMultipleTasksAbove: (referenceTaskId, count): void => {
      const historyStore = useHistoryStore.getState();
      const state = get();

      const refIndex = state.tasks.findIndex((t) => t.id === referenceTaskId);
      if (refIndex === -1 || count < 1) return;

      const refTask = state.tasks[refIndex];
      const DEFAULT_DURATION = 7;

      const tasksToInsert: Array<Omit<Task, "id">> = [];
      const generatedIds: string[] = [];

      // Build tasks from closest-to-reference backwards
      for (let i = 0; i < count; i++) {
        let endDate = "";
        let startDate = "";

        if (refTask.startDate) {
          const refStart = new Date(refTask.startDate);
          // Each task stacks further before the reference
          const end = new Date(refStart);
          end.setDate(refStart.getDate() - 1 - i * (DEFAULT_DURATION + 1));
          endDate = end.toISOString().split("T")[0];

          const start = new Date(end);
          start.setDate(end.getDate() - DEFAULT_DURATION + 1);
          startDate = start.toISOString().split("T")[0];
        } else {
          const today = new Date();
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - DEFAULT_DURATION + 1);
          startDate = weekAgo.toISOString().split("T")[0];
          endDate = today.toISOString().split("T")[0];
        }

        const taskData: Omit<Task, "id"> = {
          name: "New Task",
          startDate,
          endDate,
          duration: DEFAULT_DURATION,
          progress: 0,
          color: COLORS.chart.taskDefault,
          order: refIndex + i, // Will be normalized
          type: "task",
          parent: refTask.parent,
          metadata: {},
        };

        tasksToInsert.push(taskData);
        generatedIds.push(crypto.randomUUID());
      }

      // Reverse so earliest task comes first in the array (farthest from reference is first)
      tasksToInsert.reverse();
      generatedIds.reverse();

      set((state) => {
        const newTasks: Task[] = tasksToInsert.map((taskData, i) => ({
          ...taskData,
          id: generatedIds[i],
        }));

        // Insert all at reference position
        state.tasks.splice(refIndex, 0, ...newTasks);

        // Assign sequential order so normalizeTaskOrder preserves splice position
        state.tasks.forEach((task, index) => {
          task.order = index;
        });
        normalizeTaskOrder(state.tasks);
      });

      // Recalculate parent summary dates
      if (refTask.parent) {
        set((state) => {
          recalculateSummaryAncestors(state.tasks, new Set([refTask.parent!]));
        });
      }

      // Mark file as dirty
      useFileStore.getState().markDirty();

      // Record single command for undo/redo
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.ADD_TASK,
          timestamp: Date.now(),
          description: `Inserted ${count} tasks above`,
          params: {
            task: tasksToInsert[0],
            tasks: tasksToInsert,
            generatedIds,
          },
        });
      }
    },

    insertTaskBelow: (referenceTaskId): void => {
      const historyStore = useHistoryStore.getState();
      const state = get();

      const refIndex = state.tasks.findIndex((t) => t.id === referenceTaskId);
      if (refIndex === -1) return;

      const refTask = state.tasks[refIndex];
      const DEFAULT_DURATION = 7;

      // Calculate dates: new task starts one day after reference ends
      let startDate = "";
      let endDate = "";

      if (refTask.endDate) {
        const refEnd = new Date(refTask.endDate);
        const start = new Date(refEnd);
        start.setDate(refEnd.getDate() + 1); // Day after reference ends
        startDate = start.toISOString().split("T")[0];

        const end = new Date(start);
        end.setDate(start.getDate() + DEFAULT_DURATION - 1);
        endDate = end.toISOString().split("T")[0];
      } else {
        // Reference has no end date, use today
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + DEFAULT_DURATION - 1);
        startDate = today.toISOString().split("T")[0];
        endDate = nextWeek.toISOString().split("T")[0];
      }

      const taskData: Omit<Task, "id"> = {
        name: "New Task",
        startDate,
        endDate,
        duration: DEFAULT_DURATION,
        progress: 0,
        color: COLORS.chart.taskDefault,
        order: refIndex + 1,
        type: "task",
        parent: refTask.parent, // Same hierarchy level
        metadata: {},
      };

      const generatedId = crypto.randomUUID();

      set((state) => {
        const newTask: Task = {
          ...taskData,
          id: generatedId,
        };

        // Insert after reference position
        state.tasks.splice(refIndex + 1, 0, newTask);

        // Update order for all tasks
        state.tasks.forEach((task, index) => {
          task.order = index;
        });
      });

      // Recalculate parent summary dates
      if (taskData.parent) {
        set((state) => {
          recalculateSummaryAncestors(state.tasks, new Set([taskData.parent!]));
        });
      }

      // Mark file as dirty
      useFileStore.getState().markDirty();

      // Record command for undo/redo
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.ADD_TASK,
          timestamp: Date.now(),
          description: "Inserted task below",
          params: {
            task: taskData,
            generatedId,
          },
        });
      }
    },

    // Indent/Outdent actions
    indentSelectedTasks: (): void => {
      const historyStore = useHistoryStore.getState();
      const { tasks, selectedTaskIds, activeCell } = get();
      const taskIds =
        selectedTaskIds.length > 0
          ? selectedTaskIds
          : activeCell.taskId
            ? [activeCell.taskId]
            : [];
      if (taskIds.length === 0) return;

      // Create snapshot of current hierarchy BEFORE any changes
      const originalFlatList = buildFlattenedTaskList(tasks, new Set<string>());

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

      // Record command for undo/redo
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        const description =
          changes.length === 1
            ? `Indented task`
            : `Indented ${changes.length} tasks`;

        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.INDENT_TASKS,
          timestamp: Date.now(),
          description,
          params: {
            taskIds: changes.map((c) => c.taskId),
            changes,
            previousTaskSnapshot,
            afterTaskSnapshot,
          },
        });
      }
    },

    outdentSelectedTasks: (): void => {
      const historyStore = useHistoryStore.getState();
      const { tasks, selectedTaskIds, activeCell } = get();
      const taskIds =
        selectedTaskIds.length > 0
          ? selectedTaskIds
          : activeCell.taskId
            ? [activeCell.taskId]
            : [];
      if (taskIds.length === 0) return;

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

      // Record command for undo/redo
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        const description =
          changes.length === 1
            ? `Outdented task`
            : `Outdented ${changes.length} tasks`;

        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.OUTDENT_TASKS,
          timestamp: Date.now(),
          description,
          params: {
            taskIds: changes.map((c) => c.taskId),
            changes,
            previousTaskSnapshot,
            afterTaskSnapshot,
          },
        });
      }
    },

    canIndentSelection: (): boolean => {
      const { tasks, selectedTaskIds, activeCell } = get();
      const taskIds =
        selectedTaskIds.length > 0
          ? selectedTaskIds
          : activeCell.taskId
            ? [activeCell.taskId]
            : [];
      if (taskIds.length === 0) return false;

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
      const { tasks, selectedTaskIds, activeCell } = get();
      const taskIds =
        selectedTaskIds.length > 0
          ? selectedTaskIds
          : activeCell.taskId
            ? [activeCell.taskId]
            : [];
      if (taskIds.length === 0) return false;

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
      const historyStore = useHistoryStore.getState();
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
        name: "New Group",
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

      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.GROUP_TASKS,
          timestamp: Date.now(),
          description:
            rootIds.length === 1
              ? "Grouped 1 task"
              : `Grouped ${rootIds.length} tasks`,
          params: {
            summaryTaskId: summaryId,
            summaryTask,
            changes,
            previousOrder,
            cascadeUpdates,
          },
        });
      }
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
      const historyStore = useHistoryStore.getState();
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

      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.UNGROUP_TASKS,
          timestamp: Date.now(),
          description:
            summariesToUngroup.length === 1
              ? "Ungrouped 1 task"
              : `Ungrouped ${summariesToUngroup.length} tasks`,
          params: {
            ungroupedSummaries,
            previousOrder,
            cascadeUpdates,
          },
        });
      }
    },
  }))
);
