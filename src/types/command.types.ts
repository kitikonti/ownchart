/**
 * Command Pattern for Undo/Redo
 * Every user action becomes a serializable command that can be undone/redone
 */

import type { Task } from "./chart.types";
import type { Dependency, DateAdjustment } from "./dependency.types";
import type { ColorModeState } from "./colorMode.types";

interface CommandBase {
  id: string; // UUID for tracking
  timestamp: number; // When executed
  description: string; // Human-readable (e.g., "Created task 'Design'")

  // Optional: For complex commands that need context
  metadata?: Record<string, unknown>;
}

export type Command =
  | (CommandBase & { type: CommandType.ADD_TASK; params: AddTaskParams })
  | (CommandBase & { type: CommandType.UPDATE_TASK; params: UpdateTaskParams })
  | (CommandBase & { type: CommandType.DELETE_TASK; params: DeleteTaskParams })
  | (CommandBase & {
      type: CommandType.REORDER_TASKS;
      params: ReorderTasksParams;
    })
  | (CommandBase & {
      type: CommandType.INDENT_TASKS;
      params: IndentOutdentParams;
    })
  | (CommandBase & {
      type: CommandType.OUTDENT_TASKS;
      params: IndentOutdentParams;
    })
  | (CommandBase & { type: CommandType.GROUP_TASKS; params: GroupTasksParams })
  | (CommandBase & {
      type: CommandType.UNGROUP_TASKS;
      params: UngroupTasksParams;
    })
  | (CommandBase & {
      type: CommandType.ADD_DEPENDENCY;
      params: AddDependencyParams;
    })
  | (CommandBase & {
      type: CommandType.DELETE_DEPENDENCY;
      params: DeleteDependencyParams;
    })
  | (CommandBase & {
      type: CommandType.UPDATE_DEPENDENCY;
      params: UpdateDependencyParams;
    })
  | (CommandBase & { type: CommandType.COPY_ROWS; params: CopyRowsParams })
  | (CommandBase & { type: CommandType.CUT_ROWS; params: CutRowsParams })
  | (CommandBase & { type: CommandType.PASTE_ROWS; params: PasteRowsParams })
  | (CommandBase & { type: CommandType.COPY_CELL; params: CopyCellParams })
  | (CommandBase & { type: CommandType.CUT_CELL; params: CutCellParams })
  | (CommandBase & { type: CommandType.PASTE_CELL; params: PasteCellParams })
  | (CommandBase & {
      type: CommandType.MULTI_DRAG_TASKS;
      params: MultiDragTasksParams;
    })
  | (CommandBase & {
      type: CommandType.APPLY_COLORS_TO_MANUAL;
      params: ApplyColorsToManualParams;
    })
  | (CommandBase & { type: CommandType.HIDE_TASKS; params: HideTasksParams })
  | (CommandBase & {
      type: CommandType.UNHIDE_TASKS;
      params: UnhideTasksParams;
    });

// Type mapping for generic recordCommand helper
export type CommandParamsMap = {
  [CommandType.ADD_TASK]: AddTaskParams;
  [CommandType.UPDATE_TASK]: UpdateTaskParams;
  [CommandType.DELETE_TASK]: DeleteTaskParams;
  [CommandType.REORDER_TASKS]: ReorderTasksParams;
  [CommandType.INDENT_TASKS]: IndentOutdentParams;
  [CommandType.OUTDENT_TASKS]: IndentOutdentParams;
  [CommandType.GROUP_TASKS]: GroupTasksParams;
  [CommandType.UNGROUP_TASKS]: UngroupTasksParams;
  [CommandType.ADD_DEPENDENCY]: AddDependencyParams;
  [CommandType.DELETE_DEPENDENCY]: DeleteDependencyParams;
  [CommandType.UPDATE_DEPENDENCY]: UpdateDependencyParams;
  [CommandType.COPY_ROWS]: CopyRowsParams;
  [CommandType.CUT_ROWS]: CutRowsParams;
  [CommandType.PASTE_ROWS]: PasteRowsParams;
  [CommandType.COPY_CELL]: CopyCellParams;
  [CommandType.CUT_CELL]: CutCellParams;
  [CommandType.PASTE_CELL]: PasteCellParams;
  [CommandType.MULTI_DRAG_TASKS]: MultiDragTasksParams;
  [CommandType.APPLY_COLORS_TO_MANUAL]: ApplyColorsToManualParams;
  [CommandType.HIDE_TASKS]: HideTasksParams;
  [CommandType.UNHIDE_TASKS]: UnhideTasksParams;
};

export enum CommandType {
  // Task operations
  ADD_TASK = "addTask",
  UPDATE_TASK = "updateTask",
  DELETE_TASK = "deleteTask",
  REORDER_TASKS = "reorderTasks",

  // Hierarchy operations
  INDENT_TASKS = "indentSelectedTasks",
  OUTDENT_TASKS = "outdentSelectedTasks",
  GROUP_TASKS = "groupTasks",
  UNGROUP_TASKS = "ungroupTasks",

  // Dependency operations (Sprint 1.4)
  ADD_DEPENDENCY = "addDependency",
  DELETE_DEPENDENCY = "deleteDependency",
  UPDATE_DEPENDENCY = "updateDependency",

  // Clipboard operations (Row-level)
  COPY_ROWS = "copyRows",
  CUT_ROWS = "cutRows",
  PASTE_ROWS = "pasteRows",

  // Clipboard operations (Cell-level)
  COPY_CELL = "copyCell",
  CUT_CELL = "cutCell",
  PASTE_CELL = "pasteCell",

  // Multi-task operations
  MULTI_DRAG_TASKS = "multiDragTasks",

  // Color operations
  APPLY_COLORS_TO_MANUAL = "applyColorsToManual",

  // Hide/Show operations
  HIDE_TASKS = "hideTasks",
  UNHIDE_TASKS = "unhideTasks",
}

export type CommandParams =
  | AddTaskParams
  | UpdateTaskParams
  | DeleteTaskParams
  | ReorderTasksParams
  | IndentOutdentParams
  | AddDependencyParams
  | DeleteDependencyParams
  | UpdateDependencyParams
  | CopyRowsParams
  | CutRowsParams
  | PasteRowsParams
  | CopyCellParams
  | CutCellParams
  | PasteCellParams
  | MultiDragTasksParams
  | ApplyColorsToManualParams
  | GroupTasksParams
  | UngroupTasksParams
  | HideTasksParams
  | UnhideTasksParams;

// Specific parameter types for each command
export interface AddTaskParams {
  task: Omit<Task, "id">;
  generatedId?: string; // Store the generated ID for undo
  // Batch insert support (multi-row Ctrl++)
  tasks?: Array<Omit<Task, "id">>;
  generatedIds?: string[];
}

export interface UpdateTaskParams {
  id: string;
  updates: Partial<Task>;
  previousValues: Partial<Task>; // Store old values for undo
  cascadeUpdates?: Array<{
    id: string;
    updates: Partial<Task>;
    previousValues: Partial<Task>;
  }>; // For summary task cascade updates
}

export interface DeleteTaskParams {
  id: string; // Deprecated: Use deletedIds instead
  deletedIds: string[]; // All task IDs that were deleted
  cascade: boolean;
  deletedTasks: Task[]; // Store all deleted tasks for undo
  cascadeUpdates?: Array<{
    id: string;
    updates: Partial<Task>;
    previousValues: Partial<Task>;
  }>;
}

export interface ReorderTasksParams {
  activeTaskId: string;
  overTaskId: string;
  previousOrder: Array<{
    id: string;
    parent: string | undefined;
    order: number;
  }>; // Lightweight snapshot for undo
}

export interface IndentOutdentParams {
  taskIds: string[];
  changes: Array<{
    taskId: string;
    oldParent: string | undefined;
    newParent: string | undefined;
  }>;
  previousTaskSnapshot: Array<{
    id: string;
    parent: string | undefined;
    order: number;
  }>;
  afterTaskSnapshot: Array<{
    id: string;
    parent: string | undefined;
    order: number;
  }>;
}

// Dependency command params (Sprint 1.4)
export interface AddDependencyParams {
  dependency: Dependency;
  dateAdjustments: DateAdjustment[]; // Store any cascading date changes for undo
}

export interface DeleteDependencyParams {
  dependency: Dependency; // Store full dependency for redo
}

export interface UpdateDependencyParams {
  id: string;
  updates: Partial<Dependency>;
  previousValues: Partial<Dependency>;
}

// Clipboard command params (Row operations)
export interface CopyRowsParams {
  taskIds: string[];
  tasks: Task[];
  dependencies: Dependency[];
}

export interface CutRowsParams {
  taskIds: string[];
  tasks: Task[];
  dependencies: Dependency[];
}

export interface PasteRowsParams {
  pastedTasks: Task[];
  pastedDependencies: Dependency[];
  insertIndex: number;
  idMapping: Record<string, string>; // old ID -> new ID
  previousCutTaskIds?: string[]; // For undo of cut operation
  deletedTasks?: Task[]; // Store deleted tasks for undo
}

// Clipboard command params (Cell operations)
export interface CopyCellParams {
  taskId: string;
  field: string; // EditableField from taskSlice
  value: unknown;
}

export interface CutCellParams {
  taskId: string;
  field: string;
  value: unknown;
}

export interface PasteCellParams {
  taskId: string;
  field: string;
  newValue: unknown;
  previousValue: unknown;
  previousCutCell?: { taskId: string; field: string; value: unknown };
  cutClearValue?: unknown; // Value source cell was set to after cut (for redo)
}

// Multi-drag command params
export interface MultiDragTasksParams {
  taskChanges: Array<{
    id: string;
    previousStartDate: string;
    previousEndDate: string;
    newStartDate: string;
    newEndDate: string;
  }>;
  cascadeUpdates: Array<{
    id: string;
    updates: Partial<Task>;
    previousValues: Partial<Task>;
  }>;
}

// Apply colors to manual params
export interface ApplyColorsToManualParams {
  previousColorModeState: ColorModeState;
  colorChanges: Array<{
    id: string;
    previousColor: string;
    previousColorOverride: string | undefined;
    newColor: string;
  }>;
}

// Group tasks params
export interface GroupTasksParams {
  summaryTaskId: string;
  summaryTask: Task;
  changes: Array<{
    taskId: string;
    oldParent: string | undefined;
    oldOrder: number;
  }>;
  previousOrder: Array<{ id: string; order: number }>;
  cascadeUpdates: Array<{
    id: string;
    updates: Partial<Task>;
    previousValues: Partial<Task>;
  }>;
}

// Ungroup tasks params
export interface UngroupTasksParams {
  ungroupedSummaries: Array<{
    summaryTask: Task;
    childChanges: Array<{
      taskId: string;
      oldParent: string | undefined;
      oldOrder: number;
    }>;
    removedDependencies: Dependency[];
  }>;
  previousOrder: Array<{ id: string; order: number }>;
  cascadeUpdates: Array<{
    id: string;
    updates: Partial<Task>;
    previousValues: Partial<Task>;
  }>;
}

// Hide/Show tasks params
export interface HideTasksParams {
  taskIds: string[]; // IDs that were explicitly hidden (including descendants)
  previousHiddenTaskIds: string[]; // Previous state for undo
}

export interface UnhideTasksParams {
  taskIds: string[]; // IDs that were unhidden
  previousHiddenTaskIds: string[]; // Previous state for undo
}
