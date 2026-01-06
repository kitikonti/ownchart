/**
 * ExportRenderer - Offscreen renderer for full chart export.
 * Renders the complete chart without scroll limits for PNG export.
 */

import { useMemo } from "react";
import type { Task } from "../../types/chart.types";
import type { ExportOptions } from "../../utils/export/types";
import { getTimelineScale } from "../../utils/timelineUtils";
import { getDateRange, addDays } from "../../utils/dateUtils";
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
import {
  DENSITY_CONFIG,
  type DensityConfig,
} from "../../types/preferences.types";
import { useChartStore } from "../../store/slices/chartSlice";

interface ExportRendererProps {
  tasks: Task[];
  options: ExportOptions;
  columnWidths: Record<string, number>;
}

const HEADER_HEIGHT = 48;

/** Column definitions for export */
export const EXPORT_COLUMNS = [
  { key: "color", label: "", defaultWidth: 24 },
  { key: "name", label: "Name", defaultWidth: 200 },
  { key: "startDate", label: "Start", defaultWidth: 100 },
  { key: "endDate", label: "End", defaultWidth: 100 },
  { key: "duration", label: "Days", defaultWidth: 60 },
  { key: "progress", label: "%", defaultWidth: 60 },
] as const;

export type ExportColumnKey = (typeof EXPORT_COLUMNS)[number]["key"];

/**
 * Calculate total width for selected columns.
 */
export function calculateTaskTableWidth(
  selectedColumns: ExportColumnKey[],
  columnWidths: Record<string, number>
): number {
  return selectedColumns.reduce((total, key) => {
    const colDef = EXPORT_COLUMNS.find((c) => c.key === key);
    return total + (columnWidths[key] || colDef?.defaultWidth || 100);
  }, 0);
}

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
      className="flex border-b border-gray-200 bg-gray-50 font-medium text-sm text-gray-700"
      style={{ width, minWidth: width, height: HEADER_HEIGHT }}
    >
      {selectedColumns.map((key) => {
        const col = EXPORT_COLUMNS.find((c) => c.key === key);
        if (!col) return null;
        return (
          <div
            key={col.key}
            className="flex items-center border-r border-gray-200 px-3"
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
}: {
  flattenedTasks: FlattenedTask[];
  selectedColumns: ExportColumnKey[];
  columnWidths: Record<string, number>;
  width: number;
  height: number;
  rowHeight: number;
  colorBarHeight: number;
  indentSize: number;
}): JSX.Element {
  return (
    <div
      className="export-task-table bg-white border-r border-gray-200"
      style={{ width, minWidth: width, height }}
    >
      {flattenedTasks.map((flattenedTask, index) => {
        const task = flattenedTask.task;
        const level = flattenedTask.level;
        return (
          <div
            key={task.id}
            className="flex border-b border-gray-100 text-sm"
            style={{ height: rowHeight }}
          >
            {selectedColumns.map((key) => {
              const col = EXPORT_COLUMNS.find((c) => c.key === key);
              if (!col) return null;
              const colWidth = columnWidths[key] || col.defaultWidth;

              if (key === "color") {
                return (
                  <div
                    key={key}
                    className="flex items-center justify-center border-r border-gray-100"
                    style={{
                      width: colWidth,
                      height: rowHeight,
                    }}
                  >
                    <div
                      className="w-1.5 rounded"
                      style={{
                        backgroundColor: task.color,
                        height: colorBarHeight,
                      }}
                    />
                  </div>
                );
              }

              if (key === "name") {
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 border-r border-gray-100"
                    style={{
                      width: colWidth,
                      paddingLeft: `${12 + level * indentSize}px`,
                      paddingRight: 12,
                      height: rowHeight,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <TaskTypeIcon type={task.type} />
                    {task.name || `Task ${index + 1}`}
                  </div>
                );
              }

              let value: string = "—";
              if (key === "startDate") value = task.startDate || "—";
              else if (key === "endDate") value = task.endDate || "—";
              else if (key === "duration")
                value = task.duration !== undefined ? `${task.duration}` : "—";
              else if (key === "progress")
                value = task.progress !== undefined ? `${task.progress}%` : "—";

              return (
                <div
                  key={key}
                  className="flex items-center border-r border-gray-100 text-gray-600 px-3"
                  style={{
                    width: colWidth,
                    height: rowHeight,
                  }}
                >
                  {value}
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

  // Calculate date range from tasks
  const dateRange = useMemo(() => {
    if (orderedTasks.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      return { min: addDays(today, -7), max: addDays(today, 30) };
    }
    const range = getDateRange(orderedTasks);
    // Add padding
    return {
      min: addDays(range.min, -7),
      max: addDays(range.max, 7),
    };
  }, [orderedTasks]);

  // Calculate scale with export zoom
  const scale = useMemo(() => {
    return getTimelineScale(
      dateRange.min,
      dateRange.max,
      1000, // containerWidth not used with fixed zoom
      options.timelineZoom
    );
  }, [dateRange, options.timelineZoom]);

  // Get selected columns (default to all if not specified)
  const selectedColumns = options.selectedColumns || [
    "name",
    "startDate",
    "endDate",
    "progress",
  ];
  const hasTaskList = selectedColumns.length > 0;

  // Calculate dimensions using selected density
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(selectedColumns, columnWidths)
    : 0;
  const timelineWidth = scale.totalWidth;
  const totalWidth = taskTableWidth + timelineWidth;
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
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header Row */}
      {options.includeHeader && (
        <div className="flex" style={{ height: HEADER_HEIGHT }}>
          {/* Task table header */}
          {hasTaskList && (
            <ExportTaskTableHeader
              selectedColumns={selectedColumns}
              columnWidths={columnWidths}
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
            columnWidths={columnWidths}
            width={taskTableWidth}
            height={contentHeight}
            rowHeight={densityConfig.rowHeight}
            colorBarHeight={densityConfig.colorBarHeight}
            indentSize={densityConfig.indentSize}
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
  columnWidths: Record<string, number> = {}
): { width: number; height: number } {
  // Get density configuration based on selected density
  const densityConfig = DENSITY_CONFIG[options.density];

  // Build flattened task list (all expanded for export)
  const flattenedTasks = buildFlattenedTaskList(tasks, new Set<string>());
  const orderedTasks = flattenedTasks.map((ft) => ft.task);

  // Calculate date range
  let dateRange: { min: string; max: string };
  if (orderedTasks.length === 0) {
    const today = new Date().toISOString().split("T")[0];
    dateRange = { min: addDays(today, -7), max: addDays(today, 30) };
  } else {
    const range = getDateRange(orderedTasks);
    dateRange = {
      min: addDays(range.min, -7),
      max: addDays(range.max, 7),
    };
  }

  // Calculate scale
  const scale = getTimelineScale(
    dateRange.min,
    dateRange.max,
    1000,
    options.timelineZoom
  );

  // Get selected columns (default to all if not specified)
  const selectedColumns = options.selectedColumns || [
    "name",
    "startDate",
    "endDate",
    "progress",
  ];
  const hasTaskList = selectedColumns.length > 0;

  // Calculate dimensions using selected density
  const taskTableWidth = hasTaskList
    ? calculateTaskTableWidth(selectedColumns, columnWidths)
    : 0;
  const timelineWidth = scale.totalWidth;
  const totalWidth = taskTableWidth + timelineWidth;
  const contentHeight = orderedTasks.length * densityConfig.rowHeight;
  const totalHeight =
    (options.includeHeader ? HEADER_HEIGHT : 0) + contentHeight;

  return { width: totalWidth, height: totalHeight };
}
