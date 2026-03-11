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

/**
 * Compute the three layout dimensions required by GanttLayout.
 *
 * - `totalContentHeight`: sum of all task rows (including placeholder rows),
 *   the sticky header, and the horizontal scrollbar. Determines the scrollable
 *   height of the layout container.
 * - `timelineHeaderWidth`: at least `containerWidth + MIN_OVERFLOW` so the SVG
 *   header always extends beyond the visible viewport; uses `scaleTotalWidth`
 *   when the D3 scale has been initialised and is wider than that minimum.
 * - `contentAreaHeight`: viewport height minus the sticky header; the usable
 *   vertical space for task rows. Clamped to ≥ 0 to handle tiny viewports.
 *
 * All pixel values are expected in CSS pixels. Constants (`HEADER_HEIGHT`,
 * `SCROLLBAR_HEIGHT`, `MIN_OVERFLOW`, `PLACEHOLDER_ROW_COUNT`) are imported
 * from `src/config/layoutConstants`.
 */
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

  const contentAreaHeight = Math.max(0, viewportHeight - HEADER_HEIGHT);

  return { totalContentHeight, timelineHeaderWidth, contentAreaHeight };
}
