/**
 * History slice for undo/redo functionality
 * Manages command stacks and provides undo/redo operations
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import toast from "react-hot-toast";
import {
  CommandType,
  type Command,
  type AddTaskParams,
  type UpdateTaskParams,
  type DeleteTaskParams,
  type IndentOutdentParams,
  type ReorderTasksParams,
  type AddDependencyParams,
  type DeleteDependencyParams,
  type UpdateDependencyParams,
  type PasteRowsParams,
  type PasteCellParams,
  type MultiDragTasksParams,
  type ApplyColorsToManualParams,
  type GroupTasksParams,
  type UngroupTasksParams,
  type HideTasksParams,
  type UnhideTasksParams,
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

interface StackActionConfig {
  sourceStack: "undoStack" | "redoStack";
  destStack: "undoStack" | "redoStack";
  activeFlag: "isUndoing" | "isRedoing";
  executor: (command: Command) => void;
  emoji: string;
  actionName: string;
}

function executeStackAction(
  get: () => HistoryStore,
  set: (fn: (state: HistoryState) => void) => void,
  config: StackActionConfig
): void {
  const stack = get()[config.sourceStack];
  if (stack.length === 0) {
    toast(`Nothing to ${config.actionName.toLowerCase()}`, { icon: "ℹ️" });
    return;
  }

  const command = stack[stack.length - 1];

  set((state) => {
    state[config.activeFlag] = true;
  });

  try {
    config.executor(command);

    set((state) => {
      const cmd = state[config.sourceStack].pop();
      if (cmd) {
        state[config.destStack].push(cmd);
      }
    });

    if (!NON_DATA_COMMANDS.has(command.type)) {
      useFileStore.getState().markDirty();
    }

    toast.success(`${config.emoji} ${command.description}`);
  } catch (error) {
    // Remove the broken command so subsequent undo/redo can proceed
    set((state) => {
      state[config.sourceStack].pop();
    });
    console.error(`${config.actionName} failed:`, error);
    toast.error(
      `${config.actionName} failed. Please refresh the page if issues persist.`
    );
  } finally {
    set((state) => {
      state[config.activeFlag] = false;
    });
  }
}

// Command types that don't modify persisted data (clipboard snapshots, selection state)
const NON_DATA_COMMANDS = new Set([
  CommandType.COPY_ROWS,
  CommandType.CUT_ROWS,
  CommandType.COPY_CELL,
  CommandType.CUT_CELL,
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

    undo: (): void =>
      executeStackAction(get, set, {
        sourceStack: "undoStack",
        destStack: "redoStack",
        activeFlag: "isUndoing",
        executor: executeUndoCommand,
        emoji: "↶",
        actionName: "Undo",
      }),

    redo: (): void =>
      executeStackAction(get, set, {
        sourceStack: "redoStack",
        destStack: "undoStack",
        activeFlag: "isRedoing",
        executor: executeRedoCommand,
        emoji: "↷",
        actionName: "Redo",
      }),

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

function getTasksCopy(): Task[] {
  return useTaskStore.getState().tasks.map((t) => ({ ...t }));
}

function assertNever(x: never): never {
  throw new Error(`Unhandled command type: ${(x as Command).type}`);
}

function applyCascadePreviousValues(
  taskMap: Map<string, Task>,
  cascades: ReadonlyArray<{ id: string; previousValues: Partial<Task> }>
): void {
  for (const cascade of cascades) {
    const task = taskMap.get(cascade.id);
    if (task) {
      Object.assign(task, cascade.previousValues);
    }
  }
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
  if (params.mode === "batch") {
    const idsToRemove = new Set(params.generatedIds);
    const currentTasks = useTaskStore.getState().tasks;
    const filtered = currentTasks
      .filter((t) => !idsToRemove.has(t.id))
      .map((t) => ({ ...t }));
    for (let i = 0; i < filtered.length; i++) {
      filtered[i].order = i;
    }
    useTaskStore.setState({ tasks: filtered });
  } else {
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
  const restoredTasks = [
    ...getTasksCopy(),
    ...params.deletedTasks.map((t) => ({ ...t })),
  ];

  if (params.cascadeUpdates) {
    applyCascadePreviousValues(
      buildTaskMap(restoredTasks),
      params.cascadeUpdates
    );
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
  const currentTasks = getTasksCopy();
  const taskMap = buildTaskMap(currentTasks);

  applySnapshot(taskMap, params.previousTaskSnapshot);

  const affectedParentIds = collectAffectedParents(params.changes);
  recalculateSummaryAncestors(currentTasks, affectedParentIds);

  useTaskStore.setState({ tasks: currentTasks });
}

function undoReorderTasks(params: ReorderTasksParams): void {
  const currentTasks = getTasksCopy();
  const taskMap = buildTaskMap(currentTasks);

  applySnapshot(taskMap, params.previousOrder);

  const affectedParentIds = new Set<string>();
  for (const entry of params.previousOrder) {
    if (entry.parent) affectedParentIds.add(entry.parent);
  }
  recalculateSummaryAncestors(currentTasks, affectedParentIds);

  useTaskStore.setState({ tasks: currentTasks });
}

function undoAddDependency(params: AddDependencyParams): void {
  useDependencyStore.getState().removeDependency(params.dependency.id);

  if (params.dateAdjustments.length > 0) {
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

  applyCascadePreviousValues(taskMap, params.cascadeUpdates);

  useTaskStore.setState({ tasks: currentTasks });
}

function undoUngroupTasks(params: UngroupTasksParams): void {
  const currentTasks = getTasksCopy();

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

  applyCascadePreviousValues(taskMap, params.cascadeUpdates);

  useTaskStore.setState({ tasks: currentTasks });
}

function undoHideStateChange(params: {
  previousHiddenTaskIds: string[];
}): void {
  useChartStore.getState().setHiddenTaskIds(params.previousHiddenTaskIds);
}

// ---------------------------------------------------------------------------
// Redo handlers
// ---------------------------------------------------------------------------

function redoAddTask(params: AddTaskParams): void {
  const newTasks =
    params.mode === "batch"
      ? params.tasks.map((t, i) => ({ ...t, id: params.generatedIds[i] }))
      : [{ ...params.task, id: params.generatedId }];

  const allTasks = [...getTasksCopy(), ...newTasks];
  allTasks.sort((a, b) => a.order - b.order);
  for (let i = 0; i < allTasks.length; i++) allTasks[i].order = i;
  useTaskStore.setState({ tasks: allTasks });
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
  const idsToDelete = new Set(params.deletedIds);

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
    .tasks.filter((t) => !idsToDelete.has(t.id))
    .map((t) => ({ ...t }));

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
  const currentTasks = getTasksCopy();
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

  if (params.dateAdjustments.length > 0) {
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
  useChartStore
    .getState()
    .setColorModeState({ ...params.previousColorModeState, mode: "manual" });
}

function redoGroupTasks(params: GroupTasksParams): void {
  const currentTasks = getTasksCopy();
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
  const currentTasks = getTasksCopy();
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
    case CommandType.ADD_TASK:
      return undoAddTask(command.params);
    case CommandType.UPDATE_TASK:
      return undoUpdateTask(command.params);
    case CommandType.DELETE_TASK:
      return undoDeleteTask(command.params);
    case CommandType.INDENT_TASKS:
    case CommandType.OUTDENT_TASKS:
      return undoIndentOutdent(command.params);
    case CommandType.REORDER_TASKS:
      return undoReorderTasks(command.params);
    case CommandType.ADD_DEPENDENCY:
      return undoAddDependency(command.params);
    case CommandType.DELETE_DEPENDENCY:
      return undoDeleteDependency(command.params);
    case CommandType.UPDATE_DEPENDENCY:
      return undoUpdateDependency(command.params);
    case CommandType.COPY_ROWS:
    case CommandType.CUT_ROWS:
    case CommandType.COPY_CELL:
    case CommandType.CUT_CELL:
      return;
    case CommandType.PASTE_ROWS:
      return undoPasteRows(command.params);
    case CommandType.PASTE_CELL:
      return undoPasteCell(command.params);
    case CommandType.MULTI_DRAG_TASKS:
      return undoMultiDragTasks(command.params);
    case CommandType.APPLY_COLORS_TO_MANUAL:
      return undoApplyColorsToManual(command.params);
    case CommandType.GROUP_TASKS:
      return undoGroupTasks(command.params);
    case CommandType.UNGROUP_TASKS:
      return undoUngroupTasks(command.params);
    case CommandType.HIDE_TASKS:
      return undoHideStateChange(command.params);
    case CommandType.UNHIDE_TASKS:
      return undoHideStateChange(command.params);
    default:
      return assertNever(command);
  }
}

function executeRedoCommand(command: Command): void {
  switch (command.type) {
    case CommandType.ADD_TASK:
      return redoAddTask(command.params);
    case CommandType.UPDATE_TASK:
      return redoUpdateTask(command.params);
    case CommandType.DELETE_TASK:
      return redoDeleteTask(command.params);
    case CommandType.INDENT_TASKS:
    case CommandType.OUTDENT_TASKS:
      return redoIndentOutdent(command.params);
    case CommandType.REORDER_TASKS:
      return redoReorderTasks(command.params);
    case CommandType.ADD_DEPENDENCY:
      return redoAddDependency(command.params);
    case CommandType.DELETE_DEPENDENCY:
      return redoDeleteDependency(command.params);
    case CommandType.UPDATE_DEPENDENCY:
      return redoUpdateDependency(command.params);
    case CommandType.COPY_ROWS:
    case CommandType.CUT_ROWS:
    case CommandType.COPY_CELL:
    case CommandType.CUT_CELL:
      return;
    case CommandType.PASTE_ROWS:
      return redoPasteRows(command.params);
    case CommandType.PASTE_CELL:
      return redoPasteCell(command.params);
    case CommandType.MULTI_DRAG_TASKS:
      return redoMultiDragTasks(command.params);
    case CommandType.APPLY_COLORS_TO_MANUAL:
      return redoApplyColorsToManual(command.params);
    case CommandType.GROUP_TASKS:
      return redoGroupTasks(command.params);
    case CommandType.UNGROUP_TASKS:
      return redoUngroupTasks(command.params);
    case CommandType.HIDE_TASKS:
      return redoHideTasks(command.params);
    case CommandType.UNHIDE_TASKS:
      return redoUnhideTasks(command.params);
    default:
      return assertNever(command);
  }
}
