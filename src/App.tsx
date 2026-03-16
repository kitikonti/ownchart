/**
 * App - Root application component
 *
 * Three-layer structure:
 *   App        → wraps everything in an error boundary
 *   AppInner   → gates mobile devices before mounting the full app
 *   AppContent → registers global hooks and renders the main layout
 */

import { useEffect, type ReactElement } from "react";
import { Toaster } from "react-hot-toast";
import { GanttLayout } from "./components/Layout";
import { StatusBar } from "./components/StatusBar";
import { Ribbon } from "./components/Ribbon";
import { ExportDialog } from "./components/Export";
import { AboutDialog, HelpDialog, WelcomeTour } from "./components/Help";
import { MobileBlockScreen } from "./components/MobileBlockScreen";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useUnsavedChanges } from "./hooks/useUnsavedChanges";
import { useMultiTabPersistence } from "./hooks/useMultiTabPersistence";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { useLaunchQueue } from "./hooks/useLaunchQueue";
import { useDeviceDetection } from "./hooks/useDeviceDetection";
import { useUIStore } from "./store/slices/uiSlice";
import { useUserPreferencesStore } from "./store/slices/userPreferencesSlice";
import { COLORS, SHADOWS, TOAST } from "./styles/design-tokens";

export function App(): ReactElement {
  return (
    <AppErrorBoundary>
      <AppInner />
    </AppErrorBoundary>
  );
}

/**
 * AppInner - Gates mobile devices before mounting the full app.
 * Shows MobileBlockScreen on narrow touch devices; renders AppContent otherwise.
 */
function AppInner(): ReactElement {
  const { shouldShowMobileBlock, dismiss } = useDeviceDetection();

  if (shouldShowMobileBlock) {
    return <MobileBlockScreen onDismiss={dismiss} />;
  }

  return <AppContent />;
}

/**
 * AppContent - Registers all global hooks and renders the main application layout.
 * Only mounted after AppInner confirms we are not on a blocked mobile device.
 */
function AppContent(): ReactElement {
  const checkFirstTimeUser = useUIStore((state) => state.checkFirstTimeUser);
  const initializePreferences = useUserPreferencesStore(
    (state) => state.initializePreferences
  );

  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  // Warn before leaving with unsaved changes
  useUnsavedChanges();

  // Persist state to localStorage with multi-tab support
  useMultiTabPersistence();

  // Update browser tab title with filename
  useDocumentTitle();

  // Handle OS file association via PWA LaunchQueue API
  useLaunchQueue();

  // Check for first-time user on mount and initialize preferences
  useEffect(() => {
    checkFirstTimeUser();
    initializePreferences();
  }, [checkFirstTimeUser, initializePreferences]);

  return (
    <>
      <ExportDialog />
      <HelpDialog />
      <AboutDialog />
      <WelcomeTour />

      {/* react-hot-toast requires a style object for toast appearance — Tailwind classes
          are not applicable here. Values are sourced from design tokens for consistency. */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: TOAST.durationMs,
          style: {
            background: TOAST.bg,
            color: TOAST.text,
            borderRadius: TOAST.borderRadius,
            boxShadow: SHADOWS.toast,
            fontFamily: "var(--font-sans)",
            fontSize: TOAST.fontSize,
            padding: TOAST.padding,
          },
          success: {
            iconTheme: {
              primary: COLORS.semantic.success,
              secondary: TOAST.text,
            },
          },
          error: {
            iconTheme: {
              primary: COLORS.semantic.error,
              secondary: TOAST.text,
            },
          },
        }}
      />
      <div className="h-screen bg-slate-100 flex flex-col overflow-hidden">
        <Ribbon />
        <GanttLayout />
        <StatusBar />
      </div>
    </>
  );
}
