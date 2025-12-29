import { ChartBarHorizontal } from '@phosphor-icons/react';
import { TaskTable } from './components/TaskList/TaskTable';
import { TaskTableHeader } from './components/TaskList/TaskTableHeader';
import { HierarchyButtons } from './components/TaskList/HierarchyButtons';
import { UndoRedoButtons } from './components/Toolbar/UndoRedoButtons';
import { ChartCanvas } from './components/GanttChart';
import { TimelineHeader } from './components/GanttChart';
import { useTaskStore } from './store/slices/taskSlice';
import { useChartStore } from './store/slices/chartSlice';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App(): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const toggleTaskSelection = useTaskStore((state) => state.toggleTaskSelection);
  const addTask = useTaskStore((state) => state.addTask);

  // Chart state for headers
  const scale = useChartStore((state) => state.scale);

  // Enable global keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
  useKeyboardShortcuts();

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
      </header>

      {/* Main Content - Vertikales Layout mit gemeinsamen Scroll */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Sticky Header Row */}
        <div className="sticky top-0 z-20 flex flex-shrink-0">
          {/* TaskTable Header */}
          <div className="w-auto flex-shrink-0 min-w-[800px] bg-white overflow-x-auto">
            <TaskTableHeader />
          </div>

          {/* Timeline Header */}
          <div className="flex-1 bg-white overflow-hidden">
            {scale && (
              <svg width={scale.totalWidth} height={48} className="block select-none">
                <TimelineHeader scale={scale} />
              </svg>
            )}
          </div>
        </div>

        {/* Content Row */}
        <div className="flex flex-1 min-h-0">
          {/* Task Table Content */}
          <div className="w-auto flex-shrink-0 min-w-[800px] min-h-full">
            <TaskTable />
          </div>

          {/* Gantt Chart Content */}
          <div className="flex-1 bg-white min-h-full">
            <ChartCanvas
              tasks={tasks}
              selectedTaskIds={selectedTaskIds}
              onTaskClick={toggleTaskSelection}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
