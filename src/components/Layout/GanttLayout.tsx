/**
 * GanttLayout - SVAR-style sticky scroll layout for Gantt chart with split pane
 *
 * Architecture:
 * outerScrollRef (overflow-y: auto) ← Vertical scrollbar
 * └── pseudo-rows (height: totalContentHeight)
 *     └── stickyContainer (sticky, height: viewportHeight)
 *         └── Layout
 *             └── SplitPane
 *                 ├── Left: TaskTableHeader + TaskTable (resizable)
 *                 └── Right: TimelineHeader + ChartCanvas (fills remaining space)
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
import { ChartCanvas } from "../GanttChart";
import { TimelineHeader } from "../GanttChart";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { SplitPane } from "./SplitPane";
import { useTableDimensions } from "../../hooks/useTableDimensions";
import { useFlattenedTasks } from "../../hooks/useFlattenedTasks";

const ROW_HEIGHT = 44; // Must match TaskTable row height
const HEADER_HEIGHT = 48; // Timeline header height
const MIN_TABLE_WIDTH = 200; // Minimum width for task table
const SCROLLBAR_HEIGHT = 17; // Reserve space for horizontal scrollbar

export function GanttLayout() {
  // Refs for scroll synchronization and measurements
  const outerScrollRef = useRef<HTMLDivElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const timelineHeaderScrollRef = useRef<HTMLDivElement>(null);
  const taskTableScrollRef = useRef<HTMLDivElement>(null);
  const taskTableHeaderScrollRef = useRef<HTMLDivElement>(null);

  // State for dimensions and scroll
  const [viewportHeight, setViewportHeight] = useState(600);
  const [chartContainerWidth, setChartContainerWidth] = useState(800);
  const [scrollTop, setScrollTop] = useState(0);

  // Task store
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const toggleTaskSelection = useTaskStore(
    (state) => state.toggleTaskSelection
  );
  const taskTableWidth = useTaskStore((state) => state.taskTableWidth);
  const setTaskTableWidth = useTaskStore((state) => state.setTaskTableWidth);

  // Build flattened task list (centralized in hook, shared with TaskTable)
  const { flattenedTasks, orderedTasks } = useFlattenedTasks();

  // Table dimensions
  const { totalColumnWidth } = useTableDimensions();

  // Chart state for headers
  const scale = useChartStore((state) => state.scale);
  const containerWidth = useChartStore((state) => state.containerWidth);

  // Effective table width: either manually set or total column width
  const effectiveTableWidth = taskTableWidth ?? totalColumnWidth;

  // Auto-adjust table width if it exceeds total column width
  useEffect(() => {
    if (taskTableWidth !== null && taskTableWidth > totalColumnWidth) {
      setTaskTableWidth(totalColumnWidth);
    }
  }, [totalColumnWidth, taskTableWidth, setTaskTableWidth]);

  // Calculate total content height (visible tasks after flattening + placeholder row)
  // Add scrollbar height to ensure last row isn't hidden behind horizontal scrollbar
  const totalContentHeight =
    (flattenedTasks.length + 1) * ROW_HEIGHT + HEADER_HEIGHT + SCROLLBAR_HEIGHT;

  // Ensure timeline header fills at least the container width
  const timelineHeaderWidth = scale
    ? Math.max(scale.totalWidth, containerWidth)
    : containerWidth;

  // Content area height (viewport minus header)
  const contentAreaHeight = viewportHeight - HEADER_HEIGHT;

  // Handle vertical scroll from outer container
  const handleOuterScroll = useCallback(() => {
    const el = outerScrollRef.current;
    if (el) {
      setScrollTop(el.scrollTop);
    }
  }, []);

  // Synchronize horizontal scrolling between timeline header and chart content
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    const headerScroll = timelineHeaderScrollRef.current;

    if (!chartContainer || !headerScroll) return;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      return () => {
        target.scrollLeft = source.scrollLeft;
      };
    };

    const chartToHeader = syncScroll(chartContainer, headerScroll);
    const headerToChart = syncScroll(headerScroll, chartContainer);

    chartContainer.addEventListener("scroll", chartToHeader);
    headerScroll.addEventListener("scroll", headerToChart);

    return () => {
      chartContainer.removeEventListener("scroll", chartToHeader);
      headerScroll.removeEventListener("scroll", headerToChart);
    };
  }, []);

  // Synchronize horizontal scrolling between task table header and content
  useEffect(() => {
    const tableContainer = taskTableScrollRef.current;
    const headerScroll = taskTableHeaderScrollRef.current;

    if (!tableContainer || !headerScroll) return;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      return () => {
        target.scrollLeft = source.scrollLeft;
      };
    };

    const tableToHeader = syncScroll(tableContainer, headerScroll);
    const headerToTable = syncScroll(headerScroll, tableContainer);

    tableContainer.addEventListener("scroll", tableToHeader);
    headerScroll.addEventListener("scroll", headerToTable);

    return () => {
      tableContainer.removeEventListener("scroll", tableToHeader);
      headerScroll.removeEventListener("scroll", headerToTable);
    };
  }, []);

  // Measure viewport dimensions on mount and window resize
  useEffect(() => {
    const measureDimensions = () => {
      if (outerScrollRef.current) {
        const height = outerScrollRef.current.getBoundingClientRect().height;
        if (height > 100) {
          setViewportHeight(height);
        }
      }

      if (chartContainerRef.current) {
        const width = chartContainerRef.current.getBoundingClientRect().width;
        if (width > 100) {
          setChartContainerWidth(width);
        }
      }
    };

    // Initial measurement (delayed to ensure DOM is ready)
    const timer = setTimeout(measureDimensions, 0);

    // Update on window resize
    window.addEventListener("resize", measureDimensions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureDimensions);
    };
  }, []);

  // ResizeObserver for more accurate measurements
  useEffect(() => {
    const outerScroll = outerScrollRef.current;
    const chartContainer = chartContainerRef.current;

    if (!outerScroll || !chartContainer) return;

    const ro = new ResizeObserver(() => {
      setViewportHeight(outerScroll.offsetHeight);
      setChartContainerWidth(chartContainer.offsetWidth);
    });

    ro.observe(outerScroll);
    ro.observe(chartContainer);

    return () => ro.disconnect();
  }, []);

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
          className="sticky top-0 h-full max-h-screen overflow-hidden bg-gray-50"
          style={{ height: viewportHeight || "100%" }}
        >
          {/* Layout - flex column with split pane */}
          <div className="flex flex-col h-full">
            {/* Split Pane with Header Row and Content Row */}
            <SplitPane
              leftWidth={effectiveTableWidth}
              minLeftWidth={MIN_TABLE_WIDTH}
              maxLeftWidth={totalColumnWidth}
              onLeftWidthChange={setTaskTableWidth}
              leftContent={
                <div className="flex flex-col h-full">
                  {/* TaskTable Header - scrollable but hidden scrollbar */}
                  <div
                    ref={taskTableHeaderScrollRef}
                    className="flex-shrink-0 bg-white border-b border-gray-200 overflow-x-auto overflow-y-hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <TaskTableHeader />
                  </div>
                  {/* Task Table Content with virtual scrolling and horizontal scroll */}
                  <div
                    ref={taskTableScrollRef}
                    className="flex-1 overflow-x-auto overflow-y-hidden"
                    style={{ height: contentAreaHeight }}
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
                    className="flex-shrink-0 bg-white overflow-x-auto overflow-y-hidden border-b border-gray-200"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {scale && (
                      <svg
                        width={timelineHeaderWidth}
                        height={HEADER_HEIGHT}
                        className="block select-none"
                      >
                        <TimelineHeader
                          scale={scale}
                          width={timelineHeaderWidth}
                        />
                      </svg>
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
                      className="absolute inset-0 bg-white overflow-x-auto overflow-y-hidden"
                    >
                      <div style={{ transform: `translateY(-${scrollTop}px)` }}>
                        <ChartCanvas
                          tasks={orderedTasks}
                          selectedTaskIds={selectedTaskIds}
                          onTaskClick={toggleTaskSelection}
                          containerHeight={contentAreaHeight}
                          containerWidth={chartContainerWidth}
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
