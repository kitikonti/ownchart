/**
 * TaskList container component.
 * Displays all tasks and manages task list interactions.
 */

import { useTaskStore } from '../../store/slices/taskSlice';

export function TaskList(): JSX.Element {
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
      metadata: {},
    });
  };

  return (
    <div className="task-list h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="task-list-header flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        <button
          onClick={handleAddTask}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Add new task"
        >
          + Add Task
        </button>
      </div>

      {/* Task List Content */}
      <div className="task-list-content flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="empty-state flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Click "Add Task" to create your first task
            </p>
          </div>
        ) : (
          <div className="task-rows">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="task-row p-3 border-b border-gray-100 hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900">{task.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {task.startDate} → {task.endDate} ({task.duration} days)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
