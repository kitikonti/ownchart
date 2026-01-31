/**
 * TaskBar component for rendering individual tasks on the Gantt chart
 * Features: Progress bars, clip-path, responsive milestone rendering, drag-to-edit
 */

import React, { useMemo } from "react";
import type { Task } from "../../types/chart.types";
import type {
  TimelineScale,
  DensityGeometryConfig,
} from "../../utils/timelineUtils";
import type { TaskLabelPosition } from "../../types/preferences.types";
import { getTaskBarGeometry, dateToPixel } from "../../utils/timelineUtils";
import { calculateDuration, addDays } from "../../utils/dateUtils";
import { useTaskBarInteraction } from "../../hooks/useTaskBarInteraction";
import { useChartStore } from "../../store/slices/chartSlice";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { SVG_FONT_FAMILY } from "../../utils/export/constants";
import { getContrastTextColor } from "../../utils/colorUtils";
import { useComputedTaskColor } from "../../hooks/useComputedTaskColor";

interface TaskBarProps {
  task: Task;
  scale: TimelineScale;
  rowIndex: number;
  onClick?: () => void;
  onDoubleClick?: () => void;
  /** Override density config (used for export) */
  densityOverride?: {
    rowHeight: number;
    taskBarHeight: number;
    taskBarOffset: number;
    fontSizeBar: number;
  };
  /** Task label position (Sprint 1.5.9). Defaults to 'inside' */
  labelPosition?: TaskLabelPosition;
}

// Milestone diamond component
function MilestoneDiamond({
  x,
  y,
  size,
  color,
  onClick,
  onMouseDown,
  onMouseMove,
  cursor,
  opacity = 1,
  taskBarHeight = 26,
  taskName,
  fontSize = 11,
  labelPosition = "after",
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent<SVGGElement>) => void;
  onMouseMove?: (e: React.MouseEvent<SVGGElement>) => void;
  cursor?: string;
  opacity?: number;
  taskBarHeight?: number;
  taskName: string;
  fontSize?: number;
  labelPosition?: TaskLabelPosition;
}): JSX.Element {
  const centerY = y + taskBarHeight / 2; // Center of task bar

  return (
    <g
      className="task-bar milestone"
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      style={{ cursor: cursor || "pointer" }}
    >
      <path
        d={`M ${x} ${centerY}
            L ${x + size} ${centerY - size}
            L ${x + size * 2} ${centerY}
            L ${x + size} ${centerY + size}
            Z`}
        fill={color}
        fillOpacity={opacity}
      />
      {/* Task name label */}
      {labelPosition !== "none" && (
        <text
          x={labelPosition === "before" ? x - 8 : x + size * 2 + 8}
          y={centerY + fontSize / 3}
          fontSize={fontSize}
          fontFamily={SVG_FONT_FAMILY}
          fill="#495057"
          fontWeight={600}
          pointerEvents="none"
          textAnchor={labelPosition === "before" ? "end" : "start"}
        >
          {taskName}
        </text>
      )}
    </g>
  );
}

// Summary bracket component (clamp shape with downward tips)
function SummaryBracket({
  x,
  y,
  width,
  height,
  color,
  onClick,
  onMouseDown,
  onMouseMove,
  cursor,
  opacity = 1,
  taskName,
  fontSize = 11,
  labelPosition = "after",
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent<SVGGElement>) => void;
  onMouseMove?: (e: React.MouseEvent<SVGGElement>) => void;
  cursor?: string;
  opacity?: number;
  taskName: string;
  fontSize?: number;
  labelPosition?: TaskLabelPosition;
}): JSX.Element {
  const tipHeight = height * 0.5; // Height of downward triangular tips (50% of bar height)
  const barThickness = height * 0.3; // Horizontal bar thickness (30% of bar height)
  const tipWidth = tipHeight * 0.577; // For 60-degree angle (tipHeight / tan(60°))
  const cornerRadius = 10; // Radius for top corners
  const innerRadius = 3; // Radius for inner corners where tips meet bar

  // Combined path for entire bracket (bar + both tips) with rounded inner corners
  const bracketPath = `
    M ${x + cornerRadius} ${y}
    L ${x + width - cornerRadius} ${y}
    Q ${x + width} ${y} ${x + width} ${y + cornerRadius}
    L ${x + width} ${y + barThickness}
    L ${x + width} ${y + barThickness + tipHeight}
    L ${x + width - tipWidth + innerRadius} ${y + barThickness + innerRadius}
    Q ${x + width - tipWidth} ${y + barThickness} ${x + width - tipWidth - innerRadius} ${y + barThickness}
    L ${x + tipWidth + innerRadius} ${y + barThickness}
    Q ${x + tipWidth} ${y + barThickness} ${x + tipWidth - innerRadius} ${y + barThickness + innerRadius}
    L ${x} ${y + barThickness + tipHeight}
    L ${x} ${y + barThickness}
    L ${x} ${y + cornerRadius}
    Q ${x} ${y} ${x + cornerRadius} ${y}
    Z
  `;

  return (
    <g
      className="task-bar summary"
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
    >
      {/* Complete bracket (bar + tips) as single path for unified outline */}
      <path
        d={bracketPath}
        fill={color}
        fillOpacity={opacity * 0.9}
        style={{ cursor: cursor || "grab" }}
      />

      {/* Task name label - position based on labelPosition */}
      {labelPosition !== "none" && (
        <text
          x={labelPosition === "before" ? x - 8 : x + width + 8}
          y={y + height / 2 + fontSize / 3}
          fontSize={fontSize}
          fontFamily={SVG_FONT_FAMILY}
          fill="#495057"
          fontWeight={600}
          pointerEvents="none"
          textAnchor={labelPosition === "before" ? "end" : "start"}
        >
          {taskName}
        </text>
      )}
    </g>
  );
}

export const TaskBar = React.memo(function TaskBar({
  task,
  scale,
  rowIndex,
  onClick,
  onDoubleClick,
  densityOverride,
  labelPosition = "inside",
}: TaskBarProps) {
  // Get density configuration for dynamic sizing
  const storeDensityConfig = useDensityConfig();

  // Use override if provided (for export), otherwise use store config
  const densityConfig = densityOverride || storeDensityConfig;

  // Get computed task color based on current color mode
  const computedColor = useComputedTaskColor(task);

  // Create density geometry config for getTaskBarGeometry
  const densityGeometry: DensityGeometryConfig = useMemo(
    () => ({
      rowHeight: densityConfig.rowHeight,
      taskBarHeight: densityConfig.taskBarHeight,
      taskBarOffset: densityConfig.taskBarOffset,
    }),
    [
      densityConfig.rowHeight,
      densityConfig.taskBarHeight,
      densityConfig.taskBarOffset,
    ]
  );

  // All hooks must be called before any conditional returns
  const geometry = useMemo(
    () => getTaskBarGeometry(task, scale, rowIndex, densityGeometry, 0), // headerHeight = 0 (header in separate SVG)
    [task, scale, rowIndex, densityGeometry]
  );

  // Shared drag state for multi-task preview
  const sharedDragState = useChartStore((state) => state.dragState);
  const showProgress = useChartStore((state) => state.showProgress);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);

  // Interaction hook for drag-to-edit functionality
  const {
    mode,
    previewGeometry,
    cursor,
    isDragging,
    onMouseDown,
    onMouseMove: onMouseMoveForCursor,
  } = useTaskBarInteraction(task, scale, geometry);

  // Calculate preview geometry if dragging/resizing (for the source task)
  const preview = useMemo(() => {
    if (!previewGeometry) return null;

    const x = dateToPixel(previewGeometry.startDate, scale);
    const width =
      calculateDuration(previewGeometry.startDate, previewGeometry.endDate) *
      scale.pixelsPerDay;

    return {
      x,
      y: geometry.y,
      width,
      height: geometry.height,
    };
  }, [previewGeometry, scale, geometry]);

  // Calculate secondary preview for tasks that are part of selection but not the drag source
  const secondaryPreview = useMemo(() => {
    // Only show secondary preview if:
    // 1. There's an active drag from another task
    // 2. This task is in the selection
    // 3. This task is not the drag source
    if (!sharedDragState) return null;
    if (sharedDragState.sourceTaskId === task.id) return null;
    if (!selectedTaskIds.includes(task.id)) return null;
    // Only show secondary preview if the drag source is also in the selection
    if (!selectedTaskIds.includes(sharedDragState.sourceTaskId)) return null;

    const deltaDays = sharedDragState.deltaDays;
    if (deltaDays === 0) return null;

    const newStartDate = addDays(task.startDate, deltaDays);
    const newEndDate = task.endDate ? addDays(task.endDate, deltaDays) : "";

    const x = dateToPixel(newStartDate, scale);
    const width = task.endDate
      ? calculateDuration(newStartDate, newEndDate) * scale.pixelsPerDay
      : 0;

    return {
      x,
      y: geometry.y,
      width,
      height: geometry.height,
      startDate: newStartDate,
      endDate: newEndDate,
    };
  }, [sharedDragState, selectedTaskIds, task, scale, geometry]);

  // Determine if this task should show as "being dragged" (faded)
  const isBeingDragged =
    mode !== "idle" ||
    (sharedDragState &&
      sharedDragState.sourceTaskId !== task.id &&
      selectedTaskIds.includes(task.id) &&
      selectedTaskIds.includes(sharedDragState.sourceTaskId));

  // Don't render if task has no valid dates (e.g., empty summary)
  // Milestones only need startDate, other types need both startDate and endDate
  if (task.type === "milestone") {
    if (!task.startDate || task.startDate === "") {
      return null;
    }
  } else {
    if (
      !task.startDate ||
      !task.endDate ||
      task.startDate === "" ||
      task.endDate === ""
    ) {
      return null;
    }
  }

  // Prevent onClick when dragging
  const handleClick = (): void => {
    if (!isDragging && onClick) {
      onClick();
    }
  };

  // Progress bar width
  const progressWidth = (geometry.width * task.progress) / 100;

  // Milestone rendering with responsive sizing (Data Viz review)
  if (task.type === "milestone") {
    const size = Math.min(10, Math.max(6, scale.pixelsPerDay / 2));
    // Center the diamond in the middle of the day (offset by half day width minus diamond size)
    const centeredX = geometry.x + scale.pixelsPerDay / 2 - size;
    const centerY = geometry.y + densityConfig.taskBarHeight / 2;

    // Calculate preview position if dragging (primary or secondary)
    const previewX = preview
      ? preview.x + scale.pixelsPerDay / 2 - size
      : secondaryPreview
        ? secondaryPreview.x + scale.pixelsPerDay / 2 - size
        : null;

    return (
      <g>
        {/* Original milestone (faded during drag) */}
        <MilestoneDiamond
          x={centeredX}
          y={geometry.y}
          size={size}
          color={computedColor}
          onClick={handleClick}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMoveForCursor}
          cursor={cursor}
          opacity={isBeingDragged ? 0.3 : 1}
          taskBarHeight={densityConfig.taskBarHeight}
          taskName={task.name}
          fontSize={densityConfig.fontSizeBar}
          labelPosition={labelPosition === "inside" ? "after" : labelPosition}
        />

        {/* Preview milestone (solid outline during drag) */}
        {previewX !== null && (
          <path
            d={`M ${previewX} ${centerY}
                L ${previewX + size} ${centerY - size}
                L ${previewX + size * 2} ${centerY}
                L ${previewX + size} ${centerY + size}
                Z`}
            fill="none"
            stroke="#2B88D8"
            strokeWidth={2}
            pointerEvents="none"
          />
        )}
      </g>
    );
  }

  // Summary rendering with bracket/clamp shape
  if (task.type === "summary") {
    // Calculate preview position for summaries (primary or secondary)
    const summaryPreviewX = preview?.x ?? secondaryPreview?.x ?? null;
    const summaryPreviewWidth =
      preview?.width ?? secondaryPreview?.width ?? null;

    return (
      <g>
        {/* Original summary bracket (faded during drag) */}
        <SummaryBracket
          x={geometry.x}
          y={geometry.y}
          width={geometry.width}
          height={geometry.height}
          color={computedColor}
          onClick={handleClick}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMoveForCursor}
          cursor={cursor}
          opacity={isBeingDragged ? 0.3 : 1}
          taskName={task.name}
          fontSize={densityConfig.fontSizeBar}
          labelPosition={labelPosition === "inside" ? "after" : labelPosition}
        />

        {/* Preview outline for summary (shown during drag) */}
        {summaryPreviewX !== null && summaryPreviewWidth !== null && (
          <rect
            x={summaryPreviewX}
            y={geometry.y}
            width={summaryPreviewWidth}
            height={geometry.height * 0.5}
            fill="none"
            stroke="#2B88D8"
            strokeWidth={2}
            strokeDasharray="4 4"
            rx={4}
            ry={4}
            pointerEvents="none"
          />
        )}
      </g>
    );
  }

  // Unique clip-path ID for this task
  const clipPathId = `clip-${task.id}`;

  return (
    <g
      className={`task-bar ${task.type}`}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMoveForCursor}
      style={{ cursor }}
    >
      {/* Clip-path definition */}
      <defs>
        <clipPath id={clipPathId}>
          <rect
            x={geometry.x}
            y={geometry.y}
            width={geometry.width}
            height={geometry.height}
            rx={4}
            ry={4}
          />
        </clipPath>
      </defs>

      {/* Background bar (fades during drag/resize, full opacity when progress hidden) */}
      <rect
        x={geometry.x}
        y={geometry.y}
        width={geometry.width}
        height={geometry.height}
        fill={computedColor}
        fillOpacity={isBeingDragged ? 0.3 : showProgress ? 0.8 : 1}
        rx={4}
        ry={4}
      />

      {/* Progress bar (uses clip-path to prevent overflow) */}
      {showProgress && task.progress > 0 && (
        <rect
          x={geometry.x}
          y={geometry.y}
          width={progressWidth}
          height={geometry.height}
          fill={computedColor}
          fillOpacity={isBeingDragged ? 0.3 : 1}
          clipPath={`url(#${clipPathId})`}
        />
      )}

      {/* Preview outline (shown during drag/resize - primary or secondary) */}
      {(preview || secondaryPreview) && (
        <rect
          x={(preview || secondaryPreview)!.x}
          y={(preview || secondaryPreview)!.y}
          width={(preview || secondaryPreview)!.width}
          height={(preview || secondaryPreview)!.height}
          fill="none"
          stroke="#2B88D8"
          strokeWidth={2}
          strokeDasharray="4 4"
          rx={4}
          ry={4}
          pointerEvents="none"
        />
      )}

      {/* Task name label - position based on labelPosition (Sprint 1.5.9) */}
      {labelPosition !== "none" && (
        <text
          x={
            labelPosition === "before"
              ? geometry.x - 8
              : labelPosition === "after"
                ? geometry.x + geometry.width + 8
                : geometry.x + 8
          }
          y={geometry.y + geometry.height / 2 + densityConfig.fontSizeBar / 3}
          fontSize={densityConfig.fontSizeBar}
          fontFamily={SVG_FONT_FAMILY}
          fill={
            labelPosition === "inside"
              ? getContrastTextColor(computedColor)
              : "#495057"
          }
          textAnchor={labelPosition === "before" ? "end" : "start"}
          clipPath={
            labelPosition === "inside" ? `url(#${clipPathId})` : undefined
          }
          pointerEvents="none"
        >
          {task.name}
        </text>
      )}
    </g>
  );
});
