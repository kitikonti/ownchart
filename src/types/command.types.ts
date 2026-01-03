/**
 * Command Pattern for Undo/Redo
 * Every user action becomes a serializable command that can be undone/redone
 */

import type { Task, TaskType } from "./chart.types";

export interface Command {
  id: string; // UUID for tracking
  type: CommandType; // Action type
  timestamp: number; // When executed
  description: string; // Human-readable (e.g., "Created task 'Design'")

  // Serializable parameters
  params: CommandParams;

  // Optional: For complex commands that need context
  metadata?: Record<string, unknown>;
}

export enum CommandType {
  // Task operations
  ADD_TASK = "addTask",
  UPDATE_TASK = "updateTask",
  DELETE_TASK = "deleteTask",
  REORDER_TASKS = "reorderTasks",

  // Hierarchy operations
  MOVE_TASK_TO_PARENT = "moveTaskToParent",
  INDENT_TASKS = "indentSelectedTasks",
  OUTDENT_TASKS = "outdentSelectedTasks",

  // Type conversions
  CONVERT_TO_SUMMARY = "convertToSummary",
  CONVERT_TO_TASK = "convertToTask",

  // Selection operations
  TOGGLE_TASK_SELECTION = "toggleTaskSelection",
  SELECT_TASK_RANGE = "selectTaskRange",
  CLEAR_SELECTION = "clearSelection",

  // Collapse/expand
  TOGGLE_TASK_COLLAPSED = "toggleTaskCollapsed",
  EXPAND_ALL = "expandAll",
  COLLAPSE_ALL = "collapseAll",
}

export type CommandParams =
  | AddTaskParams
  | UpdateTaskParams
  | DeleteTaskParams
  | ReorderTasksParams
  | MoveTaskParams
  | IndentOutdentParams
  | ConvertTypeParams
  | SelectionParams
  | CollapseParams;

// Specific parameter types for each command
export interface AddTaskParams {
  task: Omit<Task, "id">;
  generatedId?: string; // Store the generated ID for undo
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
  id: string;
  cascade: boolean;
  deletedTasks: Task[]; // Store all deleted tasks for undo
}

export interface ReorderTasksParams {
  fromIndex: number;
  toIndex: number;
  previousOrder: Task[]; // Store previous order for undo
}

export interface MoveTaskParams {
  taskId: string;
  newParentId: string | null;
  previousParentId: string | null; // For undo
}

export interface IndentOutdentParams {
  taskIds: string[];
  changes: Array<{
    taskId: string;
    oldParent: string | undefined;
    newParent: string | undefined;
  }>;
}

export interface ConvertTypeParams {
  taskId: string;
  newType: TaskType;
  previousType: TaskType;
}

export interface SelectionParams {
  taskIds: string[];
  previousSelection: string[]; // For undo
}

export interface CollapseParams {
  taskId?: string; // undefined for expand/collapseAll
  previousState: boolean | Record<string, boolean>; // Single boolean or map of all tasks
}
