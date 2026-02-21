/**
 * Command Pattern for Undo/Redo
 * Every user action becomes a serializable command that can be undone/redone
 */

import type { Task } from "./chart.types";
import type {
  Dependency,
  DateAdjustment,
  DependencyUpdatableFields,
} from "./dependency.types";
import type { ColorModeState } from "./colorMode.types";
import type { EditableField } from "./task.types";

export interface CascadeUpdate {
  id: string;
  updates: Partial<Task>;
  previousValues: Partial<Task>;
}

export interface ParentChange {
  taskId: string;
  oldParent: string | undefined;
  oldOrder: number;
}

export type TaskHierarchySnapshot = Array<{
  id: string;
  parent: string | undefined;
  order: number;
}>;

export type TaskOrderSnapshot = Array<{ id: string; order: number }>;

interface CommandBase {
  id: string; // UUID for tracking
  timestamp: number; // When executed
  description: string; // Human-readable (e.g., "Created task 'Design'")

  // Optional: For complex commands that need context
  metadata?: Record<string, unknown>;
}

// Type mapping — single source of truth for CommandType → Params
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

// Derived discriminated union — adding a new CommandType only requires updating CommandParamsMap
export type Command = {
  [K in CommandType]: CommandBase & { type: K; params: CommandParamsMap[K] };
}[CommandType];

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

  // Dependency operations
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

// Specific parameter types for each command
export type AddTaskParams = SingleAddTaskParams | BatchAddTaskParams;

export interface SingleAddTaskParams {
  mode: "single";
  task: Omit<Task, "id">;
  generatedId: string;
}

export interface BatchAddTaskParams {
  mode: "batch";
  tasks: Array<Omit<Task, "id">>;
  generatedIds: string[];
}

export interface UpdateTaskParams {
  id: string;
  updates: Partial<Task>;
  previousValues: Partial<Task>; // Store old values for undo
  cascadeUpdates?: CascadeUpdate[];
}

export interface DeleteTaskParams {
  deletedIds: string[];
  cascade: boolean;
  deletedTasks: Task[];
  deletedDependencies: Dependency[];
  cascadeUpdates?: CascadeUpdate[];
}

export interface ReorderTasksParams {
  activeTaskId: string;
  overTaskId: string;
  previousOrder: TaskHierarchySnapshot; // Lightweight snapshot for undo
}

export interface IndentOutdentParams {
  taskIds: string[];
  changes: Array<{
    taskId: string;
    oldParent: string | undefined;
    newParent: string | undefined;
  }>;
  previousTaskSnapshot: TaskHierarchySnapshot;
  afterTaskSnapshot: TaskHierarchySnapshot;
}

export interface AddDependencyParams {
  dependency: Dependency;
  dateAdjustments: DateAdjustment[]; // Store any cascading date changes for undo
}

export interface DeleteDependencyParams {
  dependency: Dependency; // Store full dependency for redo
}

export interface UpdateDependencyParams {
  id: string;
  updates: DependencyUpdatableFields;
  previousValues: DependencyUpdatableFields;
}

// Clipboard command params (Row operations)
export interface CopyRowsParams {
  taskIds: string[];
  tasks: Task[];
  dependencies: Dependency[];
}

export type CutRowsParams = CopyRowsParams;

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
  field: EditableField;
  value: Task[EditableField];
}

export type CutCellParams = CopyCellParams;

export interface PasteCellParams {
  taskId: string;
  field: EditableField;
  newValue: Task[EditableField];
  previousValue: Task[EditableField];
  previousCutCell?: CopyCellParams;
  cutClearValue?: Task[EditableField]; // Value source cell was set to after cut (for redo)
}

export interface MultiDragTasksParams {
  taskChanges: Array<{
    id: string;
    previousStartDate: string;
    previousEndDate: string;
    newStartDate: string;
    newEndDate: string;
  }>;
  cascadeUpdates: CascadeUpdate[];
}

export interface ApplyColorsToManualParams {
  previousColorModeState: ColorModeState;
  colorChanges: Array<{
    id: string;
    previousColor: string;
    previousColorOverride: string | undefined;
    newColor: string;
  }>;
}

export interface GroupTasksParams {
  summaryTaskId: string;
  summaryTask: Task;
  changes: ParentChange[];
  previousOrder: TaskOrderSnapshot;
  cascadeUpdates: CascadeUpdate[];
}

export interface UngroupTasksParams {
  ungroupedSummaries: Array<{
    summaryTask: Task;
    childChanges: ParentChange[];
    removedDependencies: Dependency[];
  }>;
  previousOrder: TaskOrderSnapshot;
  cascadeUpdates: CascadeUpdate[];
}

export interface HideTasksParams {
  taskIds: string[]; // IDs that were explicitly hidden (including descendants)
  previousHiddenTaskIds: string[]; // Previous state for undo
}

export interface UnhideTasksParams {
  taskIds: string[]; // IDs that were unhidden
  previousHiddenTaskIds: string[]; // Previous state for undo
}
