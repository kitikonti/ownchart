/**
 * Chart state management slice for Gantt timeline
 * Manages timeline scale, zoom, pan, and view settings
 * SINGLE SOURCE OF TRUTH for navigation state (Sprint 1.2 Package 3)
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { TimelineScale } from "../../utils/timelineUtils";
import {
  getTimelineScale,
  MIN_ZOOM,
  MAX_ZOOM,
  FIXED_BASE_PIXELS_PER_DAY,
  dateToPixel,
} from "../../utils/timelineUtils";
import {
  getDateRange,
  calculateDuration,
  addDays,
} from "../../utils/dateUtils";
import type { Task } from "../../types/chart.types";
import type {
  TaskLabelPosition,
  WorkingDaysConfig,
} from "../../types/preferences.types";
import type {
  ColorModeState,
  ColorMode,
  ThemeModeOptions,
  SummaryModeOptions,
  TaskTypeModeOptions,
  HierarchyModeOptions,
} from "../../types/colorMode.types";
import { DEFAULT_COLOR_MODE_STATE } from "../../types/colorMode.types";
import {
  DEFAULT_WORKING_DAYS_CONFIG,
  detectLocaleHolidayRegion,
} from "../../types/preferences.types";
import { holidayService } from "../../services/holidayService";
import { calculateLabelPaddingDays } from "../../utils/textMeasurement";
import { getCurrentDensityConfig } from "./userPreferencesSlice";

/**
 * Anchor point for zoom operations.
 * Specifies which date should remain at a fixed pixel offset after zoom.
 */
export interface ZoomAnchor {
  anchorDate: string; // ISO date string that should stay fixed
  anchorPixelOffset: number; // Pixel offset from viewport left where anchorDate should remain
}

/**
 * Result of zoom operations with anchor.
 * Returns the new scrollLeft needed to maintain the anchor position.
 */
export interface ZoomResult {
  newScrollLeft: number | null; // null if no anchor provided
}

interface ChartState {
  // Scale management (CRITICAL from Architect review)
  scale: TimelineScale | null;
  containerWidth: number;

  // Date range - the visible timeline bounds (with padding)
  // This is the source of truth for scale calculation
  dateRange: { min: string; max: string } | null;

  // Navigation state (SINGLE SOURCE OF TRUTH - Sprint 1.2 Package 3)
  zoom: number; // 0.05 to 3.0 (5% to 300%)
  panOffset: { x: number; y: number }; // Pan position in pixels

  // View settings (Project Settings - saved in .ownchart file)
  showWeekends: boolean;
  showTodayMarker: boolean;
  showHolidays: boolean;
  showDependencies: boolean;
  showProgress: boolean;
  taskLabelPosition: TaskLabelPosition;
  workingDaysMode: boolean;
  workingDaysConfig: WorkingDaysConfig;
  holidayRegion: string; // ISO 3166-1 alpha-2 country code (e.g., 'AT', 'DE', 'US')

  // Project metadata (saved in .ownchart file)
  projectTitle: string;
  projectAuthor: string;

  // Color mode state (Smart Color Management)
  colorModeState: ColorModeState;

  // Transient UI state
  isZooming: boolean;
  isPanning: boolean;
  lastFitToViewTime: number; // Timestamp to detect fitToView calls

  // Viewport state (for visible range calculation in export)
  viewportScrollLeft: number;
  viewportWidth: number;

  // Multi-task drag state (shared for preview rendering)
  dragState: {
    deltaDays: number;
    sourceTaskId: string;
  } | null;
}

interface ChartActions {
  // Centralized scale lifecycle (Architect recommendation)
  updateScale: (tasks: Task[]) => void;
  setContainerWidth: (width: number) => void;
  extendDateRange: (direction: "past" | "future", days?: number) => void;

  // Zoom actions (Sprint 1.2 Package 3)
  // All zoom functions accept optional anchor for scroll position preservation
  setZoom: (zoom: number, anchor?: ZoomAnchor) => ZoomResult;
  zoomIn: (anchor?: ZoomAnchor) => ZoomResult;
  zoomOut: (anchor?: ZoomAnchor) => ZoomResult;
  resetZoom: (anchor?: ZoomAnchor) => ZoomResult;

  // Pan actions (Sprint 1.2 Package 3)
  setPanOffset: (offset: { x: number; y: number }) => void;
  panBy: (delta: { x: number; y: number }) => void;
  resetPan: () => void;

  // Combined navigation
  fitToView: (tasks: Task[]) => void;
  resetView: () => void;

  // Transient state
  setIsZooming: (isZooming: boolean) => void;
  setIsPanning: (isPanning: boolean) => void;
  setViewport: (scrollLeft: number, width: number) => void;

  // Settings - View toggles
  toggleWeekends: () => void;
  toggleTodayMarker: () => void;
  toggleHolidays: () => void;
  toggleDependencies: () => void;
  toggleProgress: () => void;
  setShowWeekends: (show: boolean) => void;
  setShowTodayMarker: (show: boolean) => void;
  setShowHolidays: (show: boolean) => void;
  setShowDependencies: (show: boolean) => void;
  setShowProgress: (show: boolean) => void;
  setTaskLabelPosition: (position: TaskLabelPosition) => void;
  setWorkingDaysMode: (enabled: boolean) => void;
  setWorkingDaysConfig: (config: Partial<WorkingDaysConfig>) => void;
  setHolidayRegion: (region: string) => void;

  // Project metadata setters
  setProjectTitle: (title: string) => void;
  setProjectAuthor: (author: string) => void;

  // Color mode actions (Smart Color Management)
  setColorMode: (mode: ColorMode) => void;
  setThemeOptions: (options: Partial<ThemeModeOptions>) => void;
  setSummaryOptions: (options: Partial<SummaryModeOptions>) => void;
  setTaskTypeOptions: (options: Partial<TaskTypeModeOptions>) => void;
  setHierarchyOptions: (options: Partial<HierarchyModeOptions>) => void;
  setColorModeState: (state: ColorModeState) => void;

  // Bulk settings update (for loading from file)
  setViewSettings: (settings: Partial<ChartState>) => void;

  // Drag state (for multi-task preview)
  setDragState: (deltaDays: number, sourceTaskId: string) => void;
  clearDragState: () => void;
}

const DEFAULT_CONTAINER_WIDTH = 800;

/** Zoom factor per keyboard/toolbar step (exponential for consistent feel) */
const KEYBOARD_ZOOM_FACTOR = 1.2;

/**
 * Helper: Recalculate scale from dateRange, zoom, and containerWidth
 * This is the single place where scale is derived from its dependencies
 */
function deriveScale(
  dateRange: { min: string; max: string } | null,
  containerWidth: number,
  zoom: number
): TimelineScale | null {
  if (!dateRange) return null;

  return getTimelineScale(dateRange.min, dateRange.max, containerWidth, zoom);
}

export const useChartStore = create<ChartState & ChartActions>()(
  immer((set, get) => ({
    // Initial state
    scale: null,
    containerWidth: DEFAULT_CONTAINER_WIDTH,
    dateRange: null,
    zoom: 1.0,
    panOffset: { x: 0, y: 0 },

    // View settings (Project Settings)
    showWeekends: true,
    showTodayMarker: true,
    showHolidays: true,
    showDependencies: true,
    showProgress: true,
    taskLabelPosition: "inside",
    workingDaysMode: false,
    workingDaysConfig: { ...DEFAULT_WORKING_DAYS_CONFIG },
    holidayRegion: detectLocaleHolidayRegion(), // Default based on browser locale

    // Project metadata
    projectTitle: "",
    projectAuthor: "",

    // Color mode state (Smart Color Management)
    colorModeState: { ...DEFAULT_COLOR_MODE_STATE },

    // Transient UI state
    isZooming: false,
    isPanning: false,
    lastFitToViewTime: 0,
    viewportScrollLeft: 0,
    viewportWidth: 0,
    dragState: null,

    // Centralized scale calculation - updates dateRange from tasks, then derives scale
    updateScale: (tasks: Task[]) => {
      set((state) => {
        const taskDateRange = getDateRange(tasks);

        // Add 90 days padding on both sides for smooth infinite scroll
        // (7 visible + 83 for scroll room in both directions)
        const paddedMin = addDays(taskDateRange.min, -90);
        const paddedMax = addDays(taskDateRange.max, 90);

        // Update dateRange
        state.dateRange = { min: paddedMin, max: paddedMax };

        // Derive scale from dateRange
        state.scale = deriveScale(
          state.dateRange,
          state.containerWidth,
          state.zoom
        );
      });
    },

    // Set container width and recalculate scale
    setContainerWidth: (width: number) => {
      set((state) => {
        state.containerWidth = width;
        // Recalculate scale if we have a dateRange
        if (state.dateRange) {
          state.scale = deriveScale(state.dateRange, width, state.zoom);
        }
      });
    },

    // Extend date range for infinite scroll
    extendDateRange: (direction: "past" | "future", days: number = 30) => {
      set((state) => {
        if (!state.dateRange) return;

        if (direction === "past") {
          state.dateRange.min = addDays(state.dateRange.min, -days);
        } else {
          state.dateRange.max = addDays(state.dateRange.max, days);
        }

        // Recalculate scale with new date range
        state.scale = deriveScale(
          state.dateRange,
          state.containerWidth,
          state.zoom
        );
      });
    },

    // Zoom with optional anchor point for scroll position preservation
    setZoom: (newZoom: number, anchor?: ZoomAnchor): ZoomResult => {
      const state = get();
      const constrainedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

      // Calculate new scrollLeft before updating state (if anchor provided)
      let newScrollLeft: number | null = null;

      if (anchor && state.scale && state.dateRange) {
        // Calculate new scale with the new zoom
        const newScale = deriveScale(
          state.dateRange,
          state.containerWidth,
          constrainedZoom
        );

        if (newScale) {
          // Calculate where the anchor date will be in the new scale
          const newAnchorPixelPos = dateToPixel(anchor.anchorDate, newScale);

          // Calculate new scrollLeft to keep anchor at same viewport position
          newScrollLeft = Math.max(
            0,
            Math.round(newAnchorPixelPos - anchor.anchorPixelOffset)
          );
        }
      }

      // Update state
      set((state) => {
        state.zoom = constrainedZoom;

        if (state.dateRange) {
          state.scale = deriveScale(
            state.dateRange,
            state.containerWidth,
            constrainedZoom
          );
        }
      });

      return { newScrollLeft };
    },

    // Zoom in by exponential factor (consistent feel at all zoom levels)
    zoomIn: (anchor?: ZoomAnchor): ZoomResult => {
      const current = get().zoom;
      return get().setZoom(
        Math.min(MAX_ZOOM, current * KEYBOARD_ZOOM_FACTOR),
        anchor
      );
    },

    // Zoom out by exponential factor (consistent feel at all zoom levels)
    zoomOut: (anchor?: ZoomAnchor): ZoomResult => {
      const current = get().zoom;
      return get().setZoom(
        Math.max(MIN_ZOOM, current / KEYBOARD_ZOOM_FACTOR),
        anchor
      );
    },

    // Reset zoom to 100%
    resetZoom: (anchor?: ZoomAnchor): ZoomResult => {
      return get().setZoom(1.0, anchor);
    },

    // Set pan offset (validates for NaN/Infinity)
    setPanOffset: (offset: { x: number; y: number }) => {
      set((state) => {
        // Validate to prevent NaN or Infinity
        if (isFinite(offset.x) && isFinite(offset.y)) {
          state.panOffset = offset;
        } else {
          console.error("Invalid pan offset:", offset);
        }
      });
    },

    // Pan by delta amount
    panBy: (delta: { x: number; y: number }) => {
      set((state) => {
        const newX = state.panOffset.x + delta.x;
        const newY = state.panOffset.y + delta.y;

        if (isFinite(newX) && isFinite(newY)) {
          state.panOffset.x = newX;
          state.panOffset.y = newY;
        }
      });
    },

    // Reset pan to origin
    resetPan: () => {
      set((state) => {
        state.panOffset = { x: 0, y: 0 };
      });
    },

    // Fit all tasks in view with padding that includes task labels
    fitToView: (tasks: Task[]) => {
      if (tasks.length === 0) {
        get().resetZoom();
        get().resetPan();
        return;
      }

      const { min, max } = getDateRange(tasks);
      const containerWidth = get().containerWidth;
      const taskLabelPosition = get().taskLabelPosition;

      // Get font size from current density settings
      const densityConfig = getCurrentDensityConfig();
      const fontSize = densityConfig.fontSizeBar;

      // Calculate base duration (task range only)
      const baseDuration = calculateDuration(min, max);

      // Initial zoom estimate to calculate pixelsPerDay
      const baseZoom =
        containerWidth / (baseDuration * FIXED_BASE_PIXELS_PER_DAY);
      const clampedBaseZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, baseZoom));
      const pixelsPerDay = FIXED_BASE_PIXELS_PER_DAY * clampedBaseZoom;

      // Calculate extra padding needed for task labels
      const labelPadding = calculateLabelPaddingDays(
        tasks,
        taskLabelPosition,
        fontSize,
        pixelsPerDay
      );

      // Calculate visible range with base padding (7 days) plus label padding
      const leftPadding = 7 + labelPadding.leftDays;
      const rightPadding = 7 + labelPadding.rightDays;
      const visibleDuration = calculateDuration(
        addDays(min, -leftPadding),
        addDays(max, rightPadding)
      );

      // Calculate zoom to fit visible duration exactly in container
      // Formula: containerWidth = visibleDuration × (25 × zoom)
      // Therefore: zoom = containerWidth / (visibleDuration × 25)
      const idealZoom =
        containerWidth / (visibleDuration * FIXED_BASE_PIXELS_PER_DAY);

      // Set zoom (clamped to valid range)
      const finalZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, idealZoom));

      // Add 90 days padding on both sides for smooth infinite scroll
      // Same as updateScale to allow scrolling in both directions
      const paddedMin = addDays(min, -90);
      const paddedMax = addDays(max, 90);

      // Set dateRange and zoom, then derive scale
      // No need for scaleLocked - dateRange IS the source of truth now
      const newDateRange = { min: paddedMin, max: paddedMax };

      set((state) => {
        state.dateRange = newDateRange;
        state.zoom = finalZoom;
        state.panOffset = { x: 0, y: 0 };
        state.scale = deriveScale(newDateRange, containerWidth, finalZoom);
        state.lastFitToViewTime = Date.now(); // Mark that fitToView was called
      });
    },

    // Reset to default view
    resetView: () => {
      set((state) => {
        state.zoom = 1.0;
        state.panOffset = { x: 0, y: 0 };

        // Don't recalculate scale here - let updateScale handle it
      });
    },

    // Transient state setters
    setIsZooming: (isZooming: boolean) => {
      set((state) => {
        state.isZooming = isZooming;
      });
    },

    setIsPanning: (isPanning: boolean) => {
      set((state) => {
        state.isPanning = isPanning;
      });
    },

    setViewport: (scrollLeft: number, width: number) => {
      set((state) => {
        state.viewportScrollLeft = scrollLeft;
        state.viewportWidth = width;
      });
    },

    // Toggle weekend visibility
    toggleWeekends: () => {
      set((state) => {
        state.showWeekends = !state.showWeekends;
      });
    },

    // Toggle today marker visibility
    toggleTodayMarker: () => {
      set((state) => {
        state.showTodayMarker = !state.showTodayMarker;
      });
    },

    // Toggle holidays visibility
    toggleHolidays: () => {
      set((state) => {
        state.showHolidays = !state.showHolidays;
      });
    },

    // Toggle dependencies visibility
    toggleDependencies: () => {
      set((state) => {
        state.showDependencies = !state.showDependencies;
      });
    },

    // Toggle progress visibility
    toggleProgress: () => {
      set((state) => {
        state.showProgress = !state.showProgress;
      });
    },

    // Set weekend visibility
    setShowWeekends: (show: boolean) => {
      set((state) => {
        state.showWeekends = show;
      });
    },

    // Set today marker visibility
    setShowTodayMarker: (show: boolean) => {
      set((state) => {
        state.showTodayMarker = show;
      });
    },

    // Set holidays visibility
    setShowHolidays: (show: boolean) => {
      set((state) => {
        state.showHolidays = show;
      });
    },

    // Set dependencies visibility
    setShowDependencies: (show: boolean) => {
      set((state) => {
        state.showDependencies = show;
      });
    },

    // Set progress visibility
    setShowProgress: (show: boolean) => {
      set((state) => {
        state.showProgress = show;
      });
    },

    // Set task label position
    setTaskLabelPosition: (position: TaskLabelPosition) => {
      set((state) => {
        state.taskLabelPosition = position;
      });
    },

    // Set working days mode
    setWorkingDaysMode: (enabled: boolean) => {
      set((state) => {
        state.workingDaysMode = enabled;
      });
    },

    // Set working days configuration
    setWorkingDaysConfig: (config: Partial<WorkingDaysConfig>) => {
      set((state) => {
        state.workingDaysConfig = {
          ...state.workingDaysConfig,
          ...config,
        };
      });
    },

    // Set holiday region
    setHolidayRegion: (region: string) => {
      set((state) => {
        state.holidayRegion = region;
      });
      // Update holiday service with new region
      holidayService.setRegion(region);
    },

    // Set project title
    setProjectTitle: (title: string) => {
      set((state) => {
        state.projectTitle = title;
      });
    },

    // Set project author
    setProjectAuthor: (author: string) => {
      set((state) => {
        state.projectAuthor = author;
      });
    },

    // Color mode actions (Smart Color Management)
    setColorMode: (mode: ColorMode) => {
      set((state) => {
        state.colorModeState.mode = mode;
      });
    },

    setThemeOptions: (options: Partial<ThemeModeOptions>) => {
      set((state) => {
        state.colorModeState.themeOptions = {
          ...state.colorModeState.themeOptions,
          ...options,
        };
      });
    },

    setSummaryOptions: (options: Partial<SummaryModeOptions>) => {
      set((state) => {
        state.colorModeState.summaryOptions = {
          ...state.colorModeState.summaryOptions,
          ...options,
        };
      });
    },

    setTaskTypeOptions: (options: Partial<TaskTypeModeOptions>) => {
      set((state) => {
        state.colorModeState.taskTypeOptions = {
          ...state.colorModeState.taskTypeOptions,
          ...options,
        };
      });
    },

    setHierarchyOptions: (options: Partial<HierarchyModeOptions>) => {
      set((state) => {
        state.colorModeState.hierarchyOptions = {
          ...state.colorModeState.hierarchyOptions,
          ...options,
        };
      });
    },

    setColorModeState: (newState: ColorModeState) => {
      set((state) => {
        state.colorModeState = newState;
      });
    },

    // Bulk settings update (for loading from file)
    setViewSettings: (settings: Partial<ChartState>) => {
      set((state) => {
        if (settings.zoom !== undefined) state.zoom = settings.zoom;
        if (settings.panOffset !== undefined)
          state.panOffset = settings.panOffset;
        if (settings.showWeekends !== undefined)
          state.showWeekends = settings.showWeekends;
        if (settings.showTodayMarker !== undefined)
          state.showTodayMarker = settings.showTodayMarker;
        if (settings.showHolidays !== undefined)
          state.showHolidays = settings.showHolidays;
        if (settings.showDependencies !== undefined)
          state.showDependencies = settings.showDependencies;
        if (settings.showProgress !== undefined)
          state.showProgress = settings.showProgress;
        if (settings.taskLabelPosition !== undefined)
          state.taskLabelPosition = settings.taskLabelPosition;
        if (settings.workingDaysMode !== undefined)
          state.workingDaysMode = settings.workingDaysMode;
        if (settings.workingDaysConfig !== undefined)
          state.workingDaysConfig = settings.workingDaysConfig;
        if (settings.holidayRegion !== undefined)
          state.holidayRegion = settings.holidayRegion;
        if (settings.projectTitle !== undefined)
          state.projectTitle = settings.projectTitle;
        if (settings.projectAuthor !== undefined)
          state.projectAuthor = settings.projectAuthor;
        if (settings.colorModeState !== undefined)
          state.colorModeState = settings.colorModeState;
      });
      // Update holiday service if region changed
      if (settings.holidayRegion !== undefined) {
        holidayService.setRegion(settings.holidayRegion);
      }
    },

    // Set drag state (for multi-task preview)
    setDragState: (deltaDays: number, sourceTaskId: string) => {
      set((state) => {
        state.dragState = { deltaDays, sourceTaskId };
      });
    },

    // Clear drag state
    clearDragState: () => {
      set((state) => {
        state.dragState = null;
      });
    },
  }))
);
