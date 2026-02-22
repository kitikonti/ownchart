/**
 * GanttLayout - SVAR-style sticky scroll layout for Gantt chart with split pane
 *
 * Architecture:
 * outerScrollRef (overflow-y: auto) <- Vertical scrollbar
 * +-- pseudo-rows (height: totalContentHeight)
 *     +-- stickyContainer (sticky, height: viewportHeight)
 *         +-- Layout
 *             +-- SplitPane
 *                 +-- Left: TaskTableHeader + TaskTable (resizable)
 *                 +-- Right: TimelineHeader + ChartCanvas (fills remaining space)
 *
 * This layout ensures:
 * - Resizable split between TaskTable and Timeline
 * - Horizontal scrollbar in TaskTable when content wider than split width
 * - Synchronized scrolling between timeline header and chart
 * - Virtual scrolling via translateY for performance
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { TaskTable } from "../TaskList/TaskTable";
import { TaskTableHeader } from "../TaskList/TaskTableHeader";
import { ChartCanvas, TimelineHeader, SelectionHighlight } from "../GanttChart";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { SplitPane } from "./SplitPane";
import { useTableDimensions } from "../../hooks/useTableDimensions";
import { useFlattenedTasks } from "../../hooks/useFlattenedTasks";
import { useHeaderDateSelection } from "../../hooks/useHeaderDateSelection";
import { useSyncScroll } from "../../hooks/useSyncScroll";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { useContainerDimensions } from "../../hooks/useContainerDimensions";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import {
  MIN_TABLE_WIDTH,
  SCROLLBAR_HEIGHT,
  MIN_OVERFLOW,
  HEADER_HEIGHT,
  HIDDEN_SCROLLBAR_STYLE,
} from "../../config/layoutConstants";

export function GanttLayout(): JSX.Element {
  // Refs for scroll synchronization and measurements
  const outerScrollRef = useRef<HTMLDivElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const timelineHeaderScrollRef = useRef<HTMLDivElement>(null);
  const taskTableScrollRef = useRef<HTMLDivElement>(null);
  const taskTableHeaderScrollRef = useRef<HTMLDivElement>(null);
  const headerSvgRef = useRef<SVGSVGElement>(null);

  const [scrollTop, setScrollTop] = useState(0);

  // Task store
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const taskTableWidth = useTaskStore((state) => state.taskTableWidth);
  const setTaskTableWidth = useTaskStore((state) => state.setTaskTableWidth);

  // Build flattened task list (centralized in hook, shared with TaskTable)
  const { flattenedTasks, orderedTasks } = useFlattenedTasks();

  // Get density-aware row height (must match TaskTable and ChartCanvas)
  const densityConfig = useDensityConfig();
  const ROW_HEIGHT = densityConfig.rowHeight;

  // Table dimensions
  const { totalColumnWidth } = useTableDimensions();

  // Chart state for headers and infinite scroll
  const scale = useChartStore((state) => state.scale);
  const containerWidth = useChartStore((state) => state.containerWidth);
  const extendDateRange = useChartStore((state) => state.extendDateRange);
  const dateRange = useChartStore((state) => state.dateRange);
  const lastFitToViewTime = useChartStore((state) => state.lastFitToViewTime);
  const fileLoadCounter = useChartStore((state) => state.fileLoadCounter);
  const setViewport = useChartStore((state) => state.setViewport);

  // Header date selection (drag-to-select + context menu)
  const {
    selectionPixelRect,
    contextMenu: headerContextMenu,
    contextMenuItems: headerContextMenuItems,
    closeContextMenu: closeHeaderContextMenu,
    onMouseDown: handleHeaderMouseDown,
    onContextMenu: handleHeaderContextMenu,
  } = useHeaderDateSelection({ headerSvgRef, scale });

  // Task table collapse state
  const isTaskTableCollapsed = useChartStore(
    (state) => state.isTaskTableCollapsed
  );
  const setTaskTableCollapsed = useChartStore(
    (state) => state.setTaskTableCollapsed
  );

  // Effective table width: either manually set or total column width
  const effectiveTableWidth = taskTableWidth ?? totalColumnWidth;

  // Auto-adjust table width if it exceeds total column width
  useEffect(() => {
    if (taskTableWidth !== null && taskTableWidth > totalColumnWidth) {
      setTaskTableWidth(totalColumnWidth);
    }
  }, [totalColumnWidth, taskTableWidth, setTaskTableWidth]);

  // --- Scroll synchronization ---
  useSyncScroll(chartContainerRef, timelineHeaderScrollRef);
  useSyncScroll(taskTableScrollRef, taskTableHeaderScrollRef);

  // Prevent taskTableScrollRef from scrolling vertically (GitHub #16)
  // Browser focus() can scroll overflow containers even with overflow-y:clip in Chromium.
  useEffect(() => {
    const el = taskTableScrollRef.current;
    if (!el) return;
    const resetScroll = (): void => {
      if (el.scrollTop !== 0) el.scrollTop = 0;
    };
    el.addEventListener("scroll", resetScroll);
    return () => el.removeEventListener("scroll", resetScroll);
  }, []);

  // Handle vertical scroll from outer container
  const handleOuterScroll = useCallback((): void => {
    const el = outerScrollRef.current;
    if (el) setScrollTop(el.scrollTop);
  }, []);

  // --- Dimension measurement + viewport tracking ---
  const { viewportHeight, chartContainerWidth } = useContainerDimensions({
    outerScrollRef,
    chartContainerRef,
    setViewport,
  });

  // --- Infinite scroll ---
  useInfiniteScroll({
    chartContainerRef,
    scale,
    dateRange,
    lastFitToViewTime,
    fileLoadCounter,
    extendDateRange,
  });

  // --- Derived layout values ---
  const totalContentHeight =
    (flattenedTasks.length + 1) * ROW_HEIGHT + HEADER_HEIGHT + SCROLLBAR_HEIGHT;

  const timelineHeaderWidth = scale
    ? Math.max(scale.totalWidth, containerWidth + MIN_OVERFLOW)
    : containerWidth + MIN_OVERFLOW;

  const contentAreaHeight = viewportHeight - HEADER_HEIGHT;

  return (
    <div
      ref={outerScrollRef}
      className="flex-1 overflow-y-auto overflow-x-hidden"
      onScroll={handleOuterScroll}
    >
      {/* Pseudo-rows - creates the total scroll height */}
      <div
        style={{ height: totalContentHeight, width: "100%", minHeight: "100%" }}
      >
        {/* Sticky container - stays at top of viewport */}
        <div
          ref={stickyContainerRef}
          className="sticky top-0 h-full max-h-screen overflow-hidden bg-neutral-50"
          style={{ height: viewportHeight || "100%" }}
        >
          {/* Layout - flex column with split pane */}
          <div className="gantt-layout flex flex-col h-full">
            {/* Split Pane with Header Row and Content Row */}
            <SplitPane
              leftWidth={effectiveTableWidth}
              minLeftWidth={MIN_TABLE_WIDTH}
              maxLeftWidth={totalColumnWidth}
              onLeftWidthChange={setTaskTableWidth}
              isCollapsed={isTaskTableCollapsed}
              onCollapsedChange={setTaskTableCollapsed}
              leftContent={
                <div className="flex flex-col h-full">
                  {/* TaskTable Header - scrollable but hidden scrollbar */}
                  <div
                    ref={taskTableHeaderScrollRef}
                    className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-neutral-200/80 overflow-x-auto overflow-y-hidden"
                    style={HIDDEN_SCROLLBAR_STYLE}
                  >
                    <TaskTableHeader />
                  </div>
                  {/* Task Table Content with virtual scrolling and horizontal scroll */}
                  <div
                    ref={taskTableScrollRef}
                    className="flex-1 overflow-x-auto scrollbar-thin"
                    style={{ height: contentAreaHeight, overflowY: "clip" }}
                  >
                    <div style={{ transform: `translateY(-${scrollTop}px)` }}>
                      <TaskTable />
                    </div>
                  </div>
                </div>
              }
              rightContent={
                <div className="flex flex-col h-full">
                  {/* Timeline Header - scrollable and synchronized with chart */}
                  <div
                    ref={timelineHeaderScrollRef}
                    className="flex-shrink-0 bg-white/90 backdrop-blur-sm overflow-x-auto overflow-y-hidden border-b border-neutral-200/80"
                    style={HIDDEN_SCROLLBAR_STYLE}
                  >
                    {scale && (
                      <svg
                        ref={headerSvgRef}
                        width={timelineHeaderWidth}
                        height={HEADER_HEIGHT}
                        className="block select-none"
                        role="img"
                        aria-label="Timeline header"
                        onMouseDown={handleHeaderMouseDown}
                        onContextMenu={handleHeaderContextMenu}
                      >
                        <TimelineHeader
                          scale={scale}
                          width={timelineHeaderWidth}
                        />
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
                      />
                    )}
                  </div>
                  {/* Gantt Chart Area */}
                  <div
                    className="flex-1 h-full relative"
                    style={{ height: contentAreaHeight }}
                  >
                    {/* Gantt Chart Content - scrollable horizontally */}
                    <div
                      ref={chartContainerRef}
                      className="gantt-chart-scroll-container absolute inset-0 bg-white overflow-x-auto scrollbar-thin"
                      style={{ overflowY: "clip" }}
                    >
                      <div style={{ transform: `translateY(-${scrollTop}px)` }}>
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
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
