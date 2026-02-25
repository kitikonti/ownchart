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
 *                 +-- Right: TimelinePanel (fills remaining space)
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
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { SplitPane } from "./SplitPane";
import { TimelinePanel } from "./TimelinePanel";
import { useTableDimensions } from "../../hooks/useTableDimensions";
import { useFlattenedTasks } from "../../hooks/useFlattenedTasks";
import { useSyncScroll } from "../../hooks/useSyncScroll";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { useContainerDimensions } from "../../hooks/useContainerDimensions";
import { usePreventVerticalScroll } from "../../hooks/usePreventVerticalScroll";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { calculateLayoutDimensions } from "../../utils/layoutCalculations";
import {
  MIN_TABLE_WIDTH,
  HIDDEN_SCROLLBAR_STYLE,
} from "../../config/layoutConstants";

export function GanttLayout(): JSX.Element {
  // Refs for scroll synchronization and measurements
  const outerScrollRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const timelineHeaderScrollRef = useRef<HTMLDivElement>(null);
  const taskTableScrollRef = useRef<HTMLDivElement>(null);
  const taskTableHeaderScrollRef = useRef<HTMLDivElement>(null);
  // Refs for direct DOM translateY updates (avoids React re-render on scroll)
  const taskTableTranslateRef = useRef<HTMLDivElement>(null);
  const chartTranslateRef = useRef<HTMLDivElement>(null);

  // Task store
  const taskTableWidth = useTaskStore((state) => state.taskTableWidth);
  const setTaskTableWidth = useTaskStore((state) => state.setTaskTableWidth);

  // Build flattened task list (centralized in hook, shared with TaskTable)
  const { flattenedTasks, orderedTasks } = useFlattenedTasks();

  // Get density-aware row height (must match TaskTable and ChartCanvas)
  const densityConfig = useDensityConfig();
  const rowHeight = densityConfig.rowHeight;

  // Table dimensions
  const { totalColumnWidth } = useTableDimensions();

  // Chart state for infinite scroll
  const scale = useChartStore((state) => state.scale);
  const containerWidth = useChartStore((state) => state.containerWidth);
  const extendDateRange = useChartStore((state) => state.extendDateRange);
  const dateRange = useChartStore((state) => state.dateRange);
  const lastFitToViewTime = useChartStore((state) => state.lastFitToViewTime);
  const fileLoadCounter = useChartStore((state) => state.fileLoadCounter);
  const setViewport = useChartStore((state) => state.setViewport);

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
      rowHeight,
      viewportHeight,
      scaleTotalWidth: scale?.totalWidth ?? null,
      containerWidth,
    });

  return (
    <div
      ref={outerScrollRef}
      data-scroll-driver
      className="flex-1 overflow-y-auto overflow-x-hidden"
    >
      {/* Pseudo-rows - creates the total scroll height */}
      <div
        style={{ height: totalContentHeight, width: "100%", minHeight: "100%" }}
      >
        {/* Sticky container - stays at top of viewport */}
        <div
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
                <div
                  className="flex flex-col h-full"
                  role="region"
                  aria-label="Task list"
                >
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
                <TimelinePanel
                  timelineHeaderScrollRef={timelineHeaderScrollRef}
                  chartContainerRef={chartContainerRef}
                  chartTranslateRef={chartTranslateRef}
                  timelineHeaderWidth={timelineHeaderWidth}
                  contentAreaHeight={contentAreaHeight}
                  chartContainerWidth={chartContainerWidth}
                  orderedTasks={orderedTasks}
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
