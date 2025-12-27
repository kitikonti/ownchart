/**
 * Task slice for Zustand store.
 * Manages task state and provides CRUD operations.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Task } from '../../types/chart.types';
import {
  wouldCreateCircularHierarchy,
  getTaskLevel,
  buildFlattenedTaskList,
} from '../../utils/hierarchy';
import { canHaveChildren } from '../../utils/validation';

/**
 * Editable field types for cell-based editing.
 */
export type EditableField = 'name' | 'startDate' | 'endDate' | 'duration' | 'progress' | 'color' | 'type';

/**
 * Cell navigation direction.
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

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
}

/**
 * Task actions interface.
 */
interface TaskActions {
  addTask: (taskData: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string, cascade?: boolean) => void;
  reorderTasks: (fromIndex: number, toIndex: number) => void;

  // Multi-selection actions
  toggleTaskSelection: (id: string) => void;
  selectTaskRange: (startId: string, endId: string) => void;
  selectAllTasks: () => void;
  clearSelection: () => void;

  // Cell navigation actions
  setActiveCell: (taskId: string | null, field: EditableField | null) => void;
  navigateCell: (direction: NavigationDirection) => void;
  startCellEdit: () => void;
  stopCellEdit: () => void;
  setColumnWidth: (columnId: string, width: number) => void;

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
  createSummaryTask: (data: Omit<Task, 'id' | 'type'>) => string;
  convertToSummary: (taskId: string) => void;
  convertToTask: (taskId: string) => void;
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
const EDITABLE_FIELDS: EditableField[] = ['name', 'type', 'startDate', 'endDate', 'duration', 'progress', 'color'];

export const useTaskStore = create<TaskStore>()(
  immer((set, get) => ({
    // State
    tasks: [] as Task[],
    selectedTaskIds: [] as string[],
    lastSelectedTaskId: null as string | null,
    activeCell: {
      taskId: null as string | null,
      field: null as EditableField | null,
    },
    isEditingCell: false,
    columnWidths: {} as Record<string, number>,

    // Actions
    addTask: (taskData) =>
      set((state) => {
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
        };
        state.tasks.push(newTask);
      }),

    updateTask: (id, updates) =>
      set((state) => {
        const taskIndex = state.tasks.findIndex((task) => task.id === id);
        if (taskIndex !== -1) {
          // Validate type change to milestone
          if (updates.type === 'milestone') {
            const hasChildren = state.tasks.some((t) => t.parent === id);
            if (hasChildren) {
              console.warn('Cannot convert to milestone: task has children');
              return;
            }
            // Clear end date, duration, and progress for milestones
            updates.endDate = '';
            updates.duration = 0;
            updates.progress = 0;
          }

          state.tasks[taskIndex] = {
            ...state.tasks[taskIndex],
            ...updates,
          };
        }
      }),

    deleteTask: (id, cascade = false) =>
      set((state) => {
        if (!cascade) {
          // Simple delete - just remove the task
          state.tasks = state.tasks.filter((task) => task.id !== id);
          // Clear selection for deleted task
          state.selectedTaskIds = state.selectedTaskIds.filter((selectedId) => selectedId !== id);
          return;
        }

        // Cascading delete - collect all descendants recursively
        const idsToDelete = new Set<string>([id]);

        // Recursively find all children of a given parent
        const findChildren = (parentId: string) => {
          state.tasks.forEach((task) => {
            if (task.parent === parentId && !idsToDelete.has(task.id)) {
              idsToDelete.add(task.id);
              findChildren(task.id); // Recursively find grandchildren
            }
          });
        };

        findChildren(id);

        // Remove all collected tasks
        state.tasks = state.tasks.filter((task) => !idsToDelete.has(task.id));

        // Clear selection for deleted tasks
        state.selectedTaskIds = state.selectedTaskIds.filter(
          (selectedId) => !idsToDelete.has(selectedId)
        );
      }),

    reorderTasks: (fromIndex, toIndex) =>
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
      }),

    // Multi-selection actions
    toggleTaskSelection: (id) =>
      set((state) => {
        const index = state.selectedTaskIds.indexOf(id);
        if (index > -1) {
          state.selectedTaskIds.splice(index, 1);
        } else {
          state.selectedTaskIds.push(id);
        }
        state.lastSelectedTaskId = id;
      }),

    selectTaskRange: (startId, endId) =>
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

    selectAllTasks: () =>
      set((state) => {
        state.selectedTaskIds = state.tasks.map((task) => task.id);
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedTaskIds = [];
        state.lastSelectedTaskId = null;
      }),

    // Cell navigation actions
    setActiveCell: (taskId, field) =>
      set((state) => {
        state.activeCell.taskId = taskId;
        state.activeCell.field = field;
        state.isEditingCell = false;
      }),

    navigateCell: (direction) =>
      set((state) => {
        const { activeCell, tasks } = state;
        if (!activeCell.taskId || !activeCell.field) return;

        const taskIndex = tasks.findIndex((t) => t.id === activeCell.taskId);
        if (taskIndex === -1) return;

        const fieldIndex = EDITABLE_FIELDS.indexOf(activeCell.field);
        if (fieldIndex === -1) return;

        let newTaskIndex = taskIndex;
        let newFieldIndex = fieldIndex;

        switch (direction) {
          case 'up':
            newTaskIndex = Math.max(0, taskIndex - 1);
            break;
          case 'down':
            newTaskIndex = Math.min(tasks.length - 1, taskIndex + 1);
            break;
          case 'left':
            newFieldIndex = Math.max(0, fieldIndex - 1);
            break;
          case 'right':
            newFieldIndex = Math.min(EDITABLE_FIELDS.length - 1, fieldIndex + 1);
            break;
        }

        const newTaskId = tasks[newTaskIndex]?.id || null;
        const newField = EDITABLE_FIELDS[newFieldIndex];

        state.activeCell.taskId = newTaskId;
        state.activeCell.field = newField;
        state.isEditingCell = false;
      }),

    startCellEdit: () =>
      set((state) => {
        state.isEditingCell = true;
      }),

    stopCellEdit: () =>
      set((state) => {
        state.isEditingCell = false;
      }),

    setColumnWidth: (columnId, width) =>
      set((state) => {
        state.columnWidths[columnId] = width;
      }),

    // Hierarchy actions
    moveTaskToParent: (taskId, newParentId) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Validate: prevent circular hierarchy
        if (newParentId && wouldCreateCircularHierarchy(state.tasks, taskId, newParentId)) {
          console.error('Cannot move task: would create circular hierarchy');
          return;
        }

        // Validate: parent must be able to have children (milestones cannot be parents)
        if (newParentId) {
          const newParent = state.tasks.find((t) => t.id === newParentId);
          if (newParent && !canHaveChildren(newParent)) {
            console.error('Cannot move task: milestones cannot be parents');
            return;
          }
        }

        // Validate: max depth 3 levels
        if (newParentId) {
          const newLevel = getTaskLevel(state.tasks, newParentId) + 1;
          if (newLevel > 3) {
            console.error('Cannot move task: maximum nesting depth is 3 levels');
            return;
          }
        }

        task.parent = newParentId ?? undefined;
      }),

    toggleTaskCollapsed: (taskId) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Any task with children can be collapsed (task or summary)
        const hasChildren = state.tasks.some((t) => t.parent === taskId);
        if (!hasChildren) return;

        task.open = !(task.open ?? true);
      }),

    expandTask: (taskId) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const hasChildren = state.tasks.some((t) => t.parent === taskId);
        if (hasChildren) {
          task.open = true;
        }
      }),

    collapseTask: (taskId) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const hasChildren = state.tasks.some((t) => t.parent === taskId);
        if (hasChildren) {
          task.open = false;
        }
      }),

    expandAll: () =>
      set((state) => {
        state.tasks.forEach((task) => {
          const hasChildren = state.tasks.some((t) => t.parent === task.id);
          if (hasChildren) {
            task.open = true;
          }
        });
      }),

    collapseAll: () =>
      set((state) => {
        state.tasks.forEach((task) => {
          const hasChildren = state.tasks.some((t) => t.parent === task.id);
          if (hasChildren) {
            task.open = false;
          }
        });
      }),

    // Summary task creation
    createSummaryTask: (data) => {
      let newId = '';
      set((state) => {
        const newTask: Task = {
          ...data,
          id: crypto.randomUUID(),
          type: 'summary',
          open: true, // Expanded by default
        };
        newId = newTask.id;
        state.tasks.push(newTask);
      });
      return newId;
    },

    convertToSummary: (taskId) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        task.type = 'summary';
        task.open = true;
        // Keep existing dates as fallback until children are added
      }),

    convertToTask: (taskId) =>
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Tasks CAN have children - just switch the date calculation mode
        // Children's dates will no longer affect this task's dates
        task.type = 'task';

        // Keep 'open' state if has children (for expand/collapse)
        const hasChildren = state.tasks.some((t) => t.parent === taskId);
        if (!hasChildren) {
          task.open = undefined; // Not needed if no children
        }

        // User notification: Dates are now manual
        console.info('Task dates are now manual. Children dates do not affect this task.');
      }),

    // Indent/Outdent actions
    indentSelectedTasks: () =>
      set((state) => {
        const { tasks, selectedTaskIds } = state;
        if (selectedTaskIds.length === 0) return;

        // Create snapshot of current hierarchy BEFORE any changes
        const originalFlatList = buildFlattenedTaskList(tasks, new Set<string>());

        // Sort selection by display order (top to bottom)
        const sortedIds = [...selectedTaskIds].sort((a, b) => {
          const indexA = originalFlatList.findIndex((t) => t.task.id === a);
          const indexB = originalFlatList.findIndex((t) => t.task.id === b);
          return indexA - indexB;
        });

        // Calculate all changes based on ORIGINAL hierarchy
        const changes: Array<{ taskId: string; newParentId: string }> = [];

        sortedIds.forEach((taskId) => {
          const index = originalFlatList.findIndex((t) => t.task.id === taskId);
          if (index === -1) return;

          const level = originalFlatList[index].level;

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
            changes.push({ taskId, newParentId });
          }
        });

        // Apply all changes at once
        changes.forEach(({ taskId, newParentId }) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (task) {
            task.parent = newParentId;

            // Auto-expand parent if collapsed
            const parent = state.tasks.find((t) => t.id === newParentId);
            if (parent && parent.open === false) {
              parent.open = true;
            }
          }
        });
      }),

    outdentSelectedTasks: () =>
      set((state) => {
        const { tasks, selectedTaskIds } = state;
        if (selectedTaskIds.length === 0) return;

        // Create snapshot of current hierarchy BEFORE any changes
        const originalHierarchy = new Map(
          tasks.map((t) => [t.id, { parent: t.parent, level: getTaskLevel(tasks, t.id) }])
        );

        // Calculate all changes based on ORIGINAL hierarchy
        const changes: Array<{ taskId: string; newParentId: string | undefined }> = [];

        selectedTaskIds.forEach((taskId) => {
          const task = tasks.find((t) => t.id === taskId);
          if (!task?.parent) return; // Already on root level

          const currentLevel = originalHierarchy.get(taskId)?.level ?? 0;
          const parent = tasks.find((t) => t.id === task.parent);
          if (!parent) return;

          const grandParent = parent.parent;

          // Calculate new level based on ORIGINAL hierarchy
          const newLevel = grandParent ? (originalHierarchy.get(grandParent)?.level ?? 0) + 1 : 0;

          // Validation: Ensure task only moves exactly one level up
          if (newLevel === currentLevel - 1) {
            changes.push({ taskId, newParentId: grandParent });
          }
        });

        // Apply all changes at once
        changes.forEach(({ taskId, newParentId }) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (task) {
            task.parent = newParentId || undefined;
          }
        });
      }),

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
