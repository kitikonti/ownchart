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
import { useProgressDrag } from "../../hooks/useProgressDrag";
import { useChartStore } from "../../store/slices/chartSlice";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { SVG_FONT_FAMILY } from "../../utils/export/constants";
import { getContrastTextColor } from "../../utils/colorUtils";
import { useComputedTaskColor } from "../../hooks/useComputedTaskColor";
import {
  COLORS,
  CONNECTION_HANDLE,
  TYPOGRAPHY,
} from "../../styles/design-tokens";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Padding between task shape edge and label text */
const LABEL_PADDING = 8;

/** Milestone diamond size bounds (responsive to zoom level) */
const MILESTONE_SIZE_MIN = 6;
const MILESTONE_SIZE_MAX = 10;

/** Corner radius for regular task bars and preview outlines */
const TASK_BAR_RADIUS = 4;

/** Opacity when a task is being dragged (faded original) */
const DRAG_OPACITY = 0.3;

/** Background opacity for the unfilled portion of a progress bar */
const PROGRESS_BG_OPACITY = 0.65;

/** Fill opacity for summary bracket shapes */
const SUMMARY_FILL_OPACITY = 0.9;

/** Progress drag handle dimensions */
const PROGRESS_HANDLE = {
  hitzoneHalfWidth: 9,
  hitzoneHeight: 12,
  triangleHalfWidth: 6,
  triangleHeight: 8,
  /** Minimum bar width to show the progress handle */
  minBarWidth: 30,
} as const;

// =============================================================================
// TYPES
// =============================================================================

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
  /** Hide interactive handles (used for export) */
  isExport?: boolean;
}

/** Shared props for task shape subcomponents (MilestoneDiamond, SummaryBracket) */
interface TaskShapeProps {
  color: string;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent<SVGGElement>) => void;
  onMouseMove?: (e: React.MouseEvent<SVGGElement>) => void;
  cursor?: string;
  opacity?: number;
  taskName: string;
  fontSize?: number;
  labelPosition?: TaskLabelPosition;
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

/** Shared label for milestone and summary shapes (outside the bar) */
function TaskShapeLabel({
  anchorX,
  centerY,
  taskName,
  fontSize = 11,
  labelPosition = "after",
}: {
  /** X coordinate of the shape edge closest to the label */
  anchorX: number;
  centerY: number;
  taskName: string;
  fontSize?: number;
  labelPosition?: TaskLabelPosition;
}): React.ReactElement | null {
  if (labelPosition === "none") return null;

  const isBefore = labelPosition === "before";

  return (
    <text
      x={isBefore ? anchorX - LABEL_PADDING : anchorX + LABEL_PADDING}
      y={centerY + fontSize / 3}
      fontSize={fontSize}
      fontFamily={SVG_FONT_FAMILY}
      fill={COLORS.chart.text}
      fontWeight={TYPOGRAPHY.fontWeight.semibold}
      pointerEvents="none"
      textAnchor={isBefore ? "end" : "start"}
    >
      {taskName}
    </text>
  );
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
}: TaskShapeProps & {
  x: number;
  y: number;
  size: number;
  taskBarHeight?: number;
}): React.ReactElement {
  const centerY = y + taskBarHeight / 2;

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
      <TaskShapeLabel
        anchorX={labelPosition === "before" ? x : x + size * 2}
        centerY={centerY}
        taskName={taskName}
        fontSize={fontSize}
        labelPosition={labelPosition}
      />
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
}: TaskShapeProps & {
  x: number;
  y: number;
  width: number;
  height: number;
}): React.ReactElement {
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
        fillOpacity={opacity * SUMMARY_FILL_OPACITY}
        style={{ cursor: cursor || "grab" }}
      />

      <TaskShapeLabel
        anchorX={labelPosition === "before" ? x : x + width}
        centerY={y + height / 2}
        taskName={taskName}
        fontSize={fontSize}
        labelPosition={labelPosition}
      />
    </g>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const TaskBar = React.memo(function TaskBar({
  task,
  scale,
  rowIndex,
  onClick,
  onDoubleClick,
  densityOverride,
  labelPosition = "inside",
  isExport,
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

  // Progress drag hook (no-ops for milestones/summaries and when showProgress is off)
  const progressDrag = useProgressDrag(task, geometry, showProgress);

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
    if (!task.startDate) return null;
  } else {
    if (!task.startDate || !task.endDate) return null;
  }

  // Prevent onClick when dragging
  const handleClick = (): void => {
    if (!isDragging && onClick) {
      onClick();
    }
  };

  // Progress bar width (use preview during drag)
  const effectiveProgress = progressDrag.previewProgress ?? task.progress;
  const progressWidth = (geometry.width * effectiveProgress) / 100;

  // Milestone rendering with responsive sizing (Data Viz review)
  if (task.type === "milestone") {
    const size = Math.min(
      MILESTONE_SIZE_MAX,
      Math.max(MILESTONE_SIZE_MIN, scale.pixelsPerDay / 2)
    );
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
          opacity={isBeingDragged ? DRAG_OPACITY : 1}
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
            stroke={COLORS.chart.selection}
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
          opacity={isBeingDragged ? DRAG_OPACITY : 1}
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
            stroke={COLORS.chart.selection}
            strokeWidth={2}
            strokeDasharray="4 4"
            rx={TASK_BAR_RADIUS}
            ry={TASK_BAR_RADIUS}
            pointerEvents="none"
          />
        )}
      </g>
    );
  }

  // Regular task bar rendering
  const clipPathId = `clip-${task.id}`;
  const activePreview = preview ?? secondaryPreview;

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
            rx={TASK_BAR_RADIUS}
            ry={TASK_BAR_RADIUS}
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
        fillOpacity={
          isBeingDragged ? DRAG_OPACITY : showProgress ? PROGRESS_BG_OPACITY : 1
        }
        rx={TASK_BAR_RADIUS}
        ry={TASK_BAR_RADIUS}
      />

      {/* Progress bar (uses clip-path to prevent overflow) */}
      {showProgress && effectiveProgress > 0 && (
        <rect
          x={geometry.x}
          y={geometry.y}
          width={progressWidth}
          height={geometry.height}
          fill={computedColor}
          fillOpacity={isBeingDragged ? DRAG_OPACITY : 1}
          clipPath={`url(#${clipPathId})`}
        />
      )}

      {/* Progress drag handle (bottom triangle + invisible hitzone) */}
      {showProgress &&
        geometry.width >= PROGRESS_HANDLE.minBarWidth &&
        !isExport && (
          <>
            {/* Invisible hitzone for easier grabbing */}
            <rect
              x={geometry.x + progressWidth - PROGRESS_HANDLE.hitzoneHalfWidth}
              y={geometry.y + geometry.height - 2}
              width={PROGRESS_HANDLE.hitzoneHalfWidth * 2}
              height={PROGRESS_HANDLE.hitzoneHeight}
              fill="transparent"
              cursor="col-resize"
              pointerEvents="all"
              onMouseDown={progressDrag.onHandleMouseDown}
            />
            {/* Visible triangle handle — tip points UP, touching bar bottom edge */}
            <polygon
              points={`${geometry.x + progressWidth},${geometry.y + geometry.height} ${geometry.x + progressWidth - PROGRESS_HANDLE.triangleHalfWidth},${geometry.y + geometry.height + PROGRESS_HANDLE.triangleHeight} ${geometry.x + progressWidth + PROGRESS_HANDLE.triangleHalfWidth},${geometry.y + geometry.height + PROGRESS_HANDLE.triangleHeight}`}
              fill={CONNECTION_HANDLE.neutralFill}
              stroke={CONNECTION_HANDLE.neutralStroke}
              strokeWidth={1.5}
              className={`progress-handle${progressDrag.isDragging ? " dragging" : ""}`}
              pointerEvents="none"
            />
          </>
        )}

      {/* Preview outline (shown during drag/resize) */}
      {activePreview && (
        <rect
          x={activePreview.x}
          y={activePreview.y}
          width={activePreview.width}
          height={activePreview.height}
          fill="none"
          stroke={COLORS.chart.selection}
          strokeWidth={2}
          strokeDasharray="4 4"
          rx={TASK_BAR_RADIUS}
          ry={TASK_BAR_RADIUS}
          pointerEvents="none"
        />
      )}

      {/* Task name label - position based on labelPosition (Sprint 1.5.9) */}
      {/* During progress drag, show percentage inside the bar instead of name */}
      {labelPosition !== "none" && (
        <text
          x={
            progressDrag.isDragging
              ? geometry.x + LABEL_PADDING
              : labelPosition === "before"
                ? geometry.x - LABEL_PADDING
                : labelPosition === "after"
                  ? geometry.x + geometry.width + LABEL_PADDING
                  : geometry.x + LABEL_PADDING
          }
          y={geometry.y + geometry.height / 2 + densityConfig.fontSizeBar / 3}
          fontSize={densityConfig.fontSizeBar}
          fontFamily={SVG_FONT_FAMILY}
          fill={
            progressDrag.isDragging || labelPosition === "inside"
              ? getContrastTextColor(computedColor)
              : COLORS.chart.text
          }
          textAnchor={
            progressDrag.isDragging
              ? "start"
              : labelPosition === "before"
                ? "end"
                : "start"
          }
          clipPath={
            progressDrag.isDragging || labelPosition === "inside"
              ? `url(#${clipPathId})`
              : undefined
          }
          pointerEvents="none"
        >
          {progressDrag.isDragging ? `${effectiveProgress}%` : task.name}
        </text>
      )}
    </g>
  );
});
