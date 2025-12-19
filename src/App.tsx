import { TaskTable } from './components/TaskList/TaskTable';

function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Gantt Chart Application
        </h1>
        <p className="text-sm text-gray-600 mt-1">Sprint 1.1+: Excel-like Task Table</p>
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
