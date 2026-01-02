/**
 * GanttLayout - SVAR-style sticky scroll layout for Gantt chart
 *
 * Architecture:
 * outerScrollRef (overflow-y: auto) ← Vertical scrollbar
 * └── pseudo-rows (height: totalContentHeight)
 *     └── stickyContainer (sticky, height: viewportHeight)
 *         └── Layout
 *             ├── Header Row (TaskTableHeader + TimelineHeader)
 *             └── Content Row (TaskTable + ChartCanvas with translateY)
 *
 * This layout ensures:
 * - Horizontal scrollbar always visible at viewport bottom
 * - Synchronized scrolling between timeline header and chart
 * - Virtual scrolling via translateY for performance
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { TaskTable } from '../TaskList/TaskTable';
import { TaskTableHeader } from '../TaskList/TaskTableHeader';
import { ChartCanvas } from '../GanttChart';
import { TimelineHeader } from '../GanttChart';
import { useTaskStore } from '../../store/slices/taskSlice';
import { useChartStore } from '../../store/slices/chartSlice';

const ROW_HEIGHT = 44; // Must match TaskTable row height
const HEADER_HEIGHT = 48; // Timeline header height

export function GanttLayout() {
  // Refs for scroll synchronization and measurements
  const outerScrollRef = useRef<HTMLDivElement>(null);
  const stickyContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const timelineHeaderScrollRef = useRef<HTMLDivElement>(null);

  // State for dimensions and scroll
  const [viewportHeight, setViewportHeight] = useState(600);
  const [chartContainerWidth, setChartContainerWidth] = useState(800);
  const [scrollTop, setScrollTop] = useState(0);

  // Task store
  const tasks = useTaskStore((state) => state.tasks);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const toggleTaskSelection = useTaskStore((state) => state.toggleTaskSelection);

  // Chart state for headers
  const scale = useChartStore((state) => state.scale);
  const containerWidth = useChartStore((state) => state.containerWidth);

  // Calculate total content height (all tasks)
  const totalContentHeight = tasks.length * ROW_HEIGHT + HEADER_HEIGHT;

  // Ensure timeline header fills at least the container width
  const timelineHeaderWidth = scale ? Math.max(scale.totalWidth, containerWidth) : containerWidth;

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

    chartContainer.addEventListener('scroll', chartToHeader);
    headerScroll.addEventListener('scroll', headerToChart);

    return () => {
      chartContainer.removeEventListener('scroll', chartToHeader);
      headerScroll.removeEventListener('scroll', headerToChart);
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
    window.addEventListener('resize', measureDimensions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureDimensions);
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
      <div style={{ height: totalContentHeight, width: '100%', minHeight: '100%' }}>
        {/* Sticky container - stays at top of viewport */}
        <div
          ref={stickyContainerRef}
          className="sticky top-0 h-full max-h-screen overflow-hidden bg-gray-50"
          style={{ height: viewportHeight || '100%' }}
        >
          {/* Layout - flex column with headers and content */}
          <div className="flex flex-col h-full">
            {/* Header Row */}
            <div className="flex flex-shrink-0">
              {/* TaskTable Header */}
              <div className="w-auto flex-shrink-0 min-w-[800px] bg-white border-b border-gray-200">
                <TaskTableHeader />
              </div>

              {/* Timeline Header - scrollable and synchronized with chart */}
              <div
                ref={timelineHeaderScrollRef}
                className="flex-1 bg-white overflow-x-auto overflow-y-hidden border-b border-gray-200"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {scale && (
                  <svg width={timelineHeaderWidth} height={HEADER_HEIGHT} className="block select-none">
                    <TimelineHeader scale={scale} width={timelineHeaderWidth} />
                  </svg>
                )}
              </div>
            </div>

            {/* Content Row - uses translateY for virtual scrolling */}
            <div
              className="flex overflow-hidden"
              style={{ height: contentAreaHeight }}
            >
              {/* Task Table Content */}
              <div className="w-auto flex-shrink-0 min-w-[800px] overflow-hidden">
                <div style={{ transform: `translateY(-${scrollTop}px)` }}>
                  <TaskTable />
                </div>
              </div>

              {/* Gantt Chart Area */}
              <div className="flex-1 h-full relative">
                {/* Gantt Chart Content - scrollable horizontally */}
                <div
                  ref={chartContainerRef}
                  className="absolute inset-0 bg-white overflow-x-auto overflow-y-hidden"
                >
                  <div style={{ transform: `translateY(-${scrollTop}px)` }}>
                    <ChartCanvas
                      tasks={tasks}
                      selectedTaskIds={selectedTaskIds}
                      onTaskClick={toggleTaskSelection}
                      containerHeight={contentAreaHeight}
                      containerWidth={chartContainerWidth}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
