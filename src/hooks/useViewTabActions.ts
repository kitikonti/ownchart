/**
 * useViewTabActions - Business logic hook for the View tab ribbon content.
 *
 * Extracts store bindings, derived zoom state, and action handlers from ViewTabContent
 * so the component stays purely presentational (<200 LOC).
 *
 * Key design decision: does NOT subscribe to `tasks` from taskStore.
 * Instead reads tasks lazily via getState() only when fitToView is invoked,
 * avoiding unnecessary re-renders on every task mutation.
 */

import { useCallback, useMemo } from "react";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { useUIStore } from "@/store/slices/uiSlice";
import { useUserPreferencesStore } from "@/store/slices/userPreferencesSlice";
// Shared scroll-anchor helpers — live in useZoom to avoid duplicating the
// viewport-center computation and DOM scroll-apply logic.
import { computeViewportCenterAnchor, applyScrollLeft } from "./useZoom";
import { MIN_ZOOM, MAX_ZOOM, PRESET_ZOOM_LEVELS } from "@/utils/timelineUtils";

interface ViewTabActions {
  // Show/Hide toggles
  showTodayMarker: boolean;
  toggleTodayMarker: () => void;
  showWeekends: boolean;
  toggleWeekends: () => void;
  showHolidays: boolean;
  toggleHolidays: () => void;
  showDependencies: boolean;
  toggleDependencies: () => void;
  showProgress: boolean;
  toggleProgress: () => void;
  // Scheduling
  autoScheduling: boolean;
  toggleAutoScheduling: () => void;
  // Zoom
  zoomPercentage: number;
  zoomOptions: number[];
  canZoomIn: boolean;
  canZoomOut: boolean;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomLevelSelect: (level: number | "fit") => void;
  handleFitToView: () => void;
  // Layout
  isTaskTableCollapsed: boolean;
  toggleTaskTableCollapsed: () => void;
  // Display modes
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  hideUI: boolean;
  toggleHideUI: () => void;
}

export function useViewTabActions(): ViewTabActions {
  // Chart store
  const zoom = useChartStore((state) => state.zoom);
  const zoomIn = useChartStore((state) => state.zoomIn);
  const zoomOut = useChartStore((state) => state.zoomOut);
  const setZoom = useChartStore((state) => state.setZoom);
  const fitToView = useChartStore((state) => state.fitToView);
  const showTodayMarker = useChartStore((state) => state.showTodayMarker);
  const toggleTodayMarker = useChartStore((state) => state.toggleTodayMarker);
  const showWeekends = useChartStore((state) => state.showWeekends);
  const toggleWeekends = useChartStore((state) => state.toggleWeekends);
  const showHolidays = useChartStore((state) => state.showHolidays);
  const toggleHolidays = useChartStore((state) => state.toggleHolidays);
  const showDependencies = useChartStore((state) => state.showDependencies);
  const toggleDependencies = useChartStore((state) => state.toggleDependencies);
  const showProgress = useChartStore((state) => state.showProgress);
  const toggleProgress = useChartStore((state) => state.toggleProgress);
  const autoScheduling = useChartStore((state) => state.autoScheduling);
  const toggleAutoScheduling = useChartStore(
    (state) => state.toggleAutoScheduling
  );
  const isTaskTableCollapsed = useChartStore(
    (state) => state.isTaskTableCollapsed
  );
  const toggleTaskTableCollapsedAction = useChartStore(
    (state) => state.toggleTaskTableCollapsed
  );

  // Display mode state
  const isHighContrast = useUIStore((state) => state.isHighContrast);
  const toggleHighContrast = useUIStore((state) => state.toggleHighContrast);
  const hideUI = useUserPreferencesStore((state) => state.preferences.hideUI);
  const toggleHideUI = useUserPreferencesStore((state) => state.toggleHideUI);

  // Derived zoom state
  const zoomPercentage = Math.round(zoom * 100);
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  // Compute sorted zoom options with the current zoom level inserted when it
  // doesn't match a preset.
  const zoomOptions = useMemo(() => {
    const options = [...PRESET_ZOOM_LEVELS];
    if (!PRESET_ZOOM_LEVELS.includes(zoomPercentage)) {
      const insertIndex = options.findIndex((level) => level > zoomPercentage);
      if (insertIndex === -1) {
        options.push(zoomPercentage);
      } else {
        options.splice(insertIndex, 0, zoomPercentage);
      }
    }
    return options;
  }, [zoomPercentage]);

  // Handlers
  const handleZoomIn = useCallback((): void => {
    const anchor = computeViewportCenterAnchor();
    const result = zoomIn(anchor);
    applyScrollLeft(result.newScrollLeft);
  }, [zoomIn]);

  const handleZoomOut = useCallback((): void => {
    const anchor = computeViewportCenterAnchor();
    const result = zoomOut(anchor);
    applyScrollLeft(result.newScrollLeft);
  }, [zoomOut]);

  const handleFitToView = useCallback((): void => {
    // Read tasks lazily — no subscription needed
    fitToView(useTaskStore.getState().tasks);
  }, [fitToView]);

  const handleZoomLevelSelect = useCallback(
    (level: number | "fit"): void => {
      if (level === "fit") {
        handleFitToView();
      } else {
        const anchor = computeViewportCenterAnchor();
        const result = setZoom(level / 100, anchor);
        applyScrollLeft(result.newScrollLeft);
      }
    },
    [handleFitToView, setZoom]
  );

  return {
    showTodayMarker,
    toggleTodayMarker,
    showWeekends,
    toggleWeekends,
    showHolidays,
    toggleHolidays,
    showDependencies,
    toggleDependencies,
    showProgress,
    toggleProgress,
    autoScheduling,
    toggleAutoScheduling,
    zoomPercentage,
    zoomOptions,
    canZoomIn,
    canZoomOut,
    handleZoomIn,
    handleZoomOut,
    handleZoomLevelSelect,
    handleFitToView,
    isTaskTableCollapsed,
    // The store action reads its own current state atomically, so the
    // function reference is stable and can be returned directly.
    toggleTaskTableCollapsed: toggleTaskTableCollapsedAction,
    // Display modes
    isHighContrast,
    toggleHighContrast,
    hideUI,
    toggleHideUI,
  };
}
