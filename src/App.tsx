import { useRef, useEffect, useState } from 'react';
import { ChartBarHorizontal } from '@phosphor-icons/react';
import { Toaster } from 'react-hot-toast';
import { TaskTable } from './components/TaskList/TaskTable';
import { TaskTableHeader } from './components/TaskList/TaskTableHeader';
import { HierarchyButtons } from './components/TaskList/HierarchyButtons';
import { UndoRedoButtons } from './components/Toolbar/UndoRedoButtons';
import { ZoomControls } from './components/Toolbar/ZoomControls';
import { ChartCanvas } from './components/GanttChart';
import { TimelineHeader } from './components/GanttChart';
import { useTaskStore } from './store/slices/taskSlice';
import { useChartStore } from './store/slices/chartSlice';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App(): JSX.Element {
  const contentRowRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const timelineHeaderScrollRef = useRef<HTMLDivElement>(null);
  const [contentRowHeight, setContentRowHeight] = useState(600);
  const [chartContainerWidth, setChartContainerWidth] = useState(800);
  const tasks = useTaskStore((state) => state.tasks);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const toggleTaskSelection = useTaskStore((state) => state.toggleTaskSelection);
  const addTask = useTaskStore((state) => state.addTask);

  // Chart state for headers
  const scale = useChartStore((state) => state.scale);
  const containerWidth = useChartStore((state) => state.containerWidth);

  // Ensure timeline header fills at least the container width
  const timelineHeaderWidth = scale ? Math.max(scale.totalWidth, containerWidth) : containerWidth;

  // Enable global keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
  useKeyboardShortcuts();

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

  // Measure content row dimensions for ChartCanvas
  useEffect(() => {
    const measureDimensions = () => {
      if (contentRowRef.current) {
        const height = contentRowRef.current.getBoundingClientRect().height;
        if (height > 100) {
          setContentRowHeight(height);
        }
      }

      if (chartContainerRef.current) {
        const width = chartContainerRef.current.getBoundingClientRect().width;
        if (width > 100) {
          setChartContainerWidth(width);
        }
      }
    };

    // Initial measurement
    measureDimensions();

    // Update on window resize
    window.addEventListener('resize', measureDimensions);
    return () => window.removeEventListener('resize', measureDimensions);
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

      {/* Main Content - Vertikales Layout mit gemeinsamen Scroll */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Sticky Header Row */}
        <div className="sticky top-0 z-20 flex flex-shrink-0">
          {/* TaskTable Header */}
          <div className="w-auto flex-shrink-0 min-w-[800px] bg-white overflow-x-auto">
            <TaskTableHeader />
          </div>

          {/* Timeline Header - scrollable and synchronized with chart */}
          <div
            ref={timelineHeaderScrollRef}
            className="flex-1 bg-white overflow-x-auto overflow-y-hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {scale && (
              <svg width={timelineHeaderWidth} height={48} className="block select-none">
                <TimelineHeader scale={scale} width={timelineHeaderWidth} />
              </svg>
            )}
          </div>
        </div>

        {/* Content Row */}
        <div ref={contentRowRef} className="flex flex-1 min-h-0">
          {/* Task Table Content */}
          <div className="w-auto flex-shrink-0 min-w-[800px]">
            <TaskTable />
          </div>

          {/* Gantt Chart Content - scrollable horizontally */}
          <div ref={chartContainerRef} className="flex-1 bg-white overflow-x-auto overflow-y-hidden">
            <ChartCanvas
              tasks={tasks}
              selectedTaskIds={selectedTaskIds}
              onTaskClick={toggleTaskSelection}
              containerHeight={contentRowHeight}
              containerWidth={chartContainerWidth}
            />
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default App;
