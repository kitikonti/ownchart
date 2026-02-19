/**
 * Column actions extracted from taskSlice.
 * Handles column width management and auto-fit.
 */

import type { Task } from "../../types/chart.types";
import { getTaskLevel } from "../../utils/hierarchy";
import { TASK_COLUMNS } from "../../config/tableColumns";
import { calculateColumnWidth } from "../../utils/textMeasurement";
import type { DensityConfig } from "../../types/preferences.types";
import { useUserPreferencesStore } from "./userPreferencesSlice";
import {
  PLACEHOLDER_TEXT,
  EXPAND_BUTTON_WIDTH,
  CELL_GAP_SIZE,
} from "./taskSliceHelpers";
import type { TaskSliceSet, TaskActions, TaskState } from "./taskSlice";

type ColumnActions = Pick<
  TaskActions,
  "setColumnWidth" | "autoFitColumn" | "autoFitAllColumns"
>;

/**
 * Measure and set the optimal width for a single column.
 */
function fitColumnToContent(
  state: TaskState,
  columnId: string,
  densityConfig: DensityConfig
): void {
  const column = TASK_COLUMNS.find((col) => col.id === columnId);
  if (!column || !column.field) return;

  const field = column.field;
  const fontSize = densityConfig.fontSizeCell;
  const indentSize = densityConfig.indentSize;
  const iconSize = densityConfig.iconSize;
  const cellPadding =
    columnId === "name"
      ? densityConfig.cellPaddingX
      : densityConfig.cellPaddingX * 2;

  const cellValues: string[] = [];
  const extraWidths: number[] = [];

  // Cast: WritableDraft<Task> is read-compatible with Task
  const tasks = state.tasks as Task[];

  for (const task of tasks) {
    let valueStr = "";
    if (column.formatter) {
      valueStr = column.formatter(task[field]);
    } else {
      const value = task[field];
      valueStr = value !== undefined && value !== null ? String(value) : "";
    }
    cellValues.push(valueStr);

    if (columnId === "name") {
      const level = getTaskLevel(tasks, task.id);
      const hierarchyIndent = level * indentSize;
      extraWidths.push(
        hierarchyIndent + EXPAND_BUTTON_WIDTH + CELL_GAP_SIZE + iconSize
      );
    } else {
      extraWidths.push(0);
    }
  }

  if (columnId === "name") {
    cellValues.push(PLACEHOLDER_TEXT);
    extraWidths.push(EXPAND_BUTTON_WIDTH + CELL_GAP_SIZE + iconSize);
  }

  state.columnWidths[columnId] = calculateColumnWidth(
    column.label,
    cellValues,
    fontSize,
    cellPadding,
    extraWidths
  );
}

export function createColumnActions(set: TaskSliceSet): ColumnActions {
  return {
    setColumnWidth: (columnId, width): void =>
      set((state) => {
        state.columnWidths[columnId] = width;
      }),

    autoFitColumn: (columnId): void => {
      const densityConfig = useUserPreferencesStore
        .getState()
        .getDensityConfig();
      set((state) => {
        fitColumnToContent(state, columnId, densityConfig);
      });
    },

    autoFitAllColumns: (): void => {
      const densityConfig = useUserPreferencesStore
        .getState()
        .getDensityConfig();
      set((state) => {
        const autoFitColumnIds = TASK_COLUMNS.filter(
          (col) => col.field && col.id !== "color"
        ).map((col) => col.id);
        for (const colId of autoFitColumnIds) {
          fitColumnToContent(state, colId, densityConfig);
        }
      });
    },
  };
}
