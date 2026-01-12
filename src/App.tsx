/**
 * App - Root application component
 * Composes the main layout from sub-components
 */

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { GanttLayout } from "./components/Layout";
import { StatusBar } from "./components/StatusBar";
import { Ribbon } from "./components/Ribbon";
import { ExportDialog } from "./components/Export";
import { PreferencesDialog } from "./components/Preferences";
import { ChartSettingsDialog } from "./components/Settings/ChartSettingsDialog";
import { HelpPanel, WelcomeTour } from "./components/Help";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useUnsavedChanges } from "./hooks/useUnsavedChanges";
import { useMultiTabPersistence } from "./hooks/useMultiTabPersistence";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { useUIStore } from "./store/slices/uiSlice";
import { useFileStore } from "./store/slices/fileSlice";
import { useUserPreferencesStore } from "./store/slices/userPreferencesSlice";

function App(): JSX.Element {
  const checkFirstTimeUser = useUIStore((state) => state.checkFirstTimeUser);
  const hasSeenWelcome = useUIStore((state) => state.hasSeenWelcome);
  const isHydrated = useUIStore((state) => state.isHydrated);
  const openChartSettingsDialog = useUIStore(
    (state) => state.openChartSettingsDialog
  );
  const fileName = useFileStore((state) => state.fileName);
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

  // For returning users (who have seen welcome), open chart settings if no file is loaded
  // Wait for hydration to complete to avoid race condition with localStorage restoration
  useEffect(() => {
    if (isHydrated && hasSeenWelcome && fileName === null) {
      openChartSettingsDialog();
    }
  }, [isHydrated, hasSeenWelcome, fileName, openChartSettingsDialog]);

  return (
    <>
      {/* Export Dialog */}
      <ExportDialog />

      {/* Preferences Dialog */}
      <PreferencesDialog />

      {/* Chart Settings Dialog */}
      <ChartSettingsDialog />

      {/* Help Panel */}
      <HelpPanel />

      {/* Welcome Tour for first-time users */}
      <WelcomeTour />

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "#f8fafc",
            borderRadius: "8px",
            boxShadow:
              "0 10px 15px -3px rgba(15, 23, 42, 0.15), 0 4px 6px -2px rgba(15, 23, 42, 0.08)",
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
            padding: "12px 16px",
          },
          success: {
            iconTheme: {
              primary: "#059669",
              secondary: "#f8fafc",
            },
          },
          error: {
            iconTheme: {
              primary: "#dc2626",
              secondary: "#f8fafc",
            },
          },
        }}
      />
      <div className="h-screen bg-neutral-100 flex flex-col overflow-hidden">
        <Ribbon />
        <GanttLayout />
        <StatusBar />
      </div>
    </>
  );
}

export default App;
