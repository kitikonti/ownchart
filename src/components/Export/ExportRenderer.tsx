/**
 * ExportRenderer - Offscreen renderer for full chart export.
 * Renders the complete chart without scroll limits for PNG export.
 */

import { useMemo } from "react";
import type { Task } from "../../types/chart.types";
import type { ExportOptions, ExportColumnKey } from "../../utils/export/types";
import {
  calculateTaskTableWidth,
  calculateEffectiveZoom,
  getEffectiveDateRange,
  calculateDurationDays,
  calculateOptimalColumnWidths,
} from "../../utils/export";
import {
  getTimelineScale,
  type TimelineScale,
} from "../../utils/timelineUtils";
import { getDateRange } from "../../utils/dateUtils";
import { GridLines } from "../GanttChart/GridLines";
import { TaskBar } from "../GanttChart/TaskBar";
import { TodayMarker } from "../GanttChart/TodayMarker";
import { DependencyArrows } from "../GanttChart/DependencyArrows";
import { TimelineHeader } from "../GanttChart/TimelineHeader";
import { TaskTypeIcon } from "../TaskList/TaskTypeIcon";
import {
  buildFlattenedTaskList,
  type FlattenedTask,
} from "../../utils/hierarchy";
import type { DensityConfig } from "../../types/preferences.types";
import { DENSITY_CONFIG } from "../../config/densityConfig";
import { useChartStore } from "../../store/slices/chartSlice";
import { HEADER_HEIGHT, SVG_FONT_FAMILY } from "../../utils/export/constants";
import { EXPORT_COLUMN_MAP } from "../../utils/export/columns";
import { getComputedTaskColor } from "../../utils/computeTaskColor";
import { COLORS } from "../../styles/design-tokens";

// =============================================================================
// Types
// =============================================================================

interface ExportRendererProps {
  tasks: Task[];
  options: ExportOptions;
  columnWidths: Record<string, number>;
  currentAppZoom?: number;
  projectDateRange?: { start: Date; end: Date };
  visibleDateRange?: { start: Date; end: Date };
}

/** Density-related layout props for export table rows */
interface DensityLayoutProps {
  rowHeight: number;
  colorBarHeight: number;
  indentSize: number;
  fontSizeCell: number;
  cellPaddingX: number;
}

/** Result of computing the full export layout geometry */
interface ExportLayout {
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
// Shared Layout Computation
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
 * Computes the full export layout geometry from tasks and options.
 * Pure function shared by both ExportRenderer (via useMemo) and
 * calculateExportDimensions to eliminate duplication.
 */
function computeExportLayout(
  tasks: Task[],
  options: ExportOptions,
  columnWidths: Record<string, number>,
  currentAppZoom: number,
  providedProjectDateRange?: { start: Date; end: Date },
  visibleDateRange?: { start: Date; end: Date }
): ExportLayout {
  const densityConfig = DENSITY_CONFIG[options.density];

  // Build flattened task list (all expanded for export)
  const flattenedTasks = buildFlattenedTaskList(tasks, new Set<string>());
  const orderedTasks = flattenedTasks.map((ft) => ft.task);

  // Calculate project date range from tasks if not provided
  let projectDateRange = providedProjectDateRange;
  if (!projectDateRange && orderedTasks.length > 0) {
    const range = getDateRange(orderedTasks);
    projectDateRange = {
      start: new Date(range.min),
      end: new Date(range.max),
    };
  }

  // Get selected columns (default to all if not specified)
  const selectedColumns: ExportColumnKey[] = options.selectedColumns || [
    "name",
    "startDate",
    "endDate",
    "progress",
  ];
  const hasTaskList = selectedColumns.length > 0;

  // Calculate optimal column widths based on content
  const effectiveColumnWidths = calculateOptimalColumnWidths(
    selectedColumns,
    orderedTasks,
    options.density,
    columnWidths
  );

  // Calculate task table width (needed for fitToWidth calculation)
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(
        selectedColumns,
        effectiveColumnWidths,
        options.density
      )
    : 0;

  // Calculate preliminary zoom for label padding estimation
  const preliminaryDuration = estimatePreliminaryDuration(projectDateRange);
  const preliminaryZoom = calculateEffectiveZoom(
    options,
    currentAppZoom,
    preliminaryDuration,
    taskTableWidth
  );

  // Get effective date range with label padding
  const dateRange = getEffectiveDateRange(
    options,
    projectDateRange,
    visibleDateRange,
    orderedTasks,
    preliminaryZoom
  );

  // Calculate final zoom and scale
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

// =============================================================================
// Sub-Components
// =============================================================================

/** Renders the task table header for export. */
function ExportTaskTableHeader({
  selectedColumns,
  columnWidths,
  width,
}: {
  selectedColumns: ExportColumnKey[];
  columnWidths: Record<string, number>;
  width: number;
}): JSX.Element {
  return (
    <div
      className="flex border-b border-neutral-200 bg-neutral-50"
      style={{ width, minWidth: width, height: HEADER_HEIGHT }}
    >
      {selectedColumns.map((key) => {
        const col = EXPORT_COLUMN_MAP.get(key);
        if (!col) return null;
        return (
          <div
            key={col.key}
            className={`flex items-center px-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider ${col.key !== "color" ? "border-r border-neutral-200" : ""}`}
            style={{
              width: columnWidths[col.key] || col.defaultWidth,
              height: HEADER_HEIGHT,
            }}
          >
            {col.label}
          </div>
        );
      })}
    </div>
  );
}

/** Renders the task table rows for export (without header). */
function ExportTaskTableRows({
  flattenedTasks,
  parentIds,
  selectedColumns,
  columnWidths,
  width,
  height,
  densityLayout,
  colorMap,
}: {
  flattenedTasks: FlattenedTask[];
  parentIds: Set<string>;
  selectedColumns: ExportColumnKey[];
  columnWidths: Record<string, number>;
  width: number;
  height: number;
  densityLayout: DensityLayoutProps;
  colorMap: Map<string, string>;
}): JSX.Element {
  const { rowHeight, colorBarHeight, indentSize, fontSizeCell, cellPaddingX } =
    densityLayout;

  return (
    <div
      className="export-task-table bg-white border-r border-neutral-200"
      style={{ width, minWidth: width, height }}
    >
      {flattenedTasks.map((flattenedTask, index) => {
        const task = flattenedTask.task;
        const level = flattenedTask.level;
        return (
          <div
            key={task.id}
            className="flex border-b border-neutral-100"
            style={{ height: rowHeight, fontSize: fontSizeCell }}
          >
            {selectedColumns.map((key) => {
              const col = EXPORT_COLUMN_MAP.get(key);
              if (!col) return null;
              const colWidth = columnWidths[key] || col.defaultWidth;

              if (key === "color") {
                const displayColor = colorMap.get(task.id) || task.color;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-center"
                    style={{ width: colWidth, height: rowHeight }}
                  >
                    <div
                      className="w-1.5 rounded"
                      style={{
                        backgroundColor: displayColor,
                        height: colorBarHeight,
                      }}
                    />
                  </div>
                );
              }

              if (key === "name") {
                const hasChildren = parentIds.has(task.id);
                const isSummary = task.type === "summary";

                return (
                  <div
                    key={key}
                    className="flex items-center gap-1 border-r border-neutral-100"
                    style={{
                      width: colWidth,
                      paddingLeft: `${level * indentSize}px`,
                      paddingRight: cellPaddingX,
                      height: rowHeight,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hasChildren && isSummary ? (
                      <span className="w-4 text-center text-neutral-600 flex-shrink-0">
                        ▼
                      </span>
                    ) : (
                      <span className="w-4 flex-shrink-0" />
                    )}
                    <TaskTypeIcon type={task.type} />
                    <span className="flex-1">
                      {task.name || `Task ${index + 1}`}
                    </span>
                  </div>
                );
              }

              // Handle milestone and summary special cases
              const isSummary = task.type === "summary";
              const isMilestone = task.type === "milestone";
              const useSummaryStyle =
                isSummary &&
                (key === "startDate" ||
                  key === "endDate" ||
                  key === "duration");

              let value: string | null = null;
              if (key === "startDate") {
                value = task.startDate || null;
              } else if (key === "endDate") {
                if (isMilestone) {
                  value = "";
                } else {
                  value = task.endDate || null;
                }
              } else if (key === "duration") {
                if (isMilestone) {
                  value = "";
                } else if (
                  isSummary &&
                  task.duration !== undefined &&
                  task.duration > 0
                ) {
                  value = `${task.duration} days`;
                } else if (!isSummary && task.duration !== undefined) {
                  value = `${task.duration}`;
                }
              } else if (key === "progress") {
                value =
                  task.progress !== undefined ? `${task.progress}%` : null;
              }

              return (
                <div
                  key={key}
                  className={`flex items-center border-r border-neutral-100 ${useSummaryStyle ? "text-neutral-500 italic" : ""}`}
                  style={{
                    width: colWidth,
                    height: rowHeight,
                    paddingLeft: cellPaddingX,
                    paddingRight: cellPaddingX,
                    whiteSpace: "nowrap",
                  }}
                >
                  {value === null ? "—" : value}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Main export renderer component.
 * Renders the complete chart structure for export capture.
 */
export function ExportRenderer({
  tasks,
  options,
  columnWidths,
  currentAppZoom = 1,
  projectDateRange,
  visibleDateRange,
}: ExportRendererProps): JSX.Element {
  // Get chart settings from store
  const holidayRegion = useChartStore((state) => state.holidayRegion);
  const colorModeState = useChartStore((state) => state.colorModeState);

  // Compute full layout geometry (shared with calculateExportDimensions)
  const layout = useMemo(
    () =>
      computeExportLayout(
        tasks,
        options,
        columnWidths,
        currentAppZoom,
        projectDateRange,
        visibleDateRange
      ),
    [
      tasks,
      options,
      columnWidths,
      currentAppZoom,
      projectDateRange,
      visibleDateRange,
    ]
  );

  // Pre-compute parent IDs for O(1) hasChildren lookup
  const parentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const ft of layout.flattenedTasks) {
      if (ft.task.parent) ids.add(ft.task.parent);
    }
    return ids;
  }, [layout.flattenedTasks]);

  // Compute color map for all tasks (respects current color mode)
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    layout.orderedTasks.forEach((task) => {
      const color = getComputedTaskColor(
        task,
        layout.orderedTasks,
        colorModeState
      );
      map.set(task.id, color);
    });
    return map;
  }, [layout.orderedTasks, colorModeState]);

  const { densityConfig } = layout;
  const bgColor =
    options.background === "white" ? COLORS.neutral[0] : "transparent";

  return (
    <div
      className="export-container"
      style={{
        width: layout.totalWidth,
        height: layout.totalHeight,
        backgroundColor: bgColor,
        display: "flex",
        flexDirection: "column",
        fontFamily: SVG_FONT_FAMILY,
      }}
    >
      {/* Header Row */}
      {options.includeHeader && (
        <div className="flex" style={{ height: HEADER_HEIGHT }}>
          {layout.hasTaskList && (
            <ExportTaskTableHeader
              selectedColumns={layout.selectedColumns}
              columnWidths={layout.effectiveColumnWidths}
              width={layout.taskTableWidth}
            />
          )}
          <svg
            width={layout.timelineWidth}
            height={HEADER_HEIGHT}
            className="block"
            style={{ backgroundColor: bgColor }}
          >
            <TimelineHeader scale={layout.scale} width={layout.timelineWidth} />
          </svg>
        </div>
      )}

      {/* Content Row */}
      <div className="flex" style={{ height: layout.contentHeight }}>
        {layout.hasTaskList && (
          <ExportTaskTableRows
            flattenedTasks={layout.flattenedTasks}
            parentIds={parentIds}
            selectedColumns={layout.selectedColumns}
            columnWidths={layout.effectiveColumnWidths}
            width={layout.taskTableWidth}
            height={layout.contentHeight}
            densityLayout={{
              rowHeight: densityConfig.rowHeight,
              colorBarHeight: densityConfig.colorBarHeight,
              indentSize: densityConfig.indentSize,
              fontSizeCell: densityConfig.fontSizeCell,
              cellPaddingX: densityConfig.cellPaddingX,
            }}
            colorMap={colorMap}
          />
        )}

        <svg
          width={layout.timelineWidth}
          height={layout.contentHeight}
          className="gantt-chart block"
          style={{ backgroundColor: bgColor }}
        >
          {options.includeGridLines && (
            <GridLines
              scale={layout.scale}
              taskCount={layout.orderedTasks.length}
              showWeekends={options.includeWeekends}
              showHolidays={options.includeHolidays}
              holidayRegion={holidayRegion}
              width={layout.timelineWidth}
              rowHeight={densityConfig.rowHeight}
            />
          )}

          {options.includeDependencies && (
            <DependencyArrows
              tasks={layout.orderedTasks}
              scale={layout.scale}
              rowHeight={densityConfig.rowHeight}
              dragState={{
                isDragging: false,
                fromTaskId: null,
                currentPosition: { x: 0, y: 0 },
              }}
            />
          )}

          <g className="layer-tasks">
            {layout.orderedTasks.map((task, index) => (
              <TaskBar
                key={task.id}
                task={task}
                scale={layout.scale}
                rowIndex={index}
                labelPosition={options.taskLabelPosition}
                isExport
                densityOverride={{
                  rowHeight: densityConfig.rowHeight,
                  taskBarHeight: densityConfig.taskBarHeight,
                  taskBarOffset: densityConfig.taskBarOffset,
                  fontSizeBar: densityConfig.fontSizeBar,
                }}
              />
            ))}
          </g>

          {options.includeTodayMarker && (
            <TodayMarker
              scale={layout.scale}
              svgHeight={layout.contentHeight}
            />
          )}
        </svg>
      </div>
    </div>
  );
}

// =============================================================================
// Dimension Calculator (public API for non-React callers)
// =============================================================================

/**
 * Calculate the export dimensions based on options.
 * Delegates to computeExportLayout for all geometry calculations.
 */
export function calculateExportDimensions(
  tasks: Task[],
  options: ExportOptions,
  columnWidths: Record<string, number> = {},
  currentAppZoom: number = 1,
  projectDateRange?: { start: Date; end: Date },
  visibleDateRange?: { start: Date; end: Date }
): { width: number; height: number; effectiveZoom: number } {
  const layout = computeExportLayout(
    tasks,
    options,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange
  );

  return {
    width: Math.round(layout.totalWidth),
    height: Math.round(layout.totalHeight),
    effectiveZoom: layout.effectiveZoom,
  };
}
