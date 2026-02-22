/**
 * Pure layout calculation functions for GanttLayout.
 * Extracted for testability and to keep the component focused on rendering.
 */

import {
  HEADER_HEIGHT,
  SCROLLBAR_HEIGHT,
  MIN_OVERFLOW,
  PLACEHOLDER_ROW_COUNT,
} from "../config/layoutConstants";

export interface LayoutDimensionsInput {
  /** Number of visible (flattened) tasks */
  taskCount: number;
  /** Row height in pixels (density-dependent) */
  rowHeight: number;
  /** Viewport height in pixels */
  viewportHeight: number;
  /** Total width of the timeline scale, or null if scale not yet initialized */
  scaleTotalWidth: number | null;
  /** Width of the chart container in pixels */
  containerWidth: number;
}

export interface LayoutDimensions {
  /** Total scrollable height including all rows, header, and scrollbar */
  totalContentHeight: number;
  /** Width of the timeline header SVG */
  timelineHeaderWidth: number;
  /** Height of the content area below the header */
  contentAreaHeight: number;
}

export function calculateLayoutDimensions({
  taskCount,
  rowHeight,
  viewportHeight,
  scaleTotalWidth,
  containerWidth,
}: LayoutDimensionsInput): LayoutDimensions {
  const totalContentHeight =
    (taskCount + PLACEHOLDER_ROW_COUNT) * rowHeight +
    HEADER_HEIGHT +
    SCROLLBAR_HEIGHT;

  const timelineHeaderWidth =
    scaleTotalWidth !== null
      ? Math.max(scaleTotalWidth, containerWidth + MIN_OVERFLOW)
      : containerWidth + MIN_OVERFLOW;

  const contentAreaHeight = viewportHeight - HEADER_HEIGHT;

  return { totalContentHeight, timelineHeaderWidth, contentAreaHeight };
}
