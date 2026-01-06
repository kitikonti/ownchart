/**
 * App - Root application component
 * Composes the main layout from sub-components
 */

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { ZoomIndicator } from "./components/GanttChart/ZoomIndicator";
import { AppToolbar, GanttLayout } from "./components/Layout";
import { ExportDialog } from "./components/Export";
import { PreferencesDialog } from "./components/Preferences";
import { HelpPanel, WelcomeTour } from "./components/Help";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useUnsavedChanges } from "./hooks/useUnsavedChanges";
import { useMultiTabPersistence } from "./hooks/useMultiTabPersistence";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { useUIStore } from "./store/slices/uiSlice";
import { useUserPreferencesStore } from "./store/slices/userPreferencesSlice";

function App(): JSX.Element {
  const checkFirstTimeUser = useUIStore((state) => state.checkFirstTimeUser);
  const initializeDensity = useUserPreferencesStore(
    (state) => state.initializeDensity
  );

  // Enable global keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Ctrl+S, Ctrl+O, Ctrl+Alt+N, Ctrl+E, ?)
  useKeyboardShortcuts();

  // Warn before leaving with unsaved changes
  useUnsavedChanges();

  // Persist state to localStorage with multi-tab support
  useMultiTabPersistence();

  // Update browser tab title with filename
  useDocumentTitle();

  // Check for first-time user on mount and initialize density
  useEffect(() => {
    checkFirstTimeUser();
    initializeDensity();
  }, [checkFirstTimeUser, initializeDensity]);

  return (
    <>
      {/* Export Dialog */}
      <ExportDialog />

      {/* Preferences Dialog */}
      <PreferencesDialog />

      {/* Help Panel */}
      <HelpPanel />

      {/* Welcome Tour for first-time users */}
      <WelcomeTour />

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
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
