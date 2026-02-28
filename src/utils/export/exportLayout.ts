/**
 * Pure layout computation for export rendering.
 *
 * All functions are pure (no React, no DOM) and shared by both
 * ExportRenderer (via useMemo) and calculateExportDimensions (public API).
 */

import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import type {
  ExportColumnKey,
  ExportLayoutInput,
  ExportOptions,
} from "./types";
import type { DensityConfig } from "../../types/preferences.types";
import type { TimelineScale } from "../timelineUtils";
import {
  calculateTaskTableWidth,
  calculateEffectiveZoom,
  getEffectiveDateRange,
  calculateDurationDays,
  calculateOptimalColumnWidths,
} from "./calculations";
import { getTimelineScale } from "../timelineUtils";
import { getDateRange } from "../dateUtils";
import { DENSITY_CONFIG } from "../../config/densityConfig";
import { HEADER_HEIGHT } from "./constants";
import type { FlattenedTask } from "../hierarchy";
import { buildFlattenedTaskList } from "../hierarchy";

// =============================================================================
// Types
// =============================================================================

/** Result of computing the full export layout geometry */
export interface ExportLayout {
  flattenedTasks: FlattenedTask[];
  orderedTasks: Task[];
  selectedColumns: ExportColumnKey[];
  hasTaskList: boolean;
  effectiveColumnWidths: Record<string, number>;
  taskTableWidth: number;
  dateRange: { min: string; max: string };
  effectiveZoom: number;
  scale: TimelineScale;
  timelineWidth: number;
  totalWidth: number;
  contentHeight: number;
  totalHeight: number;
  densityConfig: DensityConfig;
}

// =============================================================================
// Constants
// =============================================================================

/** Default duration in days when no project date range is available */
const DEFAULT_DURATION_DAYS = 30;

/** Extra days added to date range for preliminary zoom estimation */
const DATE_RANGE_PADDING_DAYS = 14;

/** Minimum timeline width in pixels (prevents degenerate layouts) */
const MIN_TIMELINE_WIDTH = 100;

/** Milliseconds per day */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Estimate project duration in days, adding padding for zoom calculation.
 * Used as a preliminary step before the final date range is computed.
 */
function estimatePreliminaryDuration(
  projectDateRange: { start: Date; end: Date } | undefined
): number {
  if (!projectDateRange) return DEFAULT_DURATION_DAYS;
  const ms = projectDateRange.end.getTime() - projectDateRange.start.getTime();
  return Math.ceil(ms / MS_PER_DAY) + DATE_RANGE_PADDING_DAYS;
}

/**
 * Compute final timeline and total dimensions from scale and options.
 */
function computeFinalDimensions(
  options: ExportOptions,
  scale: TimelineScale,
  taskTableWidth: number,
  orderedTaskCount: number,
  rowHeight: number
): {
  timelineWidth: number;
  totalWidth: number;
  contentHeight: number;
  totalHeight: number;
} {
  const timelineWidth =
    options.zoomMode === "fitToWidth"
      ? Math.max(MIN_TIMELINE_WIDTH, options.fitToWidth - taskTableWidth)
      : scale.totalWidth;
  const totalWidth =
    options.zoomMode === "fitToWidth"
      ? options.fitToWidth
      : taskTableWidth + timelineWidth;
  const contentHeight = orderedTaskCount * rowHeight;
  const totalHeight =
    (options.includeHeader ? HEADER_HEIGHT : 0) + contentHeight;

  return { timelineWidth, totalWidth, contentHeight, totalHeight };
}

/**
 * Resolve the project date range from an explicit value or from task dates.
 */
function resolveProjectDateRange(
  provided: { start: Date; end: Date } | undefined,
  orderedTasks: Task[]
): { start: Date; end: Date } | undefined {
  if (provided) return provided;
  if (orderedTasks.length === 0) return undefined;
  const range = getDateRange(orderedTasks);
  return { start: new Date(range.min), end: new Date(range.max) };
}

/**
 * Compute task table column widths and total table width.
 */
function computeTaskTableLayout(
  selectedColumns: ExportColumnKey[],
  orderedTasks: Task[],
  options: ExportOptions,
  columnWidths: Record<string, number>
): {
  hasTaskList: boolean;
  effectiveColumnWidths: Record<string, number>;
  taskTableWidth: number;
} {
  const hasTaskList = selectedColumns.length > 0;
  const effectiveColumnWidths = calculateOptimalColumnWidths(
    selectedColumns,
    orderedTasks,
    options.density,
    columnWidths
  );
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(
        selectedColumns,
        effectiveColumnWidths,
        options.density
      )
    : 0;
  return { hasTaskList, effectiveColumnWidths, taskTableWidth };
}

/**
 * Compute zoom, date range, and timeline scale from task data and options.
 */
function computeTimelineLayout(
  options: ExportOptions,
  currentAppZoom: number,
  orderedTasks: Task[],
  taskTableWidth: number,
  projectDateRange: { start: Date; end: Date } | undefined,
  visibleDateRange: { start: Date; end: Date } | undefined
): {
  dateRange: { min: string; max: string };
  effectiveZoom: number;
  scale: TimelineScale;
} {
  const preliminaryDuration = estimatePreliminaryDuration(projectDateRange);
  const preliminaryZoom = calculateEffectiveZoom(
    options,
    currentAppZoom,
    preliminaryDuration,
    taskTableWidth
  );

  const dateRange = getEffectiveDateRange(
    options,
    projectDateRange,
    visibleDateRange,
    orderedTasks,
    preliminaryZoom
  );

  const durationDays = calculateDurationDays(dateRange);
  const effectiveZoom = calculateEffectiveZoom(
    options,
    currentAppZoom,
    durationDays,
    taskTableWidth
  );

  const scale = getTimelineScale(
    dateRange.min,
    dateRange.max,
    MIN_TIMELINE_WIDTH,
    effectiveZoom
  );

  return { dateRange, effectiveZoom, scale };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Computes the full export layout geometry from tasks and options.
 * Pure function shared by both ExportRenderer (via useMemo) and
 * calculateExportDimensions to eliminate duplication.
 */
export function computeExportLayout(input: ExportLayoutInput): ExportLayout {
  const {
    tasks,
    options,
    columnWidths = {},
    currentAppZoom = 1,
    projectDateRange: providedProjectDateRange,
    visibleDateRange,
  } = input;

  const densityConfig = DENSITY_CONFIG[options.density];

  const flattenedTasks = buildFlattenedTaskList(tasks, new Set<TaskId>());
  const orderedTasks = flattenedTasks.map((ft) => ft.task);
  const selectedColumns = options.selectedColumns;

  const projectDateRange = resolveProjectDateRange(
    providedProjectDateRange,
    orderedTasks
  );

  const { hasTaskList, effectiveColumnWidths, taskTableWidth } =
    computeTaskTableLayout(
      selectedColumns,
      orderedTasks,
      options,
      columnWidths
    );

  const { dateRange, effectiveZoom, scale } = computeTimelineLayout(
    options,
    currentAppZoom,
    orderedTasks,
    taskTableWidth,
    projectDateRange,
    visibleDateRange
  );

  const { timelineWidth, totalWidth, contentHeight, totalHeight } =
    computeFinalDimensions(
      options,
      scale,
      taskTableWidth,
      orderedTasks.length,
      densityConfig.rowHeight
    );

  return {
    flattenedTasks,
    orderedTasks,
    selectedColumns,
    hasTaskList,
    effectiveColumnWidths,
    taskTableWidth,
    dateRange,
    effectiveZoom,
    scale,
    timelineWidth,
    totalWidth,
    contentHeight,
    totalHeight,
    densityConfig,
  };
}

/**
 * Calculate the export dimensions based on options.
 * Delegates to computeExportLayout for all geometry calculations.
 */
export function calculateExportDimensions(input: ExportLayoutInput): {
  width: number;
  height: number;
  effectiveZoom: number;
} {
  const layout = computeExportLayout(input);

  return {
    width: Math.round(layout.totalWidth),
    height: Math.round(layout.totalHeight),
    effectiveZoom: layout.effectiveZoom,
  };
}
