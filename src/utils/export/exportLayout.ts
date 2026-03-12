/**
 * Pure layout computation for export rendering.
 *
 * All functions are pure (no React, no DOM) and shared by both
 * ExportRenderer (via useMemo) and calculateExportDimensions (public API).
 */

import type { Task } from "../../types/chart.types";
import type { TaskId } from "../../types/branded.types";
import type { DensityConfig } from "../../types/preferences.types";
import { DENSITY_CONFIG } from "../../config/densityConfig";
import { getDateRange } from "../dateUtils";
import type { FlattenedTask } from "../hierarchy";
import { buildFlattenedTaskList } from "../hierarchy";
import type { TimelineScale } from "../timelineUtils";
import { getTimelineScale } from "../timelineUtils";
import {
  calculateTaskTableWidth,
  calculateEffectiveZoom,
  getEffectiveDateRange,
  calculateDurationDays,
  calculateOptimalColumnWidths,
  MS_PER_DAY,
} from "./calculations";
import { HEADER_HEIGHT } from "./constants";
import type {
  ExportColumnKey,
  ExportLayoutInput,
  ExportOptions,
} from "./types";

// =============================================================================
// Types
// =============================================================================

/** Result of computing the full export layout geometry */
export interface ExportLayout {
  flattenedTasks: FlattenedTask[];
  orderedTasks: Task[];
  selectedColumns: ExportColumnKey[];
  hasTaskList: boolean;
  /** Keys are ExportColumnKey values; only selected columns are present. */
  effectiveColumnWidths: Partial<Record<ExportColumnKey, number>>;
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

/**
 * Intermediate layout parts returned by buildLayoutParts (excludes task list and density).
 * @internal Not part of the public API — used only within this module.
 */
type ExportLayoutParts = Omit<
  ExportLayout,
  "flattenedTasks" | "orderedTasks" | "densityConfig"
>;

/** Task count and row height needed to compute content height. */
interface TaskSizeInput {
  count: number;
  rowHeight: number;
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

/** Reusable empty set passed to buildFlattenedTaskList — no hidden tasks during export */
const EMPTY_HIDDEN_TASK_IDS = new Set<TaskId>();

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
 * Separated from computeTimelineLayout so that the width arithmetic (fitToWidth
 * clamping, MIN_TIMELINE_WIDTH guard) is isolated and easy to unit-test
 * independently of the zoom/scale computation.
 */
function computeFinalDimensions(
  options: ExportOptions,
  scale: TimelineScale,
  taskTableWidth: number,
  taskSize: TaskSizeInput
): {
  timelineWidth: number;
  totalWidth: number;
  contentHeight: number;
  totalHeight: number;
} {
  const availableTimelineWidth = options.fitToWidth - taskTableWidth;
  const timelineWidth =
    options.zoomMode === "fitToWidth"
      ? Math.max(MIN_TIMELINE_WIDTH, availableTimelineWidth)
      : scale.totalWidth;
  const totalWidth =
    options.zoomMode === "fitToWidth"
      ? options.fitToWidth
      : taskTableWidth + timelineWidth;
  const contentHeight = taskSize.count * taskSize.rowHeight;
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
 * Separated from computeTimelineLayout because the task-table geometry
 * (column auto-fit, total table width) must be known before the timeline
 * zoom can be calculated — the table width is an input to zoom fitting.
 */
function computeTaskTableLayout(
  selectedColumns: ExportColumnKey[],
  orderedTasks: Task[],
  options: ExportOptions,
  columnWidths: Record<string, number>
): {
  hasTaskList: boolean;
  /** Keys are ExportColumnKey values; only selected columns are present. */
  effectiveColumnWidths: Partial<Record<ExportColumnKey, number>>;
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

/** Input parameters for timeline zoom, date range, and scale computation. */
interface TimelineLayoutInput {
  options: ExportOptions;
  currentAppZoom: number;
  orderedTasks: Task[];
  taskTableWidth: number;
  projectDateRange: { start: Date; end: Date } | undefined;
  visibleDateRange: { start: Date; end: Date } | undefined;
}

/**
 * Compute zoom, date range, and timeline scale from task data and options.
 *
 * Uses a two-pass zoom algorithm:
 * - **Pass 1** — Estimate a preliminary zoom from the raw project duration
 *   (before label-padding days are added). This zoom is only needed by
 *   `getEffectiveDateRange` to calculate how many extra days of edge padding
 *   are required so that task labels are not clipped.
 * - **Pass 2** — Re-compute the final zoom from the padded duration. The
 *   padded range is slightly wider, so the "fit" zoom is marginally smaller.
 *   Using the padded duration keeps fit-to-width mode accurate.
 *
 * See also: {@link computeExportLayout} for the full algorithm rationale.
 */
function computeTimelineLayout(input: TimelineLayoutInput): {
  dateRange: { min: string; max: string };
  effectiveZoom: number;
  scale: TimelineScale;
} {
  const {
    options,
    currentAppZoom,
    orderedTasks,
    taskTableWidth,
    projectDateRange,
    visibleDateRange,
  } = input;
  // Two-pass zoom — see JSDoc above for rationale.
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

  const scale = getTimelineScale(dateRange.min, dateRange.max, effectiveZoom);

  return { dateRange, effectiveZoom, scale };
}

/**
 * Flatten the input task list into display order and extract ordered Task objects.
 */
function flattenInputTasks(tasks: Task[]): {
  flattenedTasks: FlattenedTask[];
  orderedTasks: Task[];
} {
  const flattenedTasks = buildFlattenedTaskList(tasks, EMPTY_HIDDEN_TASK_IDS);
  const orderedTasks = flattenedTasks.map((ft) => ft.task);
  return { flattenedTasks, orderedTasks };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Input parameters for buildLayoutParts.
 * @internal Not part of the public API — used only within this module.
 */
interface LayoutPartsInput {
  orderedTasks: Task[];
  options: ExportLayoutInput["options"];
  columnWidths: Record<string, number>;
  currentAppZoom: number;
  providedProjectDateRange: { start: Date; end: Date } | undefined;
  visibleDateRange: { start: Date; end: Date } | undefined;
  densityConfig: DensityConfig;
}

/**
 * Orchestrate the table → timeline → dimension sub-computations from an
 * already-flattened task list. Extracted to keep computeExportLayout under
 * 50 lines while preserving the well-defined call sequence.
 */
function buildLayoutParts(input: LayoutPartsInput): ExportLayoutParts {
  const {
    orderedTasks,
    options,
    columnWidths,
    currentAppZoom,
    providedProjectDateRange,
    visibleDateRange,
    densityConfig,
  } = input;
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
  const { dateRange, effectiveZoom, scale } = computeTimelineLayout({
    options,
    currentAppZoom,
    orderedTasks,
    taskTableWidth,
    projectDateRange,
    visibleDateRange,
  });
  const taskSize: TaskSizeInput = {
    count: orderedTasks.length,
    rowHeight: densityConfig.rowHeight,
  };
  const { timelineWidth, totalWidth, contentHeight, totalHeight } =
    computeFinalDimensions(options, scale, taskTableWidth, taskSize);
  return {
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
  };
}

/**
 * Computes the full export layout geometry from tasks and options.
 * Pure function shared by both ExportRenderer (via useMemo) and
 * calculateExportDimensions to eliminate duplication.
 *
 * Uses a two-pass zoom algorithm: a preliminary zoom is first computed from
 * the raw project duration to determine label-padding days, then the final
 * zoom is computed from the padded duration. This ensures fit-to-width mode
 * is accurate and task labels are never clipped at the chart edges.
 *
 * @param input - See {@link ExportLayoutInput} for the full input contract.
 * @param input.tasks - Task list to render. Must be pre-filtered through
 *   `prepareExportTasks` to exclude hidden tasks before being passed here.
 *   This function does not apply visibility filtering — it flattens the
 *   provided task list as-is.
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
  const { flattenedTasks, orderedTasks } = flattenInputTasks(tasks);
  const parts = buildLayoutParts({
    orderedTasks,
    options,
    columnWidths,
    currentAppZoom,
    providedProjectDateRange,
    visibleDateRange,
    densityConfig,
  });

  return { flattenedTasks, orderedTasks, densityConfig, ...parts };
}

/**
 * Calculate the export dimensions based on options.
 * Delegates to computeExportLayout for all geometry calculations.
 *
 * @param input - See {@link ExportLayoutInput} for the full input contract.
 * @returns Width and height in pixels (both rounded to integers) and the
 *   effective zoom level used for the layout.
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
