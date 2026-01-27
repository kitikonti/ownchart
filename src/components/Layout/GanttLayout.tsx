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
import { flushSync } from "react-dom";
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
  const taskTableWidth = useTaskStore((state) => state.taskTableWidth);
  const setTaskTableWidth = useTaskStore((state) => state.setTaskTableWidth);

  // Build flattened task list (centralized in hook, shared with TaskTable)
  const { flattenedTasks, orderedTasks } = useFlattenedTasks();

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

  // Ensure timeline header is always wider than container to guarantee horizontal scrollbar
  // This enables infinite scroll to work in both directions
  const MIN_OVERFLOW = 400; // Must match ChartCanvas MIN_OVERFLOW
  const timelineHeaderWidth = scale
    ? Math.max(scale.totalWidth, containerWidth + MIN_OVERFLOW)
    : containerWidth + MIN_OVERFLOW;

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

  // Cooldown refs for infinite scroll (prevents rapid-fire extensions)
  const lastExtendPastRef = useRef<number>(0);
  const lastExtendFutureRef = useRef<number>(0);
  const lastFitToViewTimeRef = useRef<number>(0); // Block infinite scroll after fitToView
  const fitToViewScrollLockRef = useRef<boolean>(false); // Lock until user scrolls away from edge
  const mountTimeRef = useRef<number>(Date.now()); // Track component mount time
  const pendingPastExtensionRef = useRef<number | null>(null); // Pending left extension timeout
  const EXTEND_COOLDOWN = 200; // ms between extensions
  const FIT_TO_VIEW_BLOCK_TIME = 500; // ms to block infinite scroll after fitToView
  const INITIAL_BLOCK_TIME = 1000; // ms to block infinite scroll after mount (wait for settings to load)
  const SCROLL_IDLE_TIME = 150; // ms to wait after scroll stops before extending left

  // Track dateRange, fitToView, and file load for scroll positioning
  const prevDateRangeRef = useRef<string | null>(null);
  const prevFitToViewTimeRef = useRef<number>(0);
  const prevFileLoadCounterRef = useRef<number>(fileLoadCounter);
  const SCROLL_OFFSET_DAYS = 83; // Scroll past the extra padding (90 days) to show 7 days before first task

  // Set initial scroll position when a new file is loaded, or reset on fitToView
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer || !scale || !dateRange) return;

    // Check if fitToView was just called
    const fitToViewJustCalled =
      lastFitToViewTime > prevFitToViewTimeRef.current;
    prevFitToViewTimeRef.current = lastFitToViewTime;

    // Check if a file was just loaded (explicit signal from useFileOperations)
    const fileJustLoaded = fileLoadCounter > prevFileLoadCounterRef.current;
    prevFileLoadCounterRef.current = fileLoadCounter;

    const dateRangeKey = `${dateRange.min}-${dateRange.max}`;

    if (fitToViewJustCalled) {
      // fitToView: scroll to show 7-day padding (same as file load)
      // Block infinite scroll for a short time to prevent immediate re-extension
      lastFitToViewTimeRef.current = Date.now();
      // Use double rAF to ensure DOM is fully updated
      const fitScrollLeft = SCROLL_OFFSET_DAYS * scale.pixelsPerDay;
      // If scroll position will be near edge (THRESHOLD), lock infinite scroll until user scrolls away
      if (fitScrollLeft < 400) {
        fitToViewScrollLockRef.current = true;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          chartContainer.scrollLeft = fitScrollLeft;
        });
      });
      prevDateRangeRef.current = dateRangeKey;
      return;
    }

    // Scroll to show first task on initial load (first dateRange) or when a new file is opened
    const isNewDateRange = prevDateRangeRef.current === null;

    if (isNewDateRange || fileJustLoaded) {
      // Scroll to show first task with 7-day gap (skip the extra padding for scroll room)
      const initialScrollLeft = SCROLL_OFFSET_DAYS * scale.pixelsPerDay;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          chartContainer.scrollLeft = initialScrollLeft;
        });
      });
    }

    prevDateRangeRef.current = dateRangeKey;
  }, [dateRange, scale, lastFitToViewTime, fileLoadCounter]);

  // Infinite scroll detection - extend timeline when near edges
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer || !scale) return;

    const THRESHOLD = 500; // px from edge to trigger extension (earlier = smoother)

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = chartContainer;
      const now = Date.now();

      // Block infinite scroll during initial load (wait for settings to be applied)
      if (now - mountTimeRef.current < INITIAL_BLOCK_TIME) {
        return;
      }

      // Block infinite scroll shortly after fitToView to prevent immediate re-extension
      if (now - lastFitToViewTimeRef.current < FIT_TO_VIEW_BLOCK_TIME) {
        return;
      }

      // If scroll lock is active, only release when user scrolls away from edge
      if (fitToViewScrollLockRef.current) {
        if (scrollLeft > 400) {
          fitToViewScrollLockRef.current = false;
        } else {
          return;
        }
      }

      // Near left edge? Schedule extension after scroll stops
      // We must wait for scroll to stop because during active scrollbar drag,
      // the browser overrides any programmatic scrollLeft changes
      if (scrollLeft < THRESHOLD) {
        // Cancel any pending extension
        if (pendingPastExtensionRef.current) {
          clearTimeout(pendingPastExtensionRef.current);
        }

        // Schedule extension after user stops scrolling
        pendingPastExtensionRef.current = window.setTimeout(() => {
          pendingPastExtensionRef.current = null;

          // Re-check conditions after delay
          const currentScrollLeft = chartContainer.scrollLeft;
          const currentScrollWidth = chartContainer.scrollWidth;
          const currentNow = Date.now();

          if (
            currentScrollLeft < THRESHOLD &&
            currentNow - lastExtendPastRef.current > EXTEND_COOLDOWN
          ) {
            lastExtendPastRef.current = currentNow;

            // Capture distance from right edge (preserved during extension)
            const distanceFromRightEdge =
              currentScrollWidth - currentScrollLeft;

            // Extend and correct
            flushSync(() => {
              extendDateRange("past", 30);
            });

            const newScrollWidth = chartContainer.scrollWidth;
            const newScrollLeft = newScrollWidth - distanceFromRightEdge;
            chartContainer.scrollLeft = newScrollLeft;
          }
        }, SCROLL_IDLE_TIME);
      }

      // Near right edge? Extend into future
      if (
        scrollLeft + clientWidth > scrollWidth - THRESHOLD &&
        now - lastExtendFutureRef.current > EXTEND_COOLDOWN
      ) {
        lastExtendFutureRef.current = now;
        extendDateRange("future", 30);
      }
    };

    chartContainer.addEventListener("scroll", handleScroll);
    return () => {
      chartContainer.removeEventListener("scroll", handleScroll);
      // Clear any pending extension timeout
      if (pendingPastExtensionRef.current) {
        clearTimeout(pendingPastExtensionRef.current);
        pendingPastExtensionRef.current = null;
      }
    };
  }, [scale, extendDateRange]);

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

  // Track viewport state for export visible range calculation
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    const updateViewport = () => {
      setViewport(chartContainer.scrollLeft, chartContainer.clientWidth);
    };

    // Initial update
    updateViewport();

    // Update on scroll
    chartContainer.addEventListener("scroll", updateViewport);

    // Update on resize via ResizeObserver
    const ro = new ResizeObserver(updateViewport);
    ro.observe(chartContainer);

    return () => {
      chartContainer.removeEventListener("scroll", updateViewport);
      ro.disconnect();
    };
  }, [setViewport]);

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
              leftContent={
                <div className="flex flex-col h-full">
                  {/* TaskTable Header - scrollable but hidden scrollbar */}
                  <div
                    ref={taskTableHeaderScrollRef}
                    className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-neutral-200/80 overflow-x-auto overflow-y-hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <TaskTableHeader />
                  </div>
                  {/* Task Table Content with virtual scrolling and horizontal scroll */}
                  <div
                    ref={taskTableScrollRef}
                    className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin"
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
                    className="flex-shrink-0 bg-white/90 backdrop-blur-sm overflow-x-auto overflow-y-hidden border-b border-neutral-200/80"
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
                      className="gantt-chart-scroll-container absolute inset-0 bg-white overflow-x-auto overflow-y-hidden scrollbar-thin"
                    >
                      <div style={{ transform: `translateY(-${scrollTop}px)` }}>
                        <ChartCanvas
                          tasks={orderedTasks}
                          selectedTaskIds={selectedTaskIds}
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
