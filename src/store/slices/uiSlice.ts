/**
 * UI slice for Zustand store.
 * Manages UI state for export dialog, help panel, and welcome tour.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  DEFAULT_EXPORT_OPTIONS,
  DEFAULT_PDF_OPTIONS,
  DEFAULT_SVG_OPTIONS,
  type ExportFormat,
  type ExportOptions,
  type PdfExportOptions,
  type SvgExportOptions,
} from "../../utils/export/types";

// LocalStorage keys
const WELCOME_DISMISSED_KEY = "ownchart-welcome-dismissed";
const TOUR_COMPLETED_KEY = "ownchart-tour-completed";

/**
 * UI state interface.
 */
interface UIState {
  // Export dialog
  isExportDialogOpen: boolean;
  selectedExportFormat: ExportFormat;
  exportOptions: ExportOptions;
  pdfExportOptions: PdfExportOptions;
  svgExportOptions: SvgExportOptions;
  isExporting: boolean;
  exportProgress: number;
  exportError: string | null;

  // Help panel
  isHelpPanelOpen: boolean;

  // Preferences dialog
  isPreferencesDialogOpen: boolean;

  // Chart settings dialog (project-specific view settings)
  isChartSettingsDialogOpen: boolean;

  // Welcome tour
  isWelcomeTourOpen: boolean;
  hasSeenWelcome: boolean;
  hasTourCompleted: boolean;

  // Hydration state (true after localStorage restoration is complete)
  isHydrated: boolean;
}

/**
 * UI actions interface.
 */
interface UIActions {
  // Export dialog
  openExportDialog: () => void;
  closeExportDialog: () => void;
  setExportFormat: (format: ExportFormat) => void;
  setExportOptions: (options: Partial<ExportOptions>) => void;
  setPdfExportOptions: (options: Partial<PdfExportOptions>) => void;
  setSvgExportOptions: (options: Partial<SvgExportOptions>) => void;
  resetExportOptions: (options?: ExportOptions) => void;
  setIsExporting: (isExporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setExportError: (error: string | null) => void;

  // Help panel
  openHelpPanel: () => void;
  closeHelpPanel: () => void;
  toggleHelpPanel: () => void;

  // Preferences dialog
  openPreferencesDialog: () => void;
  closePreferencesDialog: () => void;

  // Chart settings dialog
  openChartSettingsDialog: () => void;
  closeChartSettingsDialog: () => void;

  // Welcome tour
  openWelcomeTour: () => void;
  closeWelcomeTour: () => void;
  dismissWelcome: (permanent?: boolean) => void;
  completeTour: () => void;
  checkFirstTimeUser: () => void;

  // Hydration
  setHydrated: () => void;
}

/**
 * Combined store interface.
 */
type UIStore = UIState & UIActions;

/**
 * Get initial welcome state from localStorage.
 */
function getInitialWelcomeState(): {
  hasSeenWelcome: boolean;
  hasTourCompleted: boolean;
} {
  if (typeof window === "undefined") {
    return { hasSeenWelcome: false, hasTourCompleted: false };
  }

  const hasSeenWelcome = localStorage.getItem(WELCOME_DISMISSED_KEY) === "true";
  const hasTourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY) === "true";

  return { hasSeenWelcome, hasTourCompleted };
}

/**
 * UI store hook with immer middleware for immutable updates.
 */
export const useUIStore = create<UIStore>()(
  immer((set) => {
    const { hasSeenWelcome, hasTourCompleted } = getInitialWelcomeState();

    return {
      // Initial state
      isExportDialogOpen: false,
      selectedExportFormat: "png" as ExportFormat,
      exportOptions: { ...DEFAULT_EXPORT_OPTIONS },
      pdfExportOptions: { ...DEFAULT_PDF_OPTIONS },
      svgExportOptions: { ...DEFAULT_SVG_OPTIONS },
      isExporting: false,
      exportProgress: 0,
      exportError: null,
      isHelpPanelOpen: false,
      isPreferencesDialogOpen: false,
      isChartSettingsDialogOpen: false,
      isWelcomeTourOpen: false,
      hasSeenWelcome,
      hasTourCompleted,
      isHydrated: false,

      // Export dialog actions
      openExportDialog: () =>
        set((state) => {
          state.isExportDialogOpen = true;
          state.exportError = null;
          state.exportProgress = 0;
        }),

      closeExportDialog: () =>
        set((state) => {
          state.isExportDialogOpen = false;
          state.isExporting = false;
          state.exportProgress = 0;
          state.exportError = null;
        }),

      setExportFormat: (format) =>
        set((state) => {
          state.selectedExportFormat = format;
        }),

      setExportOptions: (options) =>
        set((state) => {
          Object.assign(state.exportOptions, options);
        }),

      setPdfExportOptions: (options) =>
        set((state) => {
          Object.assign(state.pdfExportOptions, options);
        }),

      setSvgExportOptions: (options) =>
        set((state) => {
          Object.assign(state.svgExportOptions, options);
        }),

      resetExportOptions: (options) =>
        set((state) => {
          state.exportOptions = options
            ? { ...options }
            : { ...DEFAULT_EXPORT_OPTIONS };
          state.pdfExportOptions = { ...DEFAULT_PDF_OPTIONS };
          state.svgExportOptions = { ...DEFAULT_SVG_OPTIONS };
        }),

      setIsExporting: (isExporting) =>
        set((state) => {
          state.isExporting = isExporting;
          if (isExporting) {
            state.exportError = null;
            state.exportProgress = 0;
          }
        }),

      setExportProgress: (progress) =>
        set((state) => {
          state.exportProgress = progress;
        }),

      setExportError: (error) =>
        set((state) => {
          state.exportError = error;
          state.isExporting = false;
        }),

      // Help panel actions
      openHelpPanel: () =>
        set((state) => {
          state.isHelpPanelOpen = true;
        }),

      closeHelpPanel: () =>
        set((state) => {
          state.isHelpPanelOpen = false;
        }),

      toggleHelpPanel: () =>
        set((state) => {
          state.isHelpPanelOpen = !state.isHelpPanelOpen;
        }),

      // Preferences dialog actions
      openPreferencesDialog: () =>
        set((state) => {
          state.isPreferencesDialogOpen = true;
        }),

      closePreferencesDialog: () =>
        set((state) => {
          state.isPreferencesDialogOpen = false;
        }),

      // Chart settings dialog actions
      openChartSettingsDialog: () =>
        set((state) => {
          state.isChartSettingsDialogOpen = true;
        }),

      closeChartSettingsDialog: () =>
        set((state) => {
          state.isChartSettingsDialogOpen = false;
        }),

      // Welcome tour actions
      openWelcomeTour: () =>
        set((state) => {
          state.isWelcomeTourOpen = true;
        }),

      closeWelcomeTour: () =>
        set((state) => {
          state.isWelcomeTourOpen = false;
        }),

      dismissWelcome: (permanent = false) =>
        set((state) => {
          state.isWelcomeTourOpen = false;
          // Only permanently dismiss if user checked "Don't show again"
          if (permanent) {
            state.hasSeenWelcome = true;
            localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
          }
        }),

      completeTour: () =>
        set((state) => {
          state.isWelcomeTourOpen = false;
          state.hasSeenWelcome = true;
          state.hasTourCompleted = true;
          localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
          localStorage.setItem(TOUR_COMPLETED_KEY, "true");
        }),

      checkFirstTimeUser: () =>
        set((state) => {
          // Only show welcome if user hasn't seen it before
          if (!state.hasSeenWelcome) {
            state.isWelcomeTourOpen = true;
          }
        }),

      // Hydration action - called after localStorage restoration is complete
      setHydrated: () =>
        set((state) => {
          state.isHydrated = true;
        }),
    };
  })
);
