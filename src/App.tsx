/**
 * App - Root application component
 * Composes the main layout from sub-components
 */

import { Toaster } from 'react-hot-toast';
import { ZoomIndicator } from './components/GanttChart/ZoomIndicator';
import { AppToolbar, GanttLayout } from './components/Layout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';

function App(): JSX.Element {
  // Enable global keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Ctrl+S, Ctrl+O, Ctrl+Alt+N)
  useKeyboardShortcuts();

  // Warn before leaving with unsaved changes
  useUnsavedChanges();

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
      {/* Zoom Indicator - fixed position at root level */}
      <ZoomIndicator />
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        <AppToolbar />
        <GanttLayout />
      </div>
    </>
  );
}

export default App;
