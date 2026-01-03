/**
 * Serialization utilities for converting app state to GanttFile JSON
 */

import type { Task } from '../../types/chart.types';
import type { GanttFile, SerializedTask, ViewSettings } from './types';
import { APP_VERSION, FILE_VERSION } from '../../config/version';

export interface SerializeOptions {
  chartName?: string;
  chartId?: string;
  prettyPrint?: boolean;
}

/**
 * Convert app state to GanttFile JSON string
 *
 * @param tasks - Array of tasks from taskSlice
 * @param viewSettings - View state from chartSlice and taskSlice
 * @param options - Serialization options
 * @returns JSON string ready to save
 */
export function serializeToGanttFile(
  tasks: Task[],
  viewSettings: ViewSettings,
  options: SerializeOptions = {}
): string {
  const now = new Date().toISOString();

  const ganttFile: GanttFile = {
    fileVersion: FILE_VERSION,
    appVersion: APP_VERSION,
    schemaVersion: 1,

    chart: {
      id: options.chartId || crypto.randomUUID(),
      name: options.chartName || 'Untitled',
      tasks: tasks.map(serializeTask),
      viewSettings: {
        zoom: viewSettings.zoom,
        panOffset: viewSettings.panOffset,
        showWeekends: viewSettings.showWeekends,
        showTodayMarker: viewSettings.showTodayMarker,
        taskTableWidth: viewSettings.taskTableWidth,
        columnWidths: viewSettings.columnWidths,
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    },

    metadata: {
      created: now,
      modified: now,
    },

    features: {
      hasHierarchy: tasks.some((t) => !!t.parent),
      hasHistory: false, // No history persistence in v1.0.0
    },
  };

  // Calculate file size
  const jsonString = JSON.stringify(ganttFile);
  ganttFile.metadata.fileSize = new Blob([jsonString]).size;

  return options.prettyPrint
    ? JSON.stringify(ganttFile, null, 2)
    : JSON.stringify(ganttFile);
}

/**
 * Convert Task to SerializedTask
 * Preserves __unknownFields for round-trip compatibility
 */
function serializeTask(task: Task): SerializedTask {
  const serialized: SerializedTask = {
    id: task.id,
    name: task.name,
    startDate: task.startDate,
    endDate: task.endDate,
    duration: task.duration,
    progress: task.progress,
    color: task.color,
    order: task.order,
    type: task.type,
    parent: task.parent,
    open: task.open,
    metadata: task.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Preserve unknown fields from future versions
  const taskWithUnknownFields = task as Task & { __unknownFields?: Record<string, unknown> };
  if (taskWithUnknownFields.__unknownFields && typeof taskWithUnknownFields.__unknownFields === 'object') {
    Object.assign(serialized, taskWithUnknownFields.__unknownFields);
  }

  return serialized;
}
