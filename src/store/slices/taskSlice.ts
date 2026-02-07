/**
 * Task slice for Zustand store.
 * Manages task state and provides CRUD operations.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Task } from "../../types/chart.types";
import {
  wouldCreateCircularHierarchy,
  getTaskLevel,
  buildFlattenedTaskList,
  calculateSummaryDates,
  recalculateSummaryAncestors,
  normalizeTaskOrder,
} from "../../utils/hierarchy";
import { canHaveChildren } from "../../utils/validation";
import { useHistoryStore } from "./historySlice";
import { useFileStore } from "./fileSlice";
import { CommandType } from "../../types/command.types";
import { TASK_COLUMNS } from "../../config/tableColumns";
import { calculateColumnWidth } from "../../utils/textMeasurement";
import { useUserPreferencesStore } from "./userPreferencesSlice";
import { useChartStore } from "./chartSlice";

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
  reorderTasks: (fromIndex: number, toIndex: number) => void;
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
 * Task store hook with immer middleware for immutable updates.
 */
/**
 * Editable fields in order of tab navigation.
 */
const EDITABLE_FIELDS: EditableField[] = [
  "name",
  "type",
  "startDate",
  "endDate",
  "duration",
  "progress",
  "color",
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
            recalculateSummaryAncestors(state.tasks, new Set([parentId]));
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

        // Remove all collected tasks
        state.tasks = state.tasks.filter((task) => !idsToDelete.has(task.id));

        // Clear selection for deleted tasks
        state.selectedTaskIds = state.selectedTaskIds.filter(
          (selectedId) => !idsToDelete.has(selectedId)
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

    reorderTasks: (fromIndex, toIndex): void => {
      const historyStore = useHistoryStore.getState();

      // Capture previous order before making changes
      const previousOrder = JSON.parse(JSON.stringify(get().tasks));

      set((state) => {
        if (
          fromIndex < 0 ||
          fromIndex >= state.tasks.length ||
          toIndex < 0 ||
          toIndex >= state.tasks.length
        ) {
          return;
        }

        const [movedTask] = state.tasks.splice(fromIndex, 1);
        state.tasks.splice(toIndex, 0, movedTask);

        // Update order property for all tasks
        state.tasks.forEach((task, index) => {
          task.order = index;
        });
      });

      // Mark file as dirty
      useFileStore.getState().markDirty();

      // Record command for undo/redo
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        const movedTaskName = previousOrder[fromIndex]?.name || "Unknown";
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.REORDER_TASKS,
          timestamp: Date.now(),
          description: `Reordered task "${movedTaskName}"`,
          params: {
            fromIndex,
            toIndex,
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
        const startIndex = state.tasks.findIndex((t) => t.id === startId);
        const endIndex = state.tasks.findIndex((t) => t.id === endId);

        if (startIndex === -1 || endIndex === -1) return;

        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);

        const idsToAdd = new Set(state.selectedTaskIds);
        for (let i = minIndex; i <= maxIndex; i++) {
          idsToAdd.add(state.tasks[i].id);
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

        const taskIndex = tasks.findIndex((t) => t.id === activeCell.taskId);
        if (taskIndex === -1) return;

        // Build visible fields list by filtering out hidden columns and progress
        const chartState = useChartStore.getState();
        const hiddenColumns = chartState.hiddenColumns;
        const showProgress = chartState.showProgress;
        const visibleFields = EDITABLE_FIELDS.filter((field) => {
          if (field === "progress") return showProgress;
          if (hiddenColumns.includes(field)) return false;
          return true;
        });

        const fieldIndex = visibleFields.indexOf(activeCell.field);
        if (fieldIndex === -1) return;

        let newTaskIndex = taskIndex;
        let newFieldIndex = fieldIndex;

        switch (direction) {
          case "up":
            newTaskIndex = Math.max(0, taskIndex - 1);
            break;
          case "down":
            newTaskIndex = Math.min(tasks.length - 1, taskIndex + 1);
            break;
          case "left":
            newFieldIndex = Math.max(0, fieldIndex - 1);
            break;
          case "right":
            newFieldIndex = Math.min(visibleFields.length - 1, fieldIndex + 1);
            break;
        }

        const newTaskId = tasks[newTaskIndex]?.id || null;
        const newField = visibleFields[newFieldIndex];

        state.activeCell.taskId = newTaskId;
        state.activeCell.field = newField;
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
        color: "#0F6CBD",
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
          color: "#0F6CBD",
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
        color: "#0F6CBD",
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
      const { tasks, selectedTaskIds } = get();
      if (selectedTaskIds.length === 0) return;

      // Create snapshot of current hierarchy BEFORE any changes
      const originalFlatList = buildFlattenedTaskList(tasks, new Set<string>());

      // Sort selection by display order (top to bottom)
      const sortedIds = [...selectedTaskIds].sort((a, b) => {
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
            if (!selectedTaskIds.includes(prevTask.task.id)) {
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

        // Validation
        if (
          canHaveChildren(newParent) &&
          level < 2 && // Max 3 levels (0, 1, 2)
          !wouldCreateCircularHierarchy(tasks, newParentId, taskId) &&
          newParentLevel === level // Ensure parent is on same level (task will be level + 1)
        ) {
          changes.push({ taskId, oldParent, newParent: newParentId });
        }
      });

      if (changes.length === 0) return;

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
          },
        });
      }
    },

    outdentSelectedTasks: (): void => {
      const historyStore = useHistoryStore.getState();
      const { tasks, selectedTaskIds } = get();
      if (selectedTaskIds.length === 0) return;

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

      selectedTaskIds.forEach((taskId) => {
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
          },
        });
      }
    },

    canIndentSelection: (): boolean => {
      const { tasks, selectedTaskIds } = get();
      if (selectedTaskIds.length === 0) return false;

      const flatList = buildFlattenedTaskList(tasks, new Set<string>());

      return selectedTaskIds.some((taskId) => {
        const index = flatList.findIndex((t) => t.task.id === taskId);
        if (index === -1) return false;

        const level = flatList[index].level;

        // Check if there's a previous sibling
        for (let i = index - 1; i >= 0; i--) {
          if (flatList[i].level === level) {
            const potentialParent = flatList[i].task;
            return canHaveChildren(potentialParent) && level < 2;
          }
          if (flatList[i].level < level) break;
        }
        return false;
      });
    },

    canOutdentSelection: (): boolean => {
      const { tasks, selectedTaskIds } = get();
      if (selectedTaskIds.length === 0) return false;

      return selectedTaskIds.some((taskId) => {
        const task = tasks.find((t) => t.id === taskId);
        return task?.parent !== undefined && task?.parent !== null;
      });
    },
  }))
);
