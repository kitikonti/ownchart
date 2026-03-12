/**
 * TimelinePanel - Right panel of the GanttLayout split pane.
 *
 * Contains:
 * - Timeline header with drag-to-select date range and context menu
 * - Chart canvas with task bars, dependencies, and selection overlay
 *
 * Extracted from GanttLayout to keep each component under 200 LOC.
 *
 * Store subscriptions:
 * - chartSlice: `scale` (for header date selection hook)
 * - taskSlice: `selectedTaskIds` (forwarded to ChartCanvas for bar highlighting)
 */

import { useRef, type RefObject } from "react";
import { ChartCanvas, TimelineHeader, SelectionHighlight } from "../GanttChart";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useHeaderDateSelection } from "../../hooks/useHeaderDateSelection";
import {
  HEADER_HEIGHT,
  HIDDEN_SCROLLBAR_STYLE,
  OVERFLOW_Y_CLIP_STYLE,
} from "../../config/layoutConstants";
import type { Task } from "../../types/chart.types";

interface TimelinePanelProps {
  timelineHeaderScrollRef: RefObject<HTMLDivElement>;
  chartContainerRef: RefObject<HTMLDivElement>;
  chartTranslateRef: RefObject<HTMLDivElement>;
  timelineHeaderWidth: number;
  contentAreaHeight: number;
  chartContainerWidth: number;
  orderedTasks: Task[];
}

export function TimelinePanel({
  timelineHeaderScrollRef,
  chartContainerRef,
  chartTranslateRef,
  timelineHeaderWidth,
  contentAreaHeight,
  chartContainerWidth,
  orderedTasks,
}: TimelinePanelProps): JSX.Element {
  const headerSvgRef = useRef<SVGSVGElement>(null);

  const scale = useChartStore((state) => state.scale);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);

  const {
    selectionPixelRect,
    contextMenu: headerContextMenu,
    contextMenuItems: headerContextMenuItems,
    closeContextMenu: closeHeaderContextMenu,
    onMouseDown: handleHeaderMouseDown,
    onContextMenu: handleHeaderContextMenu,
  } = useHeaderDateSelection({ headerSvgRef, scale });

  return (
    <div className="flex flex-col h-full" role="region" aria-label="Timeline">
      <div
        ref={timelineHeaderScrollRef}
        className="flex-shrink-0 bg-white/90 backdrop-blur-sm overflow-x-auto overflow-y-hidden border-b border-neutral-200/80"
        style={HIDDEN_SCROLLBAR_STYLE}
        aria-busy={!scale}
        aria-live="polite"
        aria-label={scale ? "Timeline header" : "Timeline header loading"}
      >
        {scale && (
          <svg
            ref={headerSvgRef}
            width={timelineHeaderWidth}
            height={HEADER_HEIGHT}
            className="block select-none"
            role="application"
            aria-label="Timeline header — drag to select a date range, right-click for options"
            onMouseDown={handleHeaderMouseDown}
            onContextMenu={handleHeaderContextMenu}
          >
            <TimelineHeader scale={scale} width={timelineHeaderWidth} />
            <SelectionHighlight
              rect={selectionPixelRect}
              height={HEADER_HEIGHT}
            />
          </svg>
        )}
        {headerContextMenu && (
          <ContextMenu
            items={headerContextMenuItems}
            position={headerContextMenu}
            onClose={closeHeaderContextMenu}
            ariaLabel="Timeline header actions"
          />
        )}
      </div>
      <div className="flex-1 relative" style={{ height: contentAreaHeight }}>
        <div
          ref={chartContainerRef}
          className="gantt-chart-scroll-container absolute inset-0 bg-white overflow-x-auto scrollbar-thin"
          style={OVERFLOW_Y_CLIP_STYLE}
        >
          <div ref={chartTranslateRef}>
            <ChartCanvas
              tasks={orderedTasks}
              selectedTaskIds={selectedTaskIds}
              containerHeight={contentAreaHeight}
              containerWidth={chartContainerWidth}
              headerSelectionRect={selectionPixelRect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
