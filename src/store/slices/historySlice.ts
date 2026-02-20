/**
 * History slice for undo/redo functionality
 * Manages command stacks and provides undo/redo operations
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import toast from "react-hot-toast";
import type {
  Command,
  AddTaskParams,
  UpdateTaskParams,
  DeleteTaskParams,
  IndentOutdentParams,
  ReorderTasksParams,
  AddDependencyParams,
  DeleteDependencyParams,
  UpdateDependencyParams,
  PasteRowsParams,
  PasteCellParams,
  MultiDragTasksParams,
  ApplyColorsToManualParams,
  GroupTasksParams,
  UngroupTasksParams,
  HideTasksParams,
  UnhideTasksParams,
} from "../../types/command.types";
import type { Task } from "../../types/chart.types";
import type { Dependency } from "../../types/dependency.types";
import { calculateDuration } from "../../utils/dateUtils";
import { useTaskStore } from "./taskSlice";
import { useDependencyStore } from "./dependencySlice";
import { useChartStore } from "./chartSlice";
import { useFileStore } from "./fileSlice";
import {
  recalculateSummaryAncestors,
  normalizeTaskOrder,
} from "../../utils/hierarchy";

interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  isUndoing: boolean;
  isRedoing: boolean;
}

interface HistoryActions {
  undo: () => void;
  redo: () => void;
  recordCommand: (command: Command) => void;
  clearHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
  setUndoing: (value: boolean) => void;
  setRedoing: (value: boolean) => void;
}

type HistoryStore = HistoryState & HistoryActions;

const MAX_STACK_SIZE = 100;

// Command types that don't modify persisted data (clipboard snapshots, selection state)
const NON_DATA_COMMANDS = new Set([
  "copyRows",
  "cutRows",
  "copyCell",
  "cutCell",
]);

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    undoStack: [],
    redoStack: [],
    isUndoing: false,
    isRedoing: false,

    recordCommand: (command): void => {
      set((state) => {
        if (state.isUndoing || state.isRedoing) return;
        state.undoStack.push(command);
        state.redoStack = [];
        if (state.undoStack.length > MAX_STACK_SIZE) {
          state.undoStack.shift();
        }
      });
    },

    undo: (): void => {
      const { undoStack } = get();
      if (undoStack.length === 0) {
        toast("Nothing to undo", { icon: "ℹ️" });
        return;
      }

      const command = undoStack[undoStack.length - 1];

      set((state) => {
        state.isUndoing = true;
      });

      try {
        executeUndoCommand(command);

        set((state) => {
          const cmd = state.undoStack.pop();
          if (cmd) {
            state.redoStack.push(cmd);
          }
        });

        if (!NON_DATA_COMMANDS.has(command.type)) {
          useFileStore.getState().markDirty();
        }

        toast.success(`↶ ${command.description}`);
      } catch (error) {
        console.error("Undo failed:", error);
        toast.error("Undo failed. Please refresh the page if issues persist.");
      } finally {
        set((state) => {
          state.isUndoing = false;
        });
      }
    },

    redo: (): void => {
      const { redoStack } = get();
      if (redoStack.length === 0) {
        toast("Nothing to redo", { icon: "ℹ️" });
        return;
      }

      const command = redoStack[redoStack.length - 1];

      set((state) => {
        state.isRedoing = true;
      });

      try {
        executeRedoCommand(command);

        set((state) => {
          const cmd = state.redoStack.pop();
          if (cmd) {
            state.undoStack.push(cmd);
          }
        });

        if (!NON_DATA_COMMANDS.has(command.type)) {
          useFileStore.getState().markDirty();
        }

        toast.success(`↷ ${command.description}`);
      } catch (error) {
        console.error("Redo failed:", error);
        toast.error("Redo failed. Please refresh the page if issues persist.");
      } finally {
        set((state) => {
          state.isRedoing = false;
        });
      }
    },

    clearHistory: (): void => {
      set((state) => {
        state.undoStack = [];
        state.redoStack = [];
      });
    },

    canUndo: (): boolean => get().undoStack.length > 0,
    canRedo: (): boolean => get().redoStack.length > 0,

    getUndoDescription: (): string | null => {
      const { undoStack } = get();
      return undoStack.length > 0
        ? undoStack[undoStack.length - 1].description
        : null;
    },

    getRedoDescription: (): string | null => {
      const { redoStack } = get();
      return redoStack.length > 0
        ? redoStack[redoStack.length - 1].description
        : null;
    },

    setUndoing: (value): void =>
      set((state) => {
        state.isUndoing = value;
      }),
    setRedoing: (value): void =>
      set((state) => {
        state.isRedoing = value;
      }),
  }))
);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildTaskMap(tasks: Task[]): Map<string, Task> {
  return new Map(tasks.map((t) => [t.id, t]));
}

function applySnapshot(
  taskMap: Map<string, Task>,
  snapshot: ReadonlyArray<{
    id: string;
    parent: string | undefined;
    order: number;
  }>
): void {
  for (const entry of snapshot) {
    const task = taskMap.get(entry.id);
    if (task) {
      task.parent = entry.parent;
      task.order = entry.order;
    }
  }
}

function collectAffectedParents(
  changes: ReadonlyArray<{
    oldParent?: string | undefined;
    newParent?: string | undefined;
  }>
): Set<string> {
  const ids = new Set<string>();
  for (const change of changes) {
    if (change.oldParent) ids.add(change.oldParent);
    if (change.newParent) ids.add(change.newParent);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Undo handlers
// ---------------------------------------------------------------------------

function undoAddTask(params: AddTaskParams): void {
  if (params.generatedIds && params.generatedIds.length > 0) {
    const idsToRemove = new Set(params.generatedIds);
    const currentTasks = useTaskStore.getState().tasks;
    const filtered = currentTasks
      .filter((t) => !idsToRemove.has(t.id))
      .map((t) => ({ ...t }));
    for (let i = 0; i < filtered.length; i++) {
      filtered[i].order = i;
    }
    useTaskStore.setState({ tasks: filtered });
  } else if (params.generatedId) {
    useTaskStore.getState().deleteTask(params.generatedId, false);
  }
}

function undoUpdateTask(params: UpdateTaskParams): void {
  const taskStore = useTaskStore.getState();
  taskStore.updateTask(params.id, params.previousValues);

  if (params.cascadeUpdates) {
    for (const cascade of params.cascadeUpdates) {
      taskStore.updateTask(cascade.id, cascade.previousValues);
    }
  }
}

function undoDeleteTask(params: DeleteTaskParams): void {
  const currentTasks = useTaskStore.getState().tasks;
  const restoredTasks = [...currentTasks, ...params.deletedTasks];

  if (params.cascadeUpdates) {
    for (const cascade of params.cascadeUpdates) {
      const parentIndex = restoredTasks.findIndex((t) => t.id === cascade.id);
      if (parentIndex !== -1) {
        restoredTasks[parentIndex] = {
          ...restoredTasks[parentIndex],
          ...cascade.previousValues,
        };
      }
    }
  }

  useTaskStore.setState({ tasks: restoredTasks });

  if (params.deletedDependencies?.length) {
    const depStore = useDependencyStore.getState();
    useDependencyStore.setState({
      dependencies: [...depStore.dependencies, ...params.deletedDependencies],
    });
  }
}

function undoIndentOutdent(params: IndentOutdentParams): void {
  const currentTasks = useTaskStore.getState().tasks.map((t) => ({ ...t }));
  const taskMap = buildTaskMap(currentTasks);

  applySnapshot(taskMap, params.previousTaskSnapshot);

  const affectedParentIds = collectAffectedParents(params.changes);
  recalculateSummaryAncestors(currentTasks, affectedParentIds);

  useTaskStore.setState({ tasks: currentTasks });
}

function undoReorderTasks(params: ReorderTasksParams): void {
  const currentTasks = useTaskStore.getState().tasks.map((t) => ({ ...t }));
  const taskMap = buildTaskMap(currentTasks);

  applySnapshot(taskMap, params.previousOrder);

  const affectedParentIds = new Set<string>();
  for (const t of currentTasks) {
    if (t.parent) affectedParentIds.add(t.parent);
  }
  recalculateSummaryAncestors(currentTasks, affectedParentIds);

  useTaskStore.setState({ tasks: currentTasks });
}

function undoAddDependency(params: AddDependencyParams): void {
  useDependencyStore.getState().removeDependency(params.dependency.id);

  if (params.dateAdjustments) {
    const taskStore = useTaskStore.getState();
    for (const adj of params.dateAdjustments) {
      taskStore.updateTask(adj.taskId, {
        startDate: adj.oldStartDate,
        endDate: adj.oldEndDate,
      });
    }
  }
}

function undoDeleteDependency(params: DeleteDependencyParams): void {
  const depStore = useDependencyStore.getState();
  useDependencyStore.setState({
    dependencies: [...depStore.dependencies, params.dependency],
  });
}

function undoUpdateDependency(params: UpdateDependencyParams): void {
  const depStore = useDependencyStore.getState();
  const deps = depStore.dependencies.map((d) =>
    d.id === params.id ? { ...d, ...params.previousValues } : d
  );
  useDependencyStore.setState({ dependencies: deps });
}

function undoPasteRows(params: PasteRowsParams): void {
  const depStore = useDependencyStore.getState();
  const currentTasks = useTaskStore.getState().tasks;
  const pastedTaskIds = new Set(params.pastedTasks.map((t) => t.id));
  let tasksWithoutPasted = currentTasks
    .filter((t) => !pastedTaskIds.has(t.id))
    .map((t) => ({ ...t }));

  if (params.deletedTasks && params.deletedTasks.length > 0) {
    tasksWithoutPasted = [
      ...tasksWithoutPasted,
      ...params.deletedTasks.map((t) => ({ ...t })),
    ];
  }

  for (let i = 0; i < tasksWithoutPasted.length; i++) {
    tasksWithoutPasted[i].order = i;
  }

  useTaskStore.setState({ tasks: tasksWithoutPasted });

  const pastedDepIds = new Set(params.pastedDependencies.map((d) => d.id));
  const depsWithoutPasted = depStore.dependencies.filter(
    (d) => !pastedDepIds.has(d.id)
  );
  useDependencyStore.setState({ dependencies: depsWithoutPasted });
}

function undoPasteCell(params: PasteCellParams): void {
  const taskStore = useTaskStore.getState();

  taskStore.updateTask(params.taskId, {
    [params.field]: params.previousValue,
  });

  if (params.previousCutCell) {
    taskStore.updateTask(params.previousCutCell.taskId, {
      [params.previousCutCell.field]: params.previousCutCell.value,
    });
  }
}

function undoMultiDragTasks(params: MultiDragTasksParams): void {
  const taskStore = useTaskStore.getState();

  for (const change of params.taskChanges) {
    taskStore.updateTask(change.id, {
      startDate: change.previousStartDate,
      endDate: change.previousEndDate,
      duration: calculateDuration(
        change.previousStartDate,
        change.previousEndDate
      ),
    });
  }

  for (const cascade of params.cascadeUpdates) {
    taskStore.updateTask(cascade.id, cascade.previousValues);
  }
}

function undoApplyColorsToManual(params: ApplyColorsToManualParams): void {
  const taskStore = useTaskStore.getState();

  useChartStore.getState().setColorModeState(params.previousColorModeState);

  for (const change of params.colorChanges) {
    taskStore.updateTask(change.id, {
      color: change.previousColor,
      colorOverride: change.previousColorOverride,
    });
  }
}

function undoGroupTasks(params: GroupTasksParams): void {
  const currentTasks = useTaskStore
    .getState()
    .tasks.filter((t) => t.id !== params.summaryTaskId)
    .map((t) => ({ ...t }));

  const taskMap = buildTaskMap(currentTasks);

  for (const change of params.changes) {
    const task = taskMap.get(change.taskId);
    if (task) {
      task.parent = change.oldParent;
    }
  }

  for (const orderEntry of params.previousOrder) {
    const task = taskMap.get(orderEntry.id);
    if (task) {
      task.order = orderEntry.order;
    }
  }

  for (const cascade of params.cascadeUpdates) {
    const task = taskMap.get(cascade.id);
    if (task) {
      Object.assign(task, cascade.previousValues);
    }
  }

  useTaskStore.setState({ tasks: currentTasks });
}

function undoUngroupTasks(params: UngroupTasksParams): void {
  const currentTasks = useTaskStore.getState().tasks.map((t) => ({ ...t }));

  // Re-add all deleted summary tasks first
  const allRestoredDeps: Dependency[] = [];
  for (const entry of params.ungroupedSummaries) {
    currentTasks.push({ ...entry.summaryTask });
    allRestoredDeps.push(...entry.removedDependencies);
  }

  // Build map after all summaries are added
  const taskMap = buildTaskMap(currentTasks);

  // Restore children's parents
  for (const entry of params.ungroupedSummaries) {
    for (const change of entry.childChanges) {
      const task = taskMap.get(change.taskId);
      if (task) {
        task.parent = change.oldParent;
      }
    }
  }

  if (allRestoredDeps.length > 0) {
    const depStore = useDependencyStore.getState();
    useDependencyStore.setState({
      dependencies: [...depStore.dependencies, ...allRestoredDeps],
    });
  }

  for (const orderEntry of params.previousOrder) {
    const task = taskMap.get(orderEntry.id);
    if (task) {
      task.order = orderEntry.order;
    }
  }

  for (const cascade of params.cascadeUpdates) {
    const task = taskMap.get(cascade.id);
    if (task) {
      Object.assign(task, cascade.previousValues);
    }
  }

  useTaskStore.setState({ tasks: currentTasks });
}

function undoHideTasks(params: HideTasksParams): void {
  useChartStore.getState().setHiddenTaskIds(params.previousHiddenTaskIds);
}

function undoUnhideTasks(params: UnhideTasksParams): void {
  useChartStore.getState().setHiddenTaskIds(params.previousHiddenTaskIds);
}

// ---------------------------------------------------------------------------
// Redo handlers
// ---------------------------------------------------------------------------

function redoAddTask(params: AddTaskParams): void {
  if (params.tasks && params.generatedIds && params.generatedIds.length > 0) {
    const state = useTaskStore.getState();
    const newTasks = params.tasks.map((t, i) => ({
      ...t,
      id: params.generatedIds![i],
    }));
    const allTasks = [...state.tasks.map((t) => ({ ...t })), ...newTasks];
    allTasks.sort((a, b) => a.order - b.order);
    for (let i = 0; i < allTasks.length; i++) {
      allTasks[i].order = i;
    }
    useTaskStore.setState({ tasks: allTasks });
  } else if (params.generatedId) {
    const taskWithId = { ...params.task, id: params.generatedId };
    const state = useTaskStore.getState();
    const allTasks = [...state.tasks.map((t) => ({ ...t })), taskWithId];
    allTasks.sort((a, b) => a.order - b.order);
    for (let i = 0; i < allTasks.length; i++) {
      allTasks[i].order = i;
    }
    useTaskStore.setState({ tasks: allTasks });
  }
}

function redoUpdateTask(params: UpdateTaskParams): void {
  const taskStore = useTaskStore.getState();
  taskStore.updateTask(params.id, params.updates);

  if (params.cascadeUpdates) {
    for (const cascade of params.cascadeUpdates) {
      taskStore.updateTask(cascade.id, cascade.updates);
    }
  }
}

function redoDeleteTask(params: DeleteTaskParams): void {
  const idsToDelete = new Set(params.deletedIds || [params.id]);

  const affectedParentIds = new Set<string>();
  if (params.deletedTasks) {
    for (const task of params.deletedTasks) {
      if (task.parent && !idsToDelete.has(task.parent)) {
        affectedParentIds.add(task.parent);
      }
    }
  }

  const currentTasks = useTaskStore
    .getState()
    .tasks.filter((t) => !idsToDelete.has(t.id));

  if (affectedParentIds.size > 0) {
    recalculateSummaryAncestors(currentTasks, affectedParentIds);
  }

  useTaskStore.setState({ tasks: currentTasks });

  const depStore = useDependencyStore.getState();
  const cleanedDeps = depStore.dependencies.filter(
    (d) => !idsToDelete.has(d.fromTaskId) && !idsToDelete.has(d.toTaskId)
  );
  useDependencyStore.setState({ dependencies: cleanedDeps });
}

function redoIndentOutdent(params: IndentOutdentParams): void {
  const currentTasks = useTaskStore.getState().tasks.map((t) => ({ ...t }));
  const taskMap = buildTaskMap(currentTasks);

  applySnapshot(taskMap, params.afterTaskSnapshot);

  const affectedParentIds = collectAffectedParents(params.changes);
  recalculateSummaryAncestors(currentTasks, affectedParentIds);

  useTaskStore.setState({ tasks: currentTasks });
}

function redoReorderTasks(params: ReorderTasksParams): void {
  useTaskStore.getState().reorderTasks(params.activeTaskId, params.overTaskId);
}

function redoAddDependency(params: AddDependencyParams): void {
  const depStore = useDependencyStore.getState();
  useDependencyStore.setState({
    dependencies: [...depStore.dependencies, params.dependency],
  });

  if (params.dateAdjustments) {
    const taskStore = useTaskStore.getState();
    for (const adj of params.dateAdjustments) {
      taskStore.updateTask(adj.taskId, {
        startDate: adj.newStartDate,
        endDate: adj.newEndDate,
      });
    }
  }
}

function redoDeleteDependency(params: DeleteDependencyParams): void {
  useDependencyStore.getState().removeDependency(params.dependency.id);
}

function redoUpdateDependency(params: UpdateDependencyParams): void {
  const depStore = useDependencyStore.getState();
  const deps = depStore.dependencies.map((d) =>
    d.id === params.id ? { ...d, ...params.updates } : d
  );
  useDependencyStore.setState({ dependencies: deps });
}

function redoPasteRows(params: PasteRowsParams): void {
  const currentTasks = useTaskStore.getState().tasks;
  let updatedTasks = [
    ...currentTasks.slice(0, params.insertIndex).map((t) => ({ ...t })),
    ...params.pastedTasks.map((t) => ({ ...t })),
    ...currentTasks.slice(params.insertIndex).map((t) => ({ ...t })),
  ];

  if (params.deletedTasks && params.deletedTasks.length > 0) {
    const deletedTaskIds = new Set(params.deletedTasks.map((t) => t.id));
    updatedTasks = updatedTasks.filter((t) => !deletedTaskIds.has(t.id));

    const depsWithoutDeleted = useDependencyStore
      .getState()
      .dependencies.filter(
        (d) =>
          !deletedTaskIds.has(d.fromTaskId) && !deletedTaskIds.has(d.toTaskId)
      );
    useDependencyStore.setState({ dependencies: depsWithoutDeleted });
  }

  for (let i = 0; i < updatedTasks.length; i++) {
    updatedTasks[i].order = i;
  }

  useTaskStore.setState({ tasks: updatedTasks });

  const currentDeps = useDependencyStore.getState().dependencies;
  useDependencyStore.setState({
    dependencies: [...currentDeps, ...params.pastedDependencies],
  });
}

function redoPasteCell(params: PasteCellParams): void {
  const taskStore = useTaskStore.getState();

  taskStore.updateTask(params.taskId, {
    [params.field]: params.newValue,
  });

  if (params.previousCutCell) {
    taskStore.updateTask(params.previousCutCell.taskId, {
      [params.previousCutCell.field]: params.cutClearValue,
    });
  }
}

function redoMultiDragTasks(params: MultiDragTasksParams): void {
  const taskStore = useTaskStore.getState();

  for (const change of params.taskChanges) {
    taskStore.updateTask(change.id, {
      startDate: change.newStartDate,
      endDate: change.newEndDate,
      duration: calculateDuration(change.newStartDate, change.newEndDate),
    });
  }

  for (const cascade of params.cascadeUpdates) {
    taskStore.updateTask(cascade.id, cascade.updates);
  }
}

function redoApplyColorsToManual(params: ApplyColorsToManualParams): void {
  const taskStore = useTaskStore.getState();

  for (const change of params.colorChanges) {
    taskStore.updateTask(change.id, {
      color: change.newColor,
      colorOverride: undefined,
    });
  }
  useChartStore.getState().setColorMode("manual");
}

function redoGroupTasks(params: GroupTasksParams): void {
  const currentTasks = useTaskStore.getState().tasks.map((t) => ({ ...t }));
  currentTasks.push({ ...params.summaryTask });

  const taskMap = buildTaskMap(currentTasks);

  for (const change of params.changes) {
    const task = taskMap.get(change.taskId);
    if (task) {
      task.parent = params.summaryTaskId;
    }
  }

  normalizeTaskOrder(currentTasks);
  const affectedParents = new Set<string>([params.summaryTaskId]);
  if (params.summaryTask.parent) {
    affectedParents.add(params.summaryTask.parent);
  }
  recalculateSummaryAncestors(currentTasks, affectedParents);

  useTaskStore.setState({ tasks: currentTasks });
}

function redoUngroupTasks(params: UngroupTasksParams): void {
  const currentTasks = useTaskStore.getState().tasks.map((t) => ({ ...t }));
  const summaryIds = new Set(
    params.ungroupedSummaries.map((e) => e.summaryTask.id)
  );

  const taskMap = buildTaskMap(currentTasks);

  const allDepIdsToRemove = new Set<string>();
  for (const entry of params.ungroupedSummaries) {
    for (const change of entry.childChanges) {
      const task = taskMap.get(change.taskId);
      if (task) {
        task.parent = entry.summaryTask.parent;
      }
    }

    for (const dep of entry.removedDependencies) {
      allDepIdsToRemove.add(dep.id);
    }
  }

  if (allDepIdsToRemove.size > 0) {
    const depStore = useDependencyStore.getState();
    useDependencyStore.setState({
      dependencies: depStore.dependencies.filter(
        (d) => !allDepIdsToRemove.has(d.id)
      ),
    });
  }

  const filteredTasks = currentTasks.filter((t) => !summaryIds.has(t.id));

  normalizeTaskOrder(filteredTasks);

  const affectedParents = new Set<string>();
  for (const entry of params.ungroupedSummaries) {
    if (entry.summaryTask.parent) {
      affectedParents.add(entry.summaryTask.parent);
    }
  }
  recalculateSummaryAncestors(filteredTasks, affectedParents);

  useTaskStore.setState({ tasks: filteredTasks });
}

function redoHideTasks(params: HideTasksParams): void {
  const newHidden = [
    ...new Set([...params.previousHiddenTaskIds, ...params.taskIds]),
  ];
  useChartStore.getState().setHiddenTaskIds(newHidden);
}

function redoUnhideTasks(params: UnhideTasksParams): void {
  const idsToUnhide = new Set(params.taskIds);
  const newHidden = params.previousHiddenTaskIds.filter(
    (id) => !idsToUnhide.has(id)
  );
  useChartStore.getState().setHiddenTaskIds(newHidden);
}

// ---------------------------------------------------------------------------
// Command dispatchers
// ---------------------------------------------------------------------------

function executeUndoCommand(command: Command): void {
  switch (command.type) {
    case "addTask":
      return undoAddTask(command.params);
    case "updateTask":
      return undoUpdateTask(command.params);
    case "deleteTask":
      return undoDeleteTask(command.params);
    case "indentSelectedTasks":
    case "outdentSelectedTasks":
      return undoIndentOutdent(command.params);
    case "reorderTasks":
      return undoReorderTasks(command.params);
    case "addDependency":
      return undoAddDependency(command.params);
    case "deleteDependency":
      return undoDeleteDependency(command.params);
    case "updateDependency":
      return undoUpdateDependency(command.params);
    case "copyRows":
    case "cutRows":
    case "copyCell":
    case "cutCell":
      return;
    case "pasteRows":
      return undoPasteRows(command.params);
    case "pasteCell":
      return undoPasteCell(command.params);
    case "multiDragTasks":
      return undoMultiDragTasks(command.params);
    case "applyColorsToManual":
      return undoApplyColorsToManual(command.params);
    case "groupTasks":
      return undoGroupTasks(command.params);
    case "ungroupTasks":
      return undoUngroupTasks(command.params);
    case "hideTasks":
      return undoHideTasks(command.params);
    case "unhideTasks":
      return undoUnhideTasks(command.params);
  }
}

function executeRedoCommand(command: Command): void {
  switch (command.type) {
    case "addTask":
      return redoAddTask(command.params);
    case "updateTask":
      return redoUpdateTask(command.params);
    case "deleteTask":
      return redoDeleteTask(command.params);
    case "indentSelectedTasks":
    case "outdentSelectedTasks":
      return redoIndentOutdent(command.params);
    case "reorderTasks":
      return redoReorderTasks(command.params);
    case "addDependency":
      return redoAddDependency(command.params);
    case "deleteDependency":
      return redoDeleteDependency(command.params);
    case "updateDependency":
      return redoUpdateDependency(command.params);
    case "copyRows":
    case "cutRows":
    case "copyCell":
    case "cutCell":
      return;
    case "pasteRows":
      return redoPasteRows(command.params);
    case "pasteCell":
      return redoPasteCell(command.params);
    case "multiDragTasks":
      return redoMultiDragTasks(command.params);
    case "applyColorsToManual":
      return redoApplyColorsToManual(command.params);
    case "groupTasks":
      return redoGroupTasks(command.params);
    case "ungroupTasks":
      return redoUngroupTasks(command.params);
    case "hideTasks":
      return redoHideTasks(command.params);
    case "unhideTasks":
      return redoUnhideTasks(command.params);
  }
}
