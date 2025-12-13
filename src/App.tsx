function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Gantt Chart Application
        </h1>
        <p className="text-lg text-gray-600 mb-8">Phase 0: Foundation</p>
        <div className="inline-block p-4 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            Project initialized
            <br />
            Ready for feature development
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
