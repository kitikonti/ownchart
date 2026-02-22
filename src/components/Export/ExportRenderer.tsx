/**
 * ExportRenderer - Offscreen renderer for full chart export.
 * Renders the complete chart without scroll limits for PNG export.
 *
 * Layout computation lives in utils/export/exportLayout.ts.
 */

import { useMemo } from "react";
import type { Task } from "../../types/chart.types";
import type {
  ExportColumnKey,
  ExportDataColumnKey,
  ExportLayoutInput,
} from "../../utils/export/types";
import { computeExportLayout } from "../../utils/export/exportLayout";
import { GridLines } from "../GanttChart/GridLines";
import { TaskBar } from "../GanttChart/TaskBar";
import { TodayMarker } from "../GanttChart/TodayMarker";
import { DependencyArrows } from "../GanttChart/DependencyArrows";
import { TimelineHeader } from "../GanttChart/TimelineHeader";
import { TaskTypeIcon } from "../TaskList/TaskTypeIcon";
import type { FlattenedTask } from "../../utils/hierarchy";
import type { DensityConfig } from "../../types/preferences.types";
import { useChartStore } from "../../store/slices/chartSlice";
import { HEADER_HEIGHT, SVG_FONT_FAMILY } from "../../utils/export/constants";
import { EXPORT_COLUMN_MAP } from "../../utils/export/columns";
import { getComputedTaskColor } from "../../utils/computeTaskColor";
import { COLORS } from "../../styles/design-tokens";

// =============================================================================
// Types
// =============================================================================

interface ExportRendererProps extends ExportLayoutInput {
  columnWidths: Record<string, number>;
}

/** Density-related layout props for export table cells */
type DensityLayoutProps = Pick<
  DensityConfig,
  | "rowHeight"
  | "colorBarHeight"
  | "indentSize"
  | "fontSizeCell"
  | "cellPaddingX"
>;

// =============================================================================
// Constants
// =============================================================================

/** Static drag state for export (no interaction possible) */
const EXPORT_DRAG_STATE = {
  isDragging: false,
  fromTaskId: null,
  currentPosition: { x: 0, y: 0 },
} as const;

// =============================================================================
// Sub-Components
// =============================================================================

/** Renders the task table header for export. */
function ExportTaskTableHeader({
  selectedColumns,
  columnWidths,
  width,
  cellPaddingX,
}: {
  selectedColumns: ExportColumnKey[];
  columnWidths: Record<string, number>;
  width: number;
  cellPaddingX: number;
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
            className={`flex items-center text-xs font-semibold text-neutral-600 uppercase tracking-wider ${col.key !== "color" ? "border-r border-neutral-200" : ""}`}
            style={{
              width: columnWidths[col.key] || col.defaultWidth,
              height: HEADER_HEIGHT,
              paddingLeft: cellPaddingX,
              paddingRight: cellPaddingX,
            }}
          >
            {col.label}
          </div>
        );
      })}
    </div>
  );
}

/** Maps a data column key to its display value for a given task. */
export function getColumnDisplayValue(
  task: Task,
  key: ExportDataColumnKey
): string | null {
  if (key === "startDate") return task.startDate || null;

  const isMilestone = task.type === "milestone";
  const isSummary = task.type === "summary";

  if (key === "endDate") {
    return isMilestone ? "" : task.endDate || null;
  }
  if (key === "duration") {
    if (isMilestone) return "";
    if (isSummary && task.duration !== undefined && task.duration > 0) {
      return `${task.duration} days`;
    }
    if (!isSummary && task.duration !== undefined) {
      return `${task.duration}`;
    }
    return null;
  }
  if (key === "progress") {
    return task.progress !== undefined ? `${task.progress}%` : null;
  }
  return null;
}

/** Renders a single cell in the export task table. */
function ExportTableCell({
  task,
  columnKey,
  colWidth,
  level,
  index,
  parentIds,
  densityLayout,
  colorMap,
}: {
  task: Task;
  columnKey: ExportColumnKey;
  colWidth: number;
  level: number;
  index: number;
  parentIds: Set<string>;
  densityLayout: DensityLayoutProps;
  colorMap: Map<string, string>;
}): JSX.Element {
  const { rowHeight, colorBarHeight, indentSize, cellPaddingX } = densityLayout;

  if (columnKey === "color") {
    const displayColor = colorMap.get(task.id) || task.color;
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: colWidth, height: rowHeight }}
      >
        <div
          className="w-1.5 rounded"
          style={{ backgroundColor: displayColor, height: colorBarHeight }}
        />
      </div>
    );
  }

  if (columnKey === "name") {
    const hasChildren = parentIds.has(task.id);
    const isSummary = task.type === "summary";
    return (
      <div
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
        <span className="flex-1">{task.name || `Task ${index + 1}`}</span>
      </div>
    );
  }

  // Data column (startDate, endDate, duration, progress)
  const useSummaryStyle =
    task.type === "summary" &&
    (columnKey === "startDate" ||
      columnKey === "endDate" ||
      columnKey === "duration");

  const value = getColumnDisplayValue(task, columnKey);

  return (
    <div
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
  return (
    <div
      className="export-task-table bg-white border-r border-neutral-200"
      style={{ width, minWidth: width, height }}
    >
      {flattenedTasks.map((flattenedTask, index) => {
        const task = flattenedTask.task;
        return (
          <div
            key={task.id}
            className="flex border-b border-neutral-100"
            style={{
              height: densityLayout.rowHeight,
              fontSize: densityLayout.fontSizeCell,
            }}
          >
            {selectedColumns.map((key) => {
              const col = EXPORT_COLUMN_MAP.get(key);
              if (!col) return null;
              return (
                <ExportTableCell
                  key={key}
                  task={task}
                  columnKey={key}
                  colWidth={columnWidths[key] || col.defaultWidth}
                  level={flattenedTask.level}
                  index={index}
                  parentIds={parentIds}
                  densityLayout={densityLayout}
                  colorMap={colorMap}
                />
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
      computeExportLayout({
        tasks,
        options,
        columnWidths,
        currentAppZoom,
        projectDateRange,
        visibleDateRange,
      }),
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
    for (const task of layout.orderedTasks) {
      const color = getComputedTaskColor(
        task,
        layout.orderedTasks,
        colorModeState
      );
      map.set(task.id, color);
    }
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
              cellPaddingX={densityConfig.cellPaddingX}
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
              dragState={EXPORT_DRAG_STATE}
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
