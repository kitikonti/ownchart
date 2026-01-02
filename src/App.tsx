import { useRef, useEffect, useState, useCallback } from 'react';
import { ChartBarHorizontal } from '@phosphor-icons/react';
import { Toaster } from 'react-hot-toast';
import { TaskTable } from './components/TaskList/TaskTable';
import { TaskTableHeader } from './components/TaskList/TaskTableHeader';
import { HierarchyButtons } from './components/TaskList/HierarchyButtons';
import { UndoRedoButtons } from './components/Toolbar/UndoRedoButtons';
import { ZoomControls } from './components/Toolbar/ZoomControls';
import { ChartCanvas } from './components/GanttChart';
import { TimelineHeader } from './components/GanttChart';
import { ZoomIndicator } from './components/GanttChart/ZoomIndicator';
import { useTaskStore } from './store/slices/taskSlice';
import { useChartStore } from './store/slices/chartSlice';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const ROW_HEIGHT = 44; // Must match TaskTable row height
const HEADER_HEIGHT = 48; // Timeline header height

function App(): JSX.Element {
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
  const addTask = useTaskStore((state) => state.addTask);

  // Chart state for headers
  const scale = useChartStore((state) => state.scale);
  const containerWidth = useChartStore((state) => state.containerWidth);

  // Calculate total content height (all tasks)
  const totalContentHeight = tasks.length * ROW_HEIGHT + HEADER_HEIGHT;

  // Ensure timeline header fills at least the container width
  const timelineHeaderWidth = scale ? Math.max(scale.totalWidth, containerWidth) : containerWidth;

  // Enable global keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
  useKeyboardShortcuts();

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

  // Measure viewport dimensions
  // IMPORTANT: Measure outerScrollRef for viewport height
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
  // IMPORTANT: Measure outerScrollRef for viewport height, not stickyContainer
  useEffect(() => {
    const outerScroll = outerScrollRef.current;
    const chartContainer = chartContainerRef.current;

    if (!outerScroll || !chartContainer) return;

    const ro = new ResizeObserver(() => {
      // Viewport height is the outer scroll container's height
      setViewportHeight(outerScroll.offsetHeight);
      setChartContainerWidth(chartContainer.offsetWidth);
    });

    ro.observe(outerScroll);
    ro.observe(chartContainer);

    return () => ro.disconnect();
  }, []);

  const handleAddTask = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    addTask({
      name: 'New Task',
      startDate: formatDate(today),
      endDate: formatDate(nextWeek),
      duration: 7,
      progress: 0,
      color: '#3b82f6',
      order: tasks.length,
      type: 'task',
      parent: undefined,
      metadata: {},
    });
  };

  // Content area height (viewport minus header)
  const contentAreaHeight = viewportHeight - HEADER_HEIGHT;

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Zoom Indicator - fixed position at root level, outside all layout containers */}
      <ZoomIndicator />
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Header Toolbar - Fixed */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
          <ChartBarHorizontal size={24} weight="regular" className="text-gray-700" />
          <button
            onClick={handleAddTask}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Add new task"
          >
            + Add Task
          </button>
          <HierarchyButtons />
          <UndoRedoButtons />

          {/* Spacer to push zoom controls to the right */}
          <div className="flex-1" />

          {/* Zoom Controls */}
          <ZoomControls />
        </header>

        {/* Main Content - SVAR-style sticky scroll layout */}
        {/* Outer scroll container - handles vertical scrolling only */}
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
                {/* Explicit height to ensure horizontal scrollbar stays at viewport bottom */}
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
                    {/* Horizontal scrollbar will be at bottom of this container = bottom of viewport */}
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
      </div>
    </>
  );
}

export default App;
