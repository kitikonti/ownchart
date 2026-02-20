/**
 * Task slice for Zustand store.
 * Manages task state and provides CRUD operations.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { current } from "immer";
import type { Task } from "../../types/chart.types";
import {
  wouldCreateCircularHierarchy,
  getTaskLevel,
  MAX_HIERARCHY_DEPTH,
  getTaskChildren,
  buildFlattenedTaskList,
  recalculateSummaryAncestors,
  normalizeTaskOrder,
  getMaxDescendantLevel,
  collectDescendantIds,
} from "../../utils/hierarchy";
import { useFileStore } from "./fileSlice";
import { useDependencyStore } from "./dependencySlice";
import { CommandType } from "../../types/command.types";
import { useChartStore } from "./chartSlice";
import {
  UNKNOWN_TASK_NAME,
  captureHierarchySnapshot,
  recordCommand,
  computeTypeChangeEffects,
} from "./taskSliceHelpers";
import { createSelectionActions } from "./selectionActions";
import { createExpansionActions } from "./expansionActions";
import { createColumnActions } from "./columnActions";
import { createIndentOutdentActions } from "./indentOutdentActions";
import { createGroupingActions } from "./groupingActions";
import { createInsertionActions } from "./insertionActions";

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
        mode: "single",
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
          const task = state.tasks[taskIndex];
          taskName = task.name;

          // Save original type before type-change logic
          // (computeTypeChangeEffects may mutate task.type for summary)
          const originalType = task.type;

          // Validate and enrich updates for type-change side effects
          const enriched = computeTypeChangeEffects(
            state.tasks,
            id,
            task,
            updates
          );
          if (!enriched) return; // Type change rejected (e.g., milestone with children)
          updates = enriched;

          // Capture previous values for undo (type uses saved original since
          // computeTypeChangeEffects may have mutated task.type for summary)
          for (const key of Object.keys(updates)) {
            const typedKey = key as keyof Task;
            if (typedKey === "type") {
              previousValues.type = originalType;
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              previousValues[typedKey] = task[typedKey] as any;
            }
          }

          // Capture parent before applying updates
          const parentId = task.parent;

          // Apply update — uses Object.assign to mutate the existing draft
          Object.assign(task, updates);

          // Check if parent needs recalculation (summary cascade)
          if (parentId && (updates.startDate || updates.endDate)) {
            const cascadeResults = recalculateSummaryAncestors(
              state.tasks,
              new Set([parentId])
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

      // Remove dependencies referencing deleted tasks and capture them for undo
      let deletedDependencies: import("../../types/dependency.types").Dependency[] =
        [];
      if (deletedTasks.length > 0) {
        const depStore = useDependencyStore.getState();
        for (const dt of deletedTasks) {
          deletedDependencies.push(
            ...depStore.removeDependenciesForTask(dt.id)
          );
        }
        // Deduplicate (a dep may reference two deleted tasks)
        const seen = new Set<string>();
        deletedDependencies = deletedDependencies.filter((d) => {
          if (seen.has(d.id)) return false;
          seen.add(d.id);
          return true;
        });
      }

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
          deletedDependencies,
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
          deletedTasks.push({ ...task });
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

      set((state) => {
        state.tasks = state.tasks.filter((task) => !idsToDelete.has(task.id));
        state.selectedTaskIds = [];
        state.clipboardTaskIds = state.clipboardTaskIds.filter(
          (id) => !idsToDelete.has(id)
        );
        // Clear active cell if it referenced a deleted task
        if (
          state.activeCell.taskId &&
          idsToDelete.has(state.activeCell.taskId)
        ) {
          state.activeCell = { taskId: null, field: null };
        }

        // Recalculate summary ancestors for affected parents
        cascadeUpdates = recalculateSummaryAncestors(
          state.tasks,
          affectedParentIds
        );
      });

      // Remove dependencies referencing deleted tasks and capture them for undo
      let deletedDependencies: import("../../types/dependency.types").Dependency[] =
        [];
      if (deletedTasks.length > 0) {
        const depStore = useDependencyStore.getState();
        for (const dt of deletedTasks) {
          deletedDependencies.push(
            ...depStore.removeDependenciesForTask(dt.id)
          );
        }
        // Deduplicate (a dep may reference two deleted tasks)
        const seen = new Set<string>();
        deletedDependencies = deletedDependencies.filter((d) => {
          if (seen.has(d.id)) return false;
          seen.add(d.id);
          return true;
        });
      }

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
          deletedDependencies,
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
    ...createSelectionActions(set),

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
            newFieldIndex = Math.min(visibleFields.length - 1, fieldIndex + 1);
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
    ...createColumnActions(set),

    setTaskTableWidth: (width): void =>
      set((state) => {
        state.taskTableWidth = width;
      }),

    // Expansion actions (extracted)
    ...createExpansionActions(set),

    // Insertion actions (extracted)
    ...createInsertionActions(set, get),

    // Indent/Outdent actions (extracted)
    ...createIndentOutdentActions(set, get),

    // Grouping actions (extracted)
    ...createGroupingActions(set, get),
  }))
);
