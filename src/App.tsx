import { ChartBarHorizontal } from '@phosphor-icons/react';
import { TaskTable } from './components/TaskList/TaskTable';
import { HierarchyButtons } from './components/TaskList/HierarchyButtons';
import { useTaskStore } from './store/slices/taskSlice';

function App(): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Toolbar */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        <ChartBarHorizontal size={24} weight="regular" className="text-gray-700" />
        <button
          onClick={handleAddTask}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Add new task"
        >
          + Add Task
        </button>
        <HierarchyButtons />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task Table Panel */}
        <div className="w-auto flex-shrink-0 min-w-[800px]">
          <TaskTable />
        </div>

        {/* Placeholder for future Gantt Chart */}
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg
              className="w-24 h-24 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-lg font-medium mb-2">Timeline View</p>
            <p className="text-sm">Coming in Sprint 1.2</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
