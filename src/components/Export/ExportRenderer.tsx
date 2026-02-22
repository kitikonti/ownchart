/**
 * ExportRenderer - Offscreen renderer for full chart export.
 * Renders the complete chart without scroll limits for PNG export.
 */

import { useMemo } from "react";
import type { Task } from "../../types/chart.types";
import type {
  ExportOptions,
  ExportColumnKey,
  ExportDataColumnKey,
} from "../../utils/export/types";
import {
  calculateTaskTableWidth,
  calculateEffectiveZoom,
  getEffectiveDateRange,
  calculateDurationDays,
  calculateOptimalColumnWidths,
} from "../../utils/export";
import { getTimelineScale } from "../../utils/timelineUtils";
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
import { SVG_FONT_FAMILY } from "../../utils/export/constants";
import { getColumnDisplayValue } from "../../utils/export/columns";
import { getComputedTaskColor } from "../../utils/computeTaskColor";
import { HEADER_HEIGHT } from "../../config/layoutConstants";

interface ExportRendererProps {
  tasks: Task[];
  options: ExportOptions;
  columnWidths: Record<string, number>;
  currentAppZoom?: number;
  projectDateRange?: { start: Date; end: Date };
  visibleDateRange?: { start: Date; end: Date };
}

/** Column definitions for export (labels must match app's tableColumns.ts) */
export const EXPORT_COLUMNS = [
  { key: "color", label: "", defaultWidth: 24 },
  { key: "name", label: "Name", defaultWidth: 200 },
  { key: "startDate", label: "Start Date", defaultWidth: 110 },
  { key: "endDate", label: "End Date", defaultWidth: 110 },
  { key: "duration", label: "Duration", defaultWidth: 70 },
  { key: "progress", label: "%", defaultWidth: 60 },
] as const;

/**
 * Renders the task table header for export.
 */
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
        const col = EXPORT_COLUMNS.find((c) => c.key === key);
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

/**
 * Renders the task table rows for export (without header).
 */
function ExportTaskTableRows({
  flattenedTasks,
  selectedColumns,
  columnWidths,
  width,
  height,
  rowHeight,
  colorBarHeight,
  indentSize,
  fontSizeCell,
  cellPaddingX,
  colorMap,
}: {
  flattenedTasks: FlattenedTask[];
  selectedColumns: ExportColumnKey[];
  columnWidths: Record<string, number>;
  width: number;
  height: number;
  rowHeight: number;
  colorBarHeight: number;
  indentSize: number;
  fontSizeCell: number;
  cellPaddingX: number;
  colorMap: Map<string, string>;
}): JSX.Element {
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
              const col = EXPORT_COLUMNS.find((c) => c.key === key);
              if (!col) return null;
              const colWidth = columnWidths[key] || col.defaultWidth;

              if (key === "color") {
                // Use computed color from colorMap (respects color mode)
                const displayColor = colorMap.get(task.id) || task.color;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-center"
                    style={{
                      width: colWidth,
                      height: rowHeight,
                    }}
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
                // Check if task has children (for expand/collapse indicator)
                const hasChildren = flattenedTasks.some(
                  (ft) => ft.task.parent === task.id
                );
                const isSummary = task.type === "summary";

                return (
                  <div
                    key={key}
                    className="flex items-center gap-1 border-r border-neutral-100"
                    style={{
                      width: colWidth,
                      paddingLeft: `${level * indentSize}px`,
                      paddingRight: 10,
                      height: rowHeight,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {/* Expand/collapse placeholder - matches app's w-4 (16px) */}
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
              // Summary dates/duration are styled differently (text-neutral-500 italic)
              const useSummaryStyle =
                isSummary &&
                (key === "startDate" ||
                  key === "endDate" ||
                  key === "duration");

              const value = getColumnDisplayValue(
                task,
                key as ExportDataColumnKey
              );

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

/**
 * Main export renderer component.
 * Renders the complete chart structure for export capture.
 */
export function ExportRenderer({
  tasks,
  options,
  columnWidths,
  currentAppZoom = 1,
  projectDateRange: providedProjectDateRange,
  visibleDateRange,
}: ExportRendererProps): JSX.Element {
  // Get density configuration based on selected density
  const densityConfig: DensityConfig = DENSITY_CONFIG[options.density];

  // Get holiday region from chart settings (for holiday highlighting)
  const holidayRegion = useChartStore((state) => state.holidayRegion);

  // Build flattened task list (show all tasks, none collapsed for export)
  const flattenedTasks = useMemo(() => {
    // Empty set means nothing is collapsed - show all tasks
    return buildFlattenedTaskList(tasks, new Set<string>());
  }, [tasks]);

  // Extract just the Task objects for rendering
  const orderedTasks = useMemo(() => {
    return flattenedTasks.map((ft) => ft.task);
  }, [flattenedTasks]);

  // Get color mode state for computing task colors
  const colorModeState = useChartStore((state) => state.colorModeState);

  // Compute color map for all tasks (respects current color mode)
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    orderedTasks.forEach((task) => {
      const color = getComputedTaskColor(task, orderedTasks, colorModeState);
      map.set(task.id, color);
    });
    return map;
  }, [orderedTasks, colorModeState]);

  // Calculate project date range from tasks if not provided
  const projectDateRange = useMemo(() => {
    if (providedProjectDateRange) return providedProjectDateRange;
    if (orderedTasks.length === 0) return undefined;
    const range = getDateRange(orderedTasks);
    return {
      start: new Date(range.min),
      end: new Date(range.max),
    };
  }, [orderedTasks, providedProjectDateRange]);

  // Get selected columns (default to all if not specified)
  const selectedColumns = useMemo(
    () =>
      options.selectedColumns || ["name", "startDate", "endDate", "progress"],
    [options.selectedColumns]
  );
  const hasTaskList = selectedColumns.length > 0;

  // Calculate optimal column widths based on content
  // Uses passed columnWidths for user-customized columns (like "name"),
  // calculates optimal width for others based on header + cell content
  const effectiveColumnWidths = useMemo(() => {
    return calculateOptimalColumnWidths(
      selectedColumns,
      orderedTasks,
      options.density,
      columnWidths
    );
  }, [selectedColumns, orderedTasks, options.density, columnWidths]);

  // Calculate task table width first (needed for fitToWidth calculation)
  // Uses export density setting for correct column widths
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(
        selectedColumns,
        effectiveColumnWidths,
        options.density
      )
    : 0;

  // Calculate preliminary zoom (before label padding) for label width estimation
  const preliminaryDuration = useMemo(() => {
    if (!projectDateRange) return 30; // Default duration
    const ms =
      projectDateRange.end.getTime() - projectDateRange.start.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24)) + 14; // +14 for base padding
  }, [projectDateRange]);

  const preliminaryZoom = useMemo(() => {
    return calculateEffectiveZoom(
      options,
      currentAppZoom,
      preliminaryDuration,
      taskTableWidth
    );
  }, [options, currentAppZoom, preliminaryDuration, taskTableWidth]);

  // Calculate effective date range with label padding
  const dateRange = useMemo(() => {
    return getEffectiveDateRange(
      options,
      projectDateRange,
      visibleDateRange,
      orderedTasks,
      preliminaryZoom
    );
  }, [
    options,
    projectDateRange,
    visibleDateRange,
    orderedTasks,
    preliminaryZoom,
  ]);

  // Calculate final project duration in days
  const durationDays = useMemo(() => {
    return calculateDurationDays(dateRange);
  }, [dateRange]);

  // Calculate final effective zoom based on zoom mode
  const effectiveZoom = useMemo(() => {
    return calculateEffectiveZoom(
      options,
      currentAppZoom,
      durationDays,
      taskTableWidth
    );
  }, [options, currentAppZoom, durationDays, taskTableWidth]);

  // Calculate scale with effective zoom
  const scale = useMemo(() => {
    return getTimelineScale(
      dateRange.min,
      dateRange.max,
      1000, // containerWidth not used with fixed zoom
      effectiveZoom
    );
  }, [dateRange, effectiveZoom]);

  // Calculate dimensions - for fitToWidth, total width IS the target
  const timelineWidth =
    options.zoomMode === "fitToWidth"
      ? Math.max(100, options.fitToWidth - taskTableWidth)
      : scale.totalWidth;
  const totalWidth =
    options.zoomMode === "fitToWidth"
      ? options.fitToWidth
      : taskTableWidth + timelineWidth;
  const contentHeight = orderedTasks.length * densityConfig.rowHeight;
  const totalHeight =
    (options.includeHeader ? HEADER_HEIGHT : 0) + contentHeight;

  // Background color
  const bgColor = options.background === "white" ? "#ffffff" : "transparent";

  return (
    <div
      className="export-container"
      style={{
        width: totalWidth,
        height: totalHeight,
        backgroundColor: bgColor,
        display: "flex",
        flexDirection: "column",
        fontFamily: SVG_FONT_FAMILY,
      }}
    >
      {/* Header Row */}
      {options.includeHeader && (
        <div className="flex" style={{ height: HEADER_HEIGHT }}>
          {/* Task table header */}
          {hasTaskList && (
            <ExportTaskTableHeader
              selectedColumns={selectedColumns}
              columnWidths={effectiveColumnWidths}
              width={taskTableWidth}
            />
          )}
          {/* Timeline header */}
          <svg
            width={timelineWidth}
            height={HEADER_HEIGHT}
            className="block"
            style={{ backgroundColor: bgColor }}
          >
            <TimelineHeader scale={scale} width={timelineWidth} />
          </svg>
        </div>
      )}

      {/* Content Row */}
      <div className="flex" style={{ height: contentHeight }}>
        {/* Task table rows */}
        {hasTaskList && (
          <ExportTaskTableRows
            flattenedTasks={flattenedTasks}
            selectedColumns={selectedColumns}
            columnWidths={effectiveColumnWidths}
            width={taskTableWidth}
            height={contentHeight}
            rowHeight={densityConfig.rowHeight}
            colorBarHeight={densityConfig.colorBarHeight}
            indentSize={densityConfig.indentSize}
            fontSizeCell={densityConfig.fontSizeCell}
            cellPaddingX={densityConfig.cellPaddingX}
            colorMap={colorMap}
          />
        )}

        {/* Timeline chart */}
        <svg
          width={timelineWidth}
          height={contentHeight}
          className="gantt-chart block"
          style={{ backgroundColor: bgColor }}
        >
          {/* Grid lines */}
          {options.includeGridLines && (
            <GridLines
              scale={scale}
              taskCount={orderedTasks.length}
              showWeekends={options.includeWeekends}
              showHolidays={options.includeHolidays}
              holidayRegion={holidayRegion}
              width={timelineWidth}
              rowHeight={densityConfig.rowHeight}
            />
          )}

          {/* Dependency arrows */}
          {options.includeDependencies && (
            <DependencyArrows
              tasks={orderedTasks}
              scale={scale}
              rowHeight={densityConfig.rowHeight}
              dragState={{
                isDragging: false,
                fromTaskId: null,
                currentPosition: { x: 0, y: 0 },
              }}
            />
          )}

          {/* Task bars */}
          <g className="layer-tasks">
            {orderedTasks.map((task, index) => (
              <TaskBar
                key={task.id}
                task={task}
                scale={scale}
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

          {/* Today marker */}
          {options.includeTodayMarker && (
            <TodayMarker scale={scale} svgHeight={contentHeight} />
          )}
        </svg>
      </div>
    </div>
  );
}

/**
 * Calculate the export dimensions based on options.
 */
export function calculateExportDimensions(
  tasks: Task[],
  options: ExportOptions,
  columnWidths: Record<string, number> = {},
  currentAppZoom: number = 1,
  projectDateRange?: { start: Date; end: Date },
  visibleDateRange?: { start: Date; end: Date }
): { width: number; height: number; effectiveZoom: number } {
  // Get density configuration based on selected density
  const densityConfig = DENSITY_CONFIG[options.density];

  // Build flattened task list (all expanded for export)
  const flattenedTasks = buildFlattenedTaskList(tasks, new Set<string>());
  const orderedTasks = flattenedTasks.map((ft) => ft.task);

  // Calculate project date range from tasks if not provided
  let effectiveProjectDateRange = projectDateRange;
  if (!effectiveProjectDateRange && orderedTasks.length > 0) {
    const range = getDateRange(orderedTasks);
    effectiveProjectDateRange = {
      start: new Date(range.min),
      end: new Date(range.max),
    };
  }

  // Get selected columns (default to all if not specified)
  const selectedColumns = options.selectedColumns || [
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

  // Calculate task table width first (needed for fitToWidth calculation)
  // Uses export density setting for correct column widths
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(
        selectedColumns,
        effectiveColumnWidths,
        options.density
      )
    : 0;

  // Calculate preliminary zoom for label padding estimation
  let preliminaryDuration = 30; // Default
  if (effectiveProjectDateRange) {
    const ms =
      effectiveProjectDateRange.end.getTime() -
      effectiveProjectDateRange.start.getTime();
    preliminaryDuration = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 14;
  }
  const preliminaryZoom = calculateEffectiveZoom(
    options,
    currentAppZoom,
    preliminaryDuration,
    taskTableWidth
  );

  // Get effective date range based on mode (with label padding)
  const dateRange = getEffectiveDateRange(
    options,
    effectiveProjectDateRange,
    visibleDateRange,
    orderedTasks,
    preliminaryZoom
  );

  // Calculate project duration for zoom calculations
  const durationDays = calculateDurationDays(dateRange);

  // Get effective zoom (passing taskTableWidth for fitToWidth mode)
  const effectiveZoom = calculateEffectiveZoom(
    options,
    currentAppZoom,
    durationDays,
    taskTableWidth
  );

  // Calculate timeline width
  let timelineWidth: number;
  let totalWidth: number;

  if (options.zoomMode === "fitToWidth") {
    // In fitToWidth mode, total width IS the target width
    totalWidth = options.fitToWidth;
    timelineWidth = Math.max(100, totalWidth - taskTableWidth);
  } else {
    // Calculate scale with effective zoom
    const scale = getTimelineScale(
      dateRange.min,
      dateRange.max,
      1000,
      effectiveZoom
    );
    timelineWidth = scale.totalWidth;
    totalWidth = taskTableWidth + timelineWidth;
  }

  const contentHeight = orderedTasks.length * densityConfig.rowHeight;
  const totalHeight =
    (options.includeHeader ? HEADER_HEIGHT : 0) + contentHeight;

  return {
    width: Math.round(totalWidth),
    height: Math.round(totalHeight),
    effectiveZoom,
  };
}
