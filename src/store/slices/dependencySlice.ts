/**
 * Dependency slice for Zustand store.
 * Manages task dependencies with CRUD operations, validation, and date propagation.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import toast from "react-hot-toast";
import type {
  Dependency,
  DependencyType,
  AddDependencyResult,
  CycleDetectionResult,
} from "../../types/dependency.types";
import type {
  AddDependencyParams,
  DeleteDependencyParams,
} from "../../types/command.types";
import { CommandType } from "../../types/command.types";
import { useTaskStore } from "./taskSlice";
import { useHistoryStore } from "./historySlice";
import { useFileStore } from "./fileSlice";
import { wouldCreateCycle } from "../../utils/graph/cycleDetection";
import { calculateDateAdjustments } from "../../utils/graph/datePropagation";

/**
 * Dependency state interface.
 */
interface DependencyState {
  dependencies: Dependency[];
  selectedDependencyId: string | null;
}

/**
 * Dependency actions interface.
 */
interface DependencyActions {
  // CRUD operations
  addDependency: (
    fromTaskId: string,
    toTaskId: string,
    type?: DependencyType,
    lag?: number
  ) => AddDependencyResult;
  removeDependency: (id: string) => void;
  updateDependency: (id: string, updates: Partial<Dependency>) => void;

  // Bulk operations
  setDependencies: (dependencies: Dependency[]) => void;
  clearDependencies: () => void;
  removeDependenciesForTask: (taskId: string) => Dependency[];

  // Selection
  selectDependency: (id: string | null) => void;

  // Queries
  getDependenciesForTask: (taskId: string) => {
    predecessors: Dependency[];
    successors: Dependency[];
  };
  getDependencyById: (id: string) => Dependency | undefined;
  hasDependency: (fromTaskId: string, toTaskId: string) => boolean;

  // Validation
  checkWouldCreateCycle: (
    fromTaskId: string,
    toTaskId: string
  ) => CycleDetectionResult;
}

/**
 * Combined store interface.
 */
type DependencyStore = DependencyState & DependencyActions;

/**
 * Dependency store hook with immer middleware.
 */
export const useDependencyStore = create<DependencyStore>()(
  immer((set, get) => ({
    // State
    dependencies: [],
    selectedDependencyId: null,

    // Actions
    addDependency: (
      fromTaskId: string,
      toTaskId: string,
      type: DependencyType = "FS",
      lag: number = 0
    ): AddDependencyResult => {
      const historyStore = useHistoryStore.getState();
      const taskStore = useTaskStore.getState();
      const fileStore = useFileStore.getState();

      // Validation: Can't depend on self
      if (fromTaskId === toTaskId) {
        return { success: false, error: "Task cannot depend on itself" };
      }

      // Validation: Check tasks exist
      const fromTask = taskStore.tasks.find((t) => t.id === fromTaskId);
      const toTask = taskStore.tasks.find((t) => t.id === toTaskId);
      if (!fromTask || !toTask) {
        return { success: false, error: "One or both tasks not found" };
      }

      // Validation: Check for duplicate
      if (get().hasDependency(fromTaskId, toTaskId)) {
        return { success: false, error: "Dependency already exists" };
      }

      // Validation: Check for cycle
      const cycleCheck = get().checkWouldCreateCycle(fromTaskId, toTaskId);
      if (cycleCheck.hasCycle) {
        const taskNames =
          cycleCheck.cyclePath?.map((id) => {
            const task = taskStore.tasks.find((t) => t.id === id);
            return task?.name || id;
          }) || [];
        return {
          success: false,
          error: `Would create circular dependency: ${taskNames.join(" → ")}`,
        };
      }

      // Create dependency
      const newDependency: Dependency = {
        id: crypto.randomUUID(),
        fromTaskId,
        toTaskId,
        type,
        lag,
        createdAt: new Date().toISOString(),
      };

      // Add to state
      set((state) => {
        state.dependencies.push(newDependency);
      });

      // Calculate date adjustments
      const dateAdjustments = calculateDateAdjustments(
        taskStore.tasks,
        [...get().dependencies],
        fromTaskId
      );

      // Apply date adjustments
      for (const adj of dateAdjustments) {
        taskStore.updateTask(adj.taskId, {
          startDate: adj.newStartDate,
          endDate: adj.newEndDate,
        });
      }

      // Record to history
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.ADD_DEPENDENCY,
          timestamp: Date.now(),
          description: `Created dependency: ${fromTask.name} → ${toTask.name}`,
          params: {
            dependency: newDependency,
            dateAdjustments,
          } as AddDependencyParams,
        });
      }

      // Mark file as dirty
      fileStore.markDirty();

      return {
        success: true,
        dependency: newDependency,
        dateAdjustments,
      };
    },

    removeDependency: (id: string) => {
      const historyStore = useHistoryStore.getState();
      const taskStore = useTaskStore.getState();
      const fileStore = useFileStore.getState();

      const dependency = get().dependencies.find((d) => d.id === id);
      if (!dependency) return;

      const fromTask = taskStore.tasks.find(
        (t) => t.id === dependency.fromTaskId
      );
      const toTask = taskStore.tasks.find((t) => t.id === dependency.toTaskId);

      // Remove from state
      set((state) => {
        state.dependencies = state.dependencies.filter((d) => d.id !== id);
        // Clear selection if deleted
        if (state.selectedDependencyId === id) {
          state.selectedDependencyId = null;
        }
      });

      // Record to history
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.DELETE_DEPENDENCY,
          timestamp: Date.now(),
          description: `Removed dependency: ${fromTask?.name || "?"} → ${toTask?.name || "?"}`,
          params: {
            dependency,
          } as DeleteDependencyParams,
        });
      }

      // Mark file as dirty
      fileStore.markDirty();
    },

    updateDependency: (id: string, updates: Partial<Dependency>) => {
      const historyStore = useHistoryStore.getState();
      const fileStore = useFileStore.getState();

      const dependency = get().dependencies.find((d) => d.id === id);
      if (!dependency) return;

      const previousValues: Partial<Dependency> = {};
      for (const key of Object.keys(updates) as Array<keyof Dependency>) {
        previousValues[key] = dependency[key] as never;
      }

      set((state) => {
        const idx = state.dependencies.findIndex((d) => d.id === id);
        if (idx !== -1) {
          state.dependencies[idx] = { ...state.dependencies[idx], ...updates };
        }
      });

      // Record to history
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.UPDATE_DEPENDENCY,
          timestamp: Date.now(),
          description: "Updated dependency",
          params: {
            id,
            updates,
            previousValues,
          },
        });
      }

      // Mark file as dirty
      fileStore.markDirty();
    },

    setDependencies: (dependencies: Dependency[]) => {
      set((state) => {
        state.dependencies = dependencies;
      });
    },

    clearDependencies: () => {
      set((state) => {
        state.dependencies = [];
        state.selectedDependencyId = null;
      });
    },

    removeDependenciesForTask: (taskId: string): Dependency[] => {
      const toRemove = get().dependencies.filter(
        (d) => d.fromTaskId === taskId || d.toTaskId === taskId
      );

      if (toRemove.length > 0) {
        set((state) => {
          state.dependencies = state.dependencies.filter(
            (d) => d.fromTaskId !== taskId && d.toTaskId !== taskId
          );
          // Clear selection if removed
          if (
            state.selectedDependencyId &&
            toRemove.some((d) => d.id === state.selectedDependencyId)
          ) {
            state.selectedDependencyId = null;
          }
        });

        // Mark file as dirty
        useFileStore.getState().markDirty();
      }

      return toRemove;
    },

    selectDependency: (id: string | null) => {
      set((state) => {
        state.selectedDependencyId = id;
      });
    },

    getDependenciesForTask: (taskId: string) => {
      const deps = get().dependencies;
      return {
        predecessors: deps.filter((d) => d.toTaskId === taskId),
        successors: deps.filter((d) => d.fromTaskId === taskId),
      };
    },

    getDependencyById: (id: string) => {
      return get().dependencies.find((d) => d.id === id);
    },

    hasDependency: (fromTaskId: string, toTaskId: string) => {
      return get().dependencies.some(
        (d) => d.fromTaskId === fromTaskId && d.toTaskId === toTaskId
      );
    },

    checkWouldCreateCycle: (
      fromTaskId: string,
      toTaskId: string
    ): CycleDetectionResult => {
      return wouldCreateCycle(get().dependencies, fromTaskId, toTaskId);
    },
  }))
);

/**
 * Helper function to show dependency-related toasts.
 */
export function showDependencyToast(
  result: AddDependencyResult,
  fromTaskName: string,
  toTaskName: string
): void {
  if (result.success) {
    let message = `Dependency created: ${fromTaskName} → ${toTaskName}`;
    if (result.dateAdjustments && result.dateAdjustments.length > 0) {
      const task = useTaskStore
        .getState()
        .tasks.find((t) => t.id === result.dateAdjustments![0].taskId);
      message += `. ${task?.name || "Task"} shifted to ${result.dateAdjustments[0].newStartDate}`;
    }
    toast.success(message);
  } else {
    toast.error(result.error || "Failed to create dependency");
  }
}
