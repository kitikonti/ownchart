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
 * - Virtual scrolling via direct DOM translateY for performance
 */

import { useRef, useEffect } from "react";
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
import { usePreventVerticalScroll } from "../../hooks/usePreventVerticalScroll";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { calculateLayoutDimensions } from "../../utils/layoutCalculations";
import {
  MIN_TABLE_WIDTH,
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
  // Refs for direct DOM translateY updates (avoids React re-render on scroll)
  const taskTableTranslateRef = useRef<HTMLDivElement>(null);
  const chartTranslateRef = useRef<HTMLDivElement>(null);

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
  usePreventVerticalScroll(taskTableScrollRef);

  // Vertical scroll: direct DOM updates to avoid React re-render per scroll tick
  useEffect(() => {
    const el = outerScrollRef.current;
    if (!el) return;
    const handleScroll = (): void => {
      const top = el.scrollTop;
      if (taskTableTranslateRef.current)
        taskTableTranslateRef.current.style.transform = `translateY(-${top}px)`;
      if (chartTranslateRef.current)
        chartTranslateRef.current.style.transform = `translateY(-${top}px)`;
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
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
  const { totalContentHeight, timelineHeaderWidth, contentAreaHeight } =
    calculateLayoutDimensions({
      taskCount: flattenedTasks.length,
      rowHeight: ROW_HEIGHT,
      viewportHeight,
      scaleTotalWidth: scale?.totalWidth ?? null,
      containerWidth,
    });

  return (
    <div
      ref={outerScrollRef}
      className="flex-1 overflow-y-auto overflow-x-hidden"
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
            <SplitPane
              leftWidth={effectiveTableWidth}
              minLeftWidth={MIN_TABLE_WIDTH}
              maxLeftWidth={totalColumnWidth}
              onLeftWidthChange={setTaskTableWidth}
              isCollapsed={isTaskTableCollapsed}
              onCollapsedChange={setTaskTableCollapsed}
              leftContent={
                <div className="flex flex-col h-full">
                  <div
                    ref={taskTableHeaderScrollRef}
                    className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-neutral-200/80 overflow-x-auto overflow-y-hidden"
                    style={HIDDEN_SCROLLBAR_STYLE}
                  >
                    <TaskTableHeader />
                  </div>
                  <div
                    ref={taskTableScrollRef}
                    className="flex-1 overflow-x-auto scrollbar-thin"
                    style={{ height: contentAreaHeight, overflowY: "clip" }}
                  >
                    <div ref={taskTableTranslateRef}>
                      <TaskTable />
                    </div>
                  </div>
                </div>
              }
              rightContent={
                <div className="flex flex-col h-full">
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
                  <div
                    className="flex-1 h-full relative"
                    style={{ height: contentAreaHeight }}
                  >
                    <div
                      ref={chartContainerRef}
                      className="gantt-chart-scroll-container absolute inset-0 bg-white overflow-x-auto scrollbar-thin"
                      style={{ overflowY: "clip" }}
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
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
