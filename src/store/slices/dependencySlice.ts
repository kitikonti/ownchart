/**
 * Dependency slice for Zustand store.
 * Manages task dependencies with CRUD operations, validation, and date propagation.
 * Sprint 1.4 - Dependencies (Finish-to-Start Only)
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Dependency,
  DependencyType,
  DependencyUpdatableFields,
  AddDependencyResult,
  CycleDetectionResult,
} from "@/types/dependency.types";
import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import { CommandType } from "@/types/command.types";
import { useTaskStore } from "./taskSlice";
import { useHistoryStore } from "./historySlice";
import { useChartStore } from "./chartSlice";
import { useFileStore } from "./fileSlice";
import { wouldCreateCycle } from "@/utils/graph/cycleDetection";
import {
  propagateDateChanges,
  applyDateAdjustments,
} from "@/utils/graph/dateAdjustment";
import type { WorkingDaysContext } from "@/utils/workingDaysCalculator";
import { recalculateSummaryAncestors } from "@/utils/hierarchy";
import type { DateAdjustment } from "@/types/dependency.types";
import toast from "react-hot-toast";

/**
 * Validates whether a new dependency can be created.
 * Checks self-dependency, task existence, duplicates, and cycles.
 */
function validateNewDependency(
  fromTaskId: TaskId,
  toTaskId: TaskId,
  tasks: Task[],
  dependencies: Dependency[]
):
  | { valid: true; fromTask: Task; toTask: Task }
  | { valid: false; error: string } {
  if (fromTaskId === toTaskId) {
    return { valid: false, error: "Task cannot depend on itself" };
  }

  const fromTask = tasks.find((t) => t.id === fromTaskId);
  const toTask = tasks.find((t) => t.id === toTaskId);
  if (!fromTask || !toTask) {
    return { valid: false, error: "One or both tasks not found" };
  }

  if (
    dependencies.some(
      (d) => d.fromTaskId === fromTaskId && d.toTaskId === toTaskId
    )
  ) {
    return { valid: false, error: "Dependency already exists" };
  }

  const cycleCheck = wouldCreateCycle(dependencies, fromTaskId, toTaskId);
  if (cycleCheck.hasCycle) {
    const taskNames =
      cycleCheck.cyclePath?.map((id) => {
        const task = tasks.find((t) => t.id === id);
        return task?.name || id;
      }) || [];
    return {
      valid: false,
      error: `Would create circular dependency: ${taskNames.join(" → ")}`,
    };
  }

  return { valid: true, fromTask, toTask };
}

/**
 * Build the working-days context from chartSlice. Lives here (rather than
 * shared) because three slices need it and the alternative — a chartSlice
 * selector — would force callers to import from yet another module. The
 * shape is identical in dependencySlice / taskSlice / useTaskBarInteraction.
 */
function getWorkingDaysContext(): WorkingDaysContext {
  const { workingDaysMode, workingDaysConfig, holidayRegion } =
    useChartStore.getState();
  return {
    enabled: workingDaysMode,
    config: workingDaysConfig,
    holidayRegion: workingDaysConfig.excludeHolidays
      ? holidayRegion
      : undefined,
  };
}

/**
 * Apply a list of date adjustments to the task store and emit a toast.
 * Centralised so updateDependency / addDependency / and the panel-edit path
 * all touch the store the same way and follow the same parent-recalc rule.
 */
function commitDateAdjustments(adjustments: DateAdjustment[]): void {
  if (adjustments.length === 0) return;
  useTaskStore.setState((state) => {
    const parentIds = applyDateAdjustments(adjustments, state.tasks);
    if (parentIds.size > 0) {
      recalculateSummaryAncestors(state.tasks, parentIds);
    }
  });
  toast(`Adjusted ${adjustments.length} task(s)`);
}

/**
 * Dependency state interface.
 */
interface DependencyState {
  dependencies: Dependency[];
  selectedDependencyId: string | null;
  /** Screen-space position for the properties panel (set on arrow click). */
  panelPosition: { x: number; y: number } | null;
}

/**
 * Dependency actions interface.
 */
interface DependencyActions {
  // CRUD operations
  addDependency: (
    fromTaskId: TaskId,
    toTaskId: TaskId,
    type?: DependencyType,
    lag?: number
  ) => AddDependencyResult;
  removeDependency: (id: string) => void;
  updateDependency: (id: string, updates: DependencyUpdatableFields) => void;

  // Bulk operations
  setDependencies: (dependencies: Dependency[]) => void;
  clearDependencies: () => void;
  removeDependenciesForTask: (taskId: TaskId) => Dependency[];

  // Selection
  selectDependency: (
    id: string | null,
    position?: { x: number; y: number }
  ) => void;

  // Queries
  getDependenciesForTask: (taskId: TaskId) => {
    predecessors: Dependency[];
    successors: Dependency[];
  };
  getDependencyById: (id: string) => Dependency | undefined;
  hasDependency: (fromTaskId: TaskId, toTaskId: TaskId) => boolean;

  // Validation
  checkWouldCreateCycle: (
    fromTaskId: TaskId,
    toTaskId: TaskId
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
    panelPosition: null,

    // Actions
    addDependency: (
      fromTaskId: TaskId,
      toTaskId: TaskId,
      type: DependencyType = "FS",
      lag: number = 0
    ): AddDependencyResult => {
      const historyStore = useHistoryStore.getState();
      const taskStore = useTaskStore.getState();
      const fileStore = useFileStore.getState();

      const validation = validateNewDependency(
        fromTaskId,
        toTaskId,
        taskStore.tasks,
        get().dependencies
      );
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const newDependency: Dependency = {
        id: crypto.randomUUID(),
        fromTaskId,
        toTaskId,
        type,
        lag,
        createdAt: new Date().toISOString(),
      };

      set((state) => {
        state.dependencies.push(newDependency);
      });

      // Auto-scheduling: propagate date constraints to successors
      let dateAdjustments: DateAdjustment[] = [];
      if (useChartStore.getState().autoScheduling) {
        dateAdjustments = propagateDateChanges(
          taskStore.tasks,
          get().dependencies,
          [fromTaskId],
          { workingDays: getWorkingDaysContext() }
        );
        commitDateAdjustments(dateAdjustments);
      }

      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.ADD_DEPENDENCY,
          timestamp: Date.now(),
          description: `Created dependency: ${validation.fromTask.name} → ${validation.toTask.name}`,
          params: {
            dependency: newDependency,
            dateAdjustments,
          },
        });
      }

      fileStore.markDirty();

      return { success: true, dependency: newDependency };
    },

    removeDependency: (id: string): void => {
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
          state.panelPosition = null;
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
          },
        });
      }

      // Mark file as dirty
      fileStore.markDirty();
    },

    updateDependency: (
      id: string,
      updates: DependencyUpdatableFields
    ): void => {
      const historyStore = useHistoryStore.getState();
      const fileStore = useFileStore.getState();

      const dependency = get().dependencies.find((d) => d.id === id);
      if (!dependency) return;

      const previousValues: DependencyUpdatableFields = {};
      if ("type" in updates) previousValues.type = dependency.type;
      if ("lag" in updates) previousValues.lag = dependency.lag;

      set((state) => {
        const idx = state.dependencies.findIndex((d) => d.id === id);
        if (idx !== -1) {
          Object.assign(state.dependencies[idx], updates);
        }
      });

      // Panel edits (lag/type changes) ALWAYS enforce constraints — the user
      // explicitly changed the relationship, so the successor must move to
      // match. We propagate bidirectionally from the predecessor so the
      // successor (and its downstream chain) snap to the new constraint.
      // The previous `enforceDepConstraint` post-processor is gone — all
      // working-days-aware math now lives in propagateDateChanges via the
      // workingDays context (#82 stage 3).
      let dateAdjustments: DateAdjustment[] = [];
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        const taskStore = useTaskStore.getState();
        const updatedDep = get().dependencies.find((d) => d.id === id);
        if (updatedDep) {
          dateAdjustments = propagateDateChanges(
            taskStore.tasks,
            get().dependencies,
            [updatedDep.fromTaskId],
            {
              bidirectional: true,
              workingDays: getWorkingDaysContext(),
            }
          );
          commitDateAdjustments(dateAdjustments);
        }
      }

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
            dateAdjustments,
          },
        });
      }

      // Mark file as dirty
      fileStore.markDirty();
    },

    setDependencies: (dependencies: Dependency[]): void => {
      set((state) => {
        state.dependencies = dependencies;
      });
    },

    clearDependencies: (): void => {
      set((state) => {
        state.dependencies = [];
        state.selectedDependencyId = null;
        state.panelPosition = null;
      });
    },

    /** @internal Called by task deletion — does NOT record history (caller is responsible). */
    removeDependenciesForTask: (taskId: TaskId): Dependency[] => {
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

    selectDependency: (
      id: string | null,
      position?: { x: number; y: number }
    ): void => {
      set((state) => {
        state.selectedDependencyId = id;
        state.panelPosition = id && position ? position : null;
      });
    },

    getDependenciesForTask: (
      taskId: TaskId
    ): { predecessors: Dependency[]; successors: Dependency[] } => {
      const deps = get().dependencies;
      return {
        predecessors: deps.filter((d) => d.toTaskId === taskId),
        successors: deps.filter((d) => d.fromTaskId === taskId),
      };
    },

    getDependencyById: (id: string): Dependency | undefined => {
      return get().dependencies.find((d) => d.id === id);
    },

    hasDependency: (fromTaskId: TaskId, toTaskId: TaskId): boolean => {
      return get().dependencies.some(
        (d) => d.fromTaskId === fromTaskId && d.toTaskId === toTaskId
      );
    },

    checkWouldCreateCycle: (
      fromTaskId: TaskId,
      toTaskId: TaskId
    ): CycleDetectionResult => {
      return wouldCreateCycle(get().dependencies, fromTaskId, toTaskId);
    },
  }))
);
