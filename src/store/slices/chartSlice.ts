/**
 * Chart state management slice for Gantt timeline
 * Manages timeline scale, zoom, pan, and view settings
 * SINGLE SOURCE OF TRUTH for navigation state (Sprint 1.2 Package 3)
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { TimelineScale } from "@/utils/timelineUtils";
import {
  getTimelineScale,
  MIN_ZOOM,
  MAX_ZOOM,
  FIXED_BASE_PIXELS_PER_DAY,
  DATE_RANGE_PADDING_DAYS,
  SCROLL_OFFSET_DAYS,
  ZOOM_VISUAL_PADDING_DAYS,
  FIT_TO_VIEW_PADDING_DAYS,
  dateToPixel,
} from "@/utils/timelineUtils";
import { getDateRange, calculateDuration, addDays } from "@/utils/dateUtils";
import type { Task } from "@/types/chart.types";
import type {
  TaskLabelPosition,
  WorkingDaysConfig,
} from "@/types/preferences.types";
import type { ProjectLogo } from "@/types/logo.types";
import type {
  ColorModeState,
  ColorMode,
  ThemeModeOptions,
  SummaryModeOptions,
  TaskTypeModeOptions,
  HierarchyModeOptions,
} from "@/types/colorMode.types";
import { DEFAULT_COLOR_MODE_STATE } from "@/config/colorModeDefaults";
import { DEFAULT_WORKING_DAYS_CONFIG } from "@/config/workingDaysConfig";
import { detectLocaleHolidayRegion } from "@/utils/localeDetection";
import { holidayService } from "@/services/holidayService";
import { calculateLabelPaddingDays } from "@/utils/textMeasurement";
import { getTaskDescendants } from "@/utils/hierarchy";
import { getCurrentDensityConfig } from "./userPreferencesSlice";
import { TASK_COLUMNS, getColumnPixelWidth } from "@/config/tableColumns";
import { getComputedTaskColor } from "@/utils/computeTaskColor";
import { MIN_TABLE_WIDTH } from "@/config/layoutConstants";
import { DEFAULT_PALETTE_ID } from "@/utils/colorPalettes";
import type { HexColor, TaskId } from "@/types/branded.types";
import { CommandType } from "@/types/command.types";
import type { ApplyColorsToManualParams } from "@/types/command.types";
import type { DateAdjustment } from "@/types/dependency.types";
import toast from "react-hot-toast";
import { useTaskStore } from "./taskSlice";
import { useHistoryStore } from "./historySlice";
import { useFileStore } from "./fileSlice";
import { useDependencyStore } from "./dependencySlice";
import {
  propagateDateChanges,
  applyDateAdjustments,
} from "@/utils/graph/dateAdjustment";
import { recalculateSummaryAncestors } from "@/utils/hierarchy";

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

  // Date-based scroll anchor — device-independent scroll position restore.
  // Stores the ISO date at the left viewport edge. Persisted to file and
  // localStorage so scroll position restores correctly across devices with
  // different screen widths / DPI.
  viewAnchorDate: string | null;

  // View settings (Project Settings - saved in .ownchart file)
  showWeekends: boolean;
  showTodayMarker: boolean;
  showHolidays: boolean;
  showDependencies: boolean;
  showProgress: boolean;
  autoScheduling: boolean;
  /** Temporarily inverts the autoScheduling display while Alt is held. */
  altKeyHeld: boolean;
  taskLabelPosition: TaskLabelPosition;
  workingDaysMode: boolean;
  workingDaysConfig: WorkingDaysConfig;
  holidayRegion: string; // ISO 3166-1 alpha-2 country code (e.g., 'AT', 'DE', 'US')

  // Project metadata (saved in .ownchart file)
  projectTitle: string;
  projectAuthor: string;
  projectLogo: ProjectLogo | null;

  // Column visibility (user-hidden date/duration columns)
  hiddenColumns: string[];

  // Task table collapse state
  isTaskTableCollapsed: boolean;

  // Hidden task IDs (Hide/Show Rows feature)
  hiddenTaskIds: TaskId[];

  // Color mode state (Smart Color Management)
  colorModeState: ColorModeState;

  // Transient UI state
  isZooming: boolean;
  lastFitToViewTime: number; // Timestamp to detect fitToView calls

  // Viewport state (for visible range calculation in export + scroll restore)
  viewportScrollLeft: number;
  viewportScrollTop: number;
  viewportWidth: number;

  // Multi-task drag state (shared for preview rendering)
  dragState: {
    deltaDays: number;
    sourceTaskId: TaskId;
  } | null;

  /**
   * Live lag-delta indicator state (#82 stage 4). Set during a drag/resize
   * gesture in auto-update-lag mode (auto-scheduling OFF, no Alt) to drive
   * the floating "Xd → Yd" pill that appears near the affected dependency
   * arrow's successor end. Cleared on mouseup, on cascade-mode drags, and
   * when the would-be lag equals the stored lag (no visible delta).
   *
   * Only ever holds the single "winning" dependency (the first one whose
   * lag would change) — sibling deps stay static per the #82 spec.
   */
  lagDelta: {
    depId: string;
    oldLag: number;
    newLag: number;
  } | null;

  // File load signal (for scroll positioning on file open)
  fileLoadCounter: number;

  // Scroll-to-date target (consumed by useScrollToDate hook)
  scrollTargetDate: string | null;

  // Pending vertical scroll position to restore (consumed by GanttLayout)
  pendingScrollTop: number | null;
}

/** Fields that can be bulk-set from file load */
type SettableViewFields = Pick<
  ChartState,
  | "zoom"
  | "viewAnchorDate"
  | "showWeekends"
  | "showTodayMarker"
  | "showHolidays"
  | "showDependencies"
  | "showProgress"
  | "autoScheduling"
  | "taskLabelPosition"
  | "workingDaysMode"
  | "workingDaysConfig"
  | "holidayRegion"
  | "projectTitle"
  | "projectAuthor"
  | "projectLogo"
  | "colorModeState"
  | "hiddenColumns"
  | "isTaskTableCollapsed"
  | "hiddenTaskIds"
>;

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

  // View anchor date — date-based scroll position persistence
  setViewAnchorDate: (date: string | null) => void;

  // Combined navigation
  fitToView: (tasks: Task[]) => void;
  zoomToDateRange: (startDate: string, endDate: string) => void;
  resetView: () => void;

  // Transient state
  setIsZooming: (isZooming: boolean) => void;
  setViewport: (scrollLeft: number, width: number, scrollTop?: number) => void;

  // Settings - View toggles
  toggleWeekends: () => void;
  toggleTodayMarker: () => void;
  toggleHolidays: () => void;
  toggleDependencies: () => void;
  toggleProgress: () => void;
  toggleAutoScheduling: () => void;
  setAutoScheduling: (enabled: boolean) => void;
  setAltKeyHeld: (held: boolean) => void;
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
  setProjectLogo: (logo: ProjectLogo | null) => void;

  // Column visibility actions
  toggleColumnVisibility: (columnId: string) => void;
  setHiddenColumns: (columns: string[]) => void;

  // Task table collapse actions
  setTaskTableCollapsed: (collapsed: boolean) => void;
  toggleTaskTableCollapsed: () => void;

  // Hidden tasks actions (Hide/Show Rows)
  hideTasks: (taskIds: TaskId[]) => void;
  unhideTasks: (taskIds: TaskId[]) => void;
  unhideAll: () => void;
  setHiddenTaskIds: (ids: TaskId[]) => void;

  // Color mode actions (Smart Color Management)
  setColorMode: (mode: ColorMode) => void;
  setThemeOptions: (options: Partial<ThemeModeOptions>) => void;
  setSummaryOptions: (options: Partial<SummaryModeOptions>) => void;
  setTaskTypeOptions: (options: Partial<TaskTypeModeOptions>) => void;
  setHierarchyOptions: (options: Partial<HierarchyModeOptions>) => void;
  setColorModeState: (state: ColorModeState) => void;
  applyColorsToManual: () => void;

  // Bulk settings update (for loading from file)
  setViewSettings: (settings: Partial<SettableViewFields>) => void;

  // Drag state (for multi-task preview)
  setDragState: (deltaDays: number, sourceTaskId: TaskId) => void;
  clearDragState: () => void;
  setLagDelta: (
    delta: { depId: string; oldLag: number; newLag: number } | null
  ) => void;

  // File load signal (for scroll positioning)
  signalFileLoaded: () => void;

  // Scroll-to-date (for ensuring newly created tasks are visible)
  requestScrollToDate: (date: string) => void;
  clearScrollTarget: () => void;

  // Reset dateRange/scale before loading new data (file open, localStorage restore).
  // Clears stale dateRange so updateScale recalculates from scratch.
  resetForLoad: () => void;

  // Set pending vertical scroll position to restore (consumed by GanttLayout)
  setPendingScrollTop: (top: number | null) => void;

  // Expand dateRange to include a target date (used by useScrollToDate when
  // jumping to a date outside current range, e.g. Alt+T from far-away project)
  expandDateRangeTo: (targetDate: string) => void;
}

const DEFAULT_CONTAINER_WIDTH = 800;

/** Zoom factor per keyboard/toolbar step (exponential for consistent feel) */
const KEYBOARD_ZOOM_FACTOR = 1.2;

/** Default number of days to extend date range for infinite scroll */
const DEFAULT_EXTEND_DAYS = 30;

/** Default zoom level (100%) */
const DEFAULT_ZOOM = 1.0;

/**
 * Helper: Recalculate scale from dateRange, zoom, and containerWidth
 * This is the single place where scale is derived from its dependencies
 */
function deriveScale(
  dateRange: { min: string; max: string } | null,
  zoom: number
): TimelineScale | null {
  if (!dateRange) return null;

  return getTimelineScale(dateRange.min, dateRange.max, zoom);
}

export const useChartStore = create<ChartState & ChartActions>()(
  immer((set, get) => ({
    // Initial state
    scale: null,
    containerWidth: DEFAULT_CONTAINER_WIDTH,
    dateRange: null,
    zoom: DEFAULT_ZOOM,
    viewAnchorDate: null,

    // View settings (Project Settings)
    showWeekends: true,
    showTodayMarker: true,
    showHolidays: true,
    showDependencies: true,
    showProgress: true,
    autoScheduling: false,
    altKeyHeld: false,
    taskLabelPosition: "inside",
    workingDaysMode: false,
    workingDaysConfig: { ...DEFAULT_WORKING_DAYS_CONFIG },
    holidayRegion: detectLocaleHolidayRegion(), // Default based on browser locale

    // Project metadata
    projectTitle: "",
    projectAuthor: "",
    projectLogo: null,

    // Column visibility
    hiddenColumns: [] as string[],

    // Task table collapse state
    isTaskTableCollapsed: false,

    // Hidden task IDs
    hiddenTaskIds: [] as TaskId[],

    // Color mode state (Smart Color Management)
    colorModeState: structuredClone(DEFAULT_COLOR_MODE_STATE),

    // Transient UI state
    isZooming: false,
    lastFitToViewTime: 0,
    viewportScrollLeft: 0,
    viewportScrollTop: 0,
    viewportWidth: 0,
    dragState: null,
    lagDelta: null,
    fileLoadCounter: 0,
    scrollTargetDate: null,
    pendingScrollTop: null,

    // Centralized scale calculation - updates dateRange from tasks, then derives scale
    updateScale: (tasks: Task[]): void => {
      set((state) => {
        const taskDateRange = getDateRange(tasks);

        // Only recalculate dateRange when tasks extend beyond it or no range exists.
        // This preserves custom dateRange set by zoomToDateRange/fitToView —
        // without this guard, any task edit (name, indent, etc.) would overwrite
        // the dateRange and cause the viewport to jump back to the default position.
        //
        // IMPORTANT: resetView() must set dateRange=null before updateScale() is
        // called again, otherwise this guard prevents recalculation for File > New.
        // See resetView() for details.
        if (
          !state.dateRange ||
          taskDateRange.min < state.dateRange.min ||
          taskDateRange.max > state.dateRange.max
        ) {
          // Add padding on both sides for smooth infinite scroll
          // (7 visible + SCROLL_OFFSET_DAYS for scroll room in both directions)
          const paddedMin = addDays(
            taskDateRange.min,
            -DATE_RANGE_PADDING_DAYS
          );
          const paddedMax = addDays(taskDateRange.max, DATE_RANGE_PADDING_DAYS);
          state.dateRange = { min: paddedMin, max: paddedMax };
        }

        // Always re-derive scale (task count may have changed)
        state.scale = deriveScale(state.dateRange, state.zoom);
      });
    },

    // Set container width and recalculate scale
    setContainerWidth: (width: number): void => {
      set((state) => {
        state.containerWidth = width;
        // Recalculate scale if we have a dateRange
        if (state.dateRange) {
          state.scale = deriveScale(state.dateRange, state.zoom);
        }
      });
    },

    // Extend date range for infinite scroll
    extendDateRange: (
      direction: "past" | "future",
      days: number = DEFAULT_EXTEND_DAYS
    ): void => {
      set((state) => {
        if (!state.dateRange) return;

        if (direction === "past") {
          state.dateRange.min = addDays(state.dateRange.min, -days);
        } else {
          state.dateRange.max = addDays(state.dateRange.max, days);
        }

        // Recalculate scale with new date range
        state.scale = deriveScale(state.dateRange, state.zoom);
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
        const newScale = deriveScale(state.dateRange, constrainedZoom);

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
          state.scale = deriveScale(state.dateRange, constrainedZoom);
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
      return get().setZoom(DEFAULT_ZOOM, anchor);
    },

    // Set view anchor date — date-based scroll position persistence.
    // Stores the ISO date at the left viewport edge for device-independent restore.
    setViewAnchorDate: (date: string | null): void => {
      set((state) => {
        state.viewAnchorDate = date;
      });
    },

    // Fit all tasks in view with padding that includes task labels
    fitToView: (tasks: Task[]): void => {
      if (tasks.length === 0) {
        get().resetZoom();
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

      // Calculate visible range with base padding plus label padding
      const leftPadding = FIT_TO_VIEW_PADDING_DAYS + labelPadding.leftDays;
      const rightPadding = FIT_TO_VIEW_PADDING_DAYS + labelPadding.rightDays;
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

      // Add padding on both sides for smooth infinite scroll
      // Same as updateScale to allow scrolling in both directions
      const paddedMin = addDays(min, -DATE_RANGE_PADDING_DAYS);
      const paddedMax = addDays(max, DATE_RANGE_PADDING_DAYS);

      // Set dateRange and zoom, then derive scale
      // No need for scaleLocked - dateRange IS the source of truth now
      const newDateRange = { min: paddedMin, max: paddedMax };

      set((state) => {
        state.dateRange = newDateRange;
        state.zoom = finalZoom;
        state.viewAnchorDate = null; // fitToView recomputes scroll position
        state.scale = deriveScale(newDateRange, finalZoom);
        state.lastFitToViewTime = Date.now(); // Mark that fitToView was called
      });
    },

    // Zoom to a specific date range (e.g. from header date selection)
    zoomToDateRange: (startDate: string, endDate: string): void => {
      const containerWidth = get().containerWidth;

      // Add visual breathing room on each side
      const paddedStart = addDays(startDate, -ZOOM_VISUAL_PADDING_DAYS);
      const paddedEnd = addDays(endDate, ZOOM_VISUAL_PADDING_DAYS);

      const visibleDuration = calculateDuration(paddedStart, paddedEnd);

      // Calculate zoom: containerWidth = visibleDuration × FIXED_BASE_PIXELS_PER_DAY × zoom
      const idealZoom =
        containerWidth / (visibleDuration * FIXED_BASE_PIXELS_PER_DAY);
      const finalZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, idealZoom));

      // Scroll padding: GanttLayout scrolls to SCROLL_OFFSET_DAYS × pixelsPerDay.
      // With (SCROLL_OFFSET_DAYS + ZOOM_VISUAL_PADDING_DAYS) days left padding,
      // viewport starts at startDate - ZOOM_VISUAL_PADDING_DAYS, matching the visual padding.
      const scrollPaddedMin = addDays(
        startDate,
        -(SCROLL_OFFSET_DAYS + ZOOM_VISUAL_PADDING_DAYS)
      );
      const scrollPaddedMax = addDays(endDate, DATE_RANGE_PADDING_DAYS);
      const newDateRange = { min: scrollPaddedMin, max: scrollPaddedMax };

      set((state) => {
        state.dateRange = newDateRange;
        state.zoom = finalZoom;
        state.viewAnchorDate = null; // zoomToDateRange recomputes scroll position
        state.scale = deriveScale(newDateRange, finalZoom);
        state.lastFitToViewTime = Date.now();
      });
    },

    // Reset to default view — called by File > New.
    // IMPORTANT: dateRange and scale MUST be cleared to null here.
    // updateScale() has a guard that prevents shrinking dateRange
    // (to preserve zoom-to-selection). Clearing to null ensures the
    // next updateScale() recalculates from scratch. fileLoadCounter
    // bump triggers useInfiniteScroll to reposition to today.
    resetView: (): void => {
      set((state) => {
        state.zoom = DEFAULT_ZOOM;
        state.viewAnchorDate = null; // New chart has no anchor
        state.dateRange = null;
        state.scale = null;
        state.fileLoadCounter += 1;
      });
    },

    // Transient state setters
    setIsZooming: (isZooming: boolean): void => {
      set((state) => {
        state.isZooming = isZooming;
      });
    },

    setViewport: (
      scrollLeft: number,
      width: number,
      scrollTop?: number
    ): void => {
      set((state) => {
        state.viewportScrollLeft = scrollLeft;
        state.viewportWidth = width;
        if (scrollTop !== undefined) state.viewportScrollTop = scrollTop;
      });
    },

    // Toggle weekend visibility
    toggleWeekends: (): void => {
      set((state) => {
        state.showWeekends = !state.showWeekends;
      });
    },

    // Toggle today marker visibility
    toggleTodayMarker: (): void => {
      set((state) => {
        state.showTodayMarker = !state.showTodayMarker;
      });
    },

    // Toggle holidays visibility
    toggleHolidays: (): void => {
      set((state) => {
        state.showHolidays = !state.showHolidays;
      });
    },

    // Toggle dependencies visibility
    toggleDependencies: (): void => {
      set((state) => {
        state.showDependencies = !state.showDependencies;
      });
    },

    // Toggle progress visibility
    toggleProgress: (): void => {
      set((state) => {
        state.showProgress = !state.showProgress;
      });
    },

    // Toggle auto-scheduling with cascade recalculation and undo support
    toggleAutoScheduling: (): void => {
      const historyStore = useHistoryStore.getState();
      const fileStore = useFileStore.getState();
      const previousValue = get().autoScheduling;
      const newValue = !previousValue;

      set((state) => {
        state.autoScheduling = newValue;
      });

      let dateAdjustments: DateAdjustment[] = [];
      if (newValue) {
        // Recalculate ALL constraints when toggling ON
        const tasks = useTaskStore.getState().tasks;
        const deps = useDependencyStore.getState().dependencies;
        dateAdjustments = propagateDateChanges(tasks, deps);
        if (dateAdjustments.length > 0) {
          useTaskStore.setState((state) => {
            const parentIds = applyDateAdjustments(
              dateAdjustments,
              state.tasks
            );
            if (parentIds.size > 0) {
              recalculateSummaryAncestors(state.tasks, parentIds);
            }
          });
          toast(
            `Auto-scheduling enabled — adjusted ${dateAdjustments.length} task(s)`
          );
        } else {
          toast("Auto-scheduling enabled");
        }
      } else {
        toast("Auto-scheduling disabled");
      }

      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.TOGGLE_AUTO_SCHEDULING,
          timestamp: Date.now(),
          description: newValue
            ? "Enable auto-scheduling"
            : "Disable auto-scheduling",
          params: { previousValue, newValue, dateAdjustments },
        });
      }

      fileStore.markDirty();
    },

    // Set auto-scheduling
    setAutoScheduling: (enabled: boolean): void => {
      set((state) => {
        state.autoScheduling = enabled;
      });
    },

    setAltKeyHeld: (held: boolean): void => {
      set((state) => {
        state.altKeyHeld = held;
      });
    },

    // Set weekend visibility
    setShowWeekends: (show: boolean): void => {
      set((state) => {
        state.showWeekends = show;
      });
    },

    // Set today marker visibility
    setShowTodayMarker: (show: boolean): void => {
      set((state) => {
        state.showTodayMarker = show;
      });
    },

    // Set holidays visibility
    setShowHolidays: (show: boolean): void => {
      set((state) => {
        state.showHolidays = show;
      });
    },

    // Set dependencies visibility
    setShowDependencies: (show: boolean): void => {
      set((state) => {
        state.showDependencies = show;
      });
    },

    // Set progress visibility
    setShowProgress: (show: boolean): void => {
      set((state) => {
        state.showProgress = show;
      });
    },

    // Set task label position
    setTaskLabelPosition: (position: TaskLabelPosition): void => {
      set((state) => {
        state.taskLabelPosition = position;
      });
    },

    // Set working days mode
    setWorkingDaysMode: (enabled: boolean): void => {
      set((state) => {
        state.workingDaysMode = enabled;
      });
    },

    // Set working days configuration (auto-derives workingDaysMode)
    setWorkingDaysConfig: (config: Partial<WorkingDaysConfig>): void => {
      set((state) => {
        Object.assign(state.workingDaysConfig, config);
        // Derive workingDaysMode: true if any exclusion is checked
        state.workingDaysMode =
          state.workingDaysConfig.excludeSaturday ||
          state.workingDaysConfig.excludeSunday ||
          state.workingDaysConfig.excludeHolidays;
      });
    },

    // Set holiday region
    setHolidayRegion: (region: string): void => {
      set((state) => {
        state.holidayRegion = region;
      });
      // Update holiday service with new region
      holidayService.setRegion(region);
    },

    // Set project title
    setProjectTitle: (title: string): void => {
      set((state) => {
        state.projectTitle = title;
      });
    },

    // Set project author
    setProjectAuthor: (author: string): void => {
      set((state) => {
        state.projectAuthor = author;
      });
    },

    // Set project logo
    setProjectLogo: (logo: ProjectLogo | null): void => {
      set((state) => {
        state.projectLogo = logo;
      });
    },

    // Column visibility actions
    toggleColumnVisibility: (columnId: string): void => {
      // Only allow toggling hideable columns
      const column = TASK_COLUMNS.find((c) => c.id === columnId);
      if (!column?.hideable) return;

      const taskState = useTaskStore.getState();
      const densityConfig = getCurrentDensityConfig();
      const isCurrentlyHidden = get().hiddenColumns.includes(columnId);

      set((state) => {
        const idx = state.hiddenColumns.indexOf(columnId);
        if (idx > -1) {
          state.hiddenColumns.splice(idx, 1);
        } else {
          state.hiddenColumns.push(columnId);
        }
      });

      // Adjust SplitPane width OUTSIDE set() — consistent with setHiddenColumns
      if (taskState.taskTableWidth !== null) {
        const colWidth = getColumnPixelWidth(
          columnId,
          taskState.columnWidths,
          densityConfig,
          get().workingDaysMode
        );
        const newWidth = isCurrentlyHidden
          ? taskState.taskTableWidth + colWidth // showing: expand
          : taskState.taskTableWidth - colWidth; // hiding: shrink
        taskState.setTaskTableWidth(Math.max(MIN_TABLE_WIDTH, newWidth));
      }
    },

    setHiddenColumns: (columns: string[]): void => {
      const taskState = useTaskStore.getState();
      const densityConfig = getCurrentDensityConfig();
      const oldHidden = get().hiddenColumns;

      set((state) => {
        state.hiddenColumns = columns;
      });

      // Adjust SplitPane width for the delta
      if (taskState.taskTableWidth !== null) {
        const nowShown = oldHidden.filter((id) => !columns.includes(id));
        const nowHidden = columns.filter((id) => !oldHidden.includes(id));

        const wdMode = get().workingDaysMode;
        let delta = 0;
        for (const id of nowShown) {
          delta += getColumnPixelWidth(
            id,
            taskState.columnWidths,
            densityConfig,
            wdMode
          );
        }
        for (const id of nowHidden) {
          delta -= getColumnPixelWidth(
            id,
            taskState.columnWidths,
            densityConfig,
            wdMode
          );
        }

        if (delta !== 0) {
          taskState.setTaskTableWidth(
            Math.max(MIN_TABLE_WIDTH, taskState.taskTableWidth + delta)
          );
        }
      }
    },

    // Task table collapse actions
    setTaskTableCollapsed: (collapsed: boolean): void => {
      set((state) => {
        state.isTaskTableCollapsed = collapsed;
      });
    },

    toggleTaskTableCollapsed: (): void => {
      set((state) => {
        state.isTaskTableCollapsed = !state.isTaskTableCollapsed;
      });
    },

    // Hidden tasks actions (Hide/Show Rows)
    hideTasks: (taskIds: TaskId[]): void => {
      const allTasks = useTaskStore.getState().tasks;
      const allIdsToHide = new Set<TaskId>();
      for (const id of taskIds) {
        allIdsToHide.add(id);
        // Summary: also hide all descendants
        const descendants = getTaskDescendants(allTasks, id);
        descendants.forEach((d) => allIdsToHide.add(d.id));
      }
      set((state) => {
        const newHidden = [
          ...new Set([...state.hiddenTaskIds, ...allIdsToHide]),
        ];
        state.hiddenTaskIds = newHidden;
      });
    },

    unhideTasks: (taskIds: TaskId[]): void => {
      set((state) => {
        const idsToUnhide = new Set(taskIds);
        state.hiddenTaskIds = state.hiddenTaskIds.filter(
          (id) => !idsToUnhide.has(id)
        );
      });
    },

    unhideAll: (): void => {
      set((state) => {
        state.hiddenTaskIds = [];
      });
    },

    setHiddenTaskIds: (ids: TaskId[]): void => {
      set((state) => {
        state.hiddenTaskIds = ids;
      });
    },

    // Color mode actions (Smart Color Management)
    setColorMode: (mode: ColorMode): void => {
      set((state) => {
        state.colorModeState.mode = mode;

        // Auto-select default palette when switching to theme mode without one
        if (
          mode === "theme" &&
          !state.colorModeState.themeOptions.selectedPaletteId &&
          !state.colorModeState.themeOptions.customMonochromeBase
        ) {
          state.colorModeState.themeOptions.selectedPaletteId =
            DEFAULT_PALETTE_ID;
        }
      });
    },

    setThemeOptions: (options: Partial<ThemeModeOptions>): void => {
      set((state) => {
        Object.assign(state.colorModeState.themeOptions, options);
      });
    },

    setSummaryOptions: (options: Partial<SummaryModeOptions>): void => {
      set((state) => {
        Object.assign(state.colorModeState.summaryOptions, options);
      });
    },

    setTaskTypeOptions: (options: Partial<TaskTypeModeOptions>): void => {
      set((state) => {
        Object.assign(state.colorModeState.taskTypeOptions, options);
      });
    },

    setHierarchyOptions: (options: Partial<HierarchyModeOptions>): void => {
      set((state) => {
        Object.assign(state.colorModeState.hierarchyOptions, options);
      });
    },

    setColorModeState: (newState: ColorModeState): void => {
      set((state) => {
        state.colorModeState = newState;
      });
    },

    applyColorsToManual: (): void => {
      const colorModeState = get().colorModeState;

      // Guard: no-op if already in manual mode
      if (colorModeState.mode === "manual") return;

      const tasks = useTaskStore.getState().tasks;

      // Capture previous state and compute new colors
      const previousColorModeState = structuredClone(colorModeState);
      const colorChanges: ApplyColorsToManualParams["colorChanges"] = [];

      for (const task of tasks) {
        const computedColor = getComputedTaskColor(task, tasks, colorModeState);
        colorChanges.push({
          id: task.id,
          previousColor: task.color,
          previousColorOverride: task.colorOverride,
          newColor: computedColor as HexColor,
        });
      }

      // Apply colors to task store directly (avoid per-task history entries)
      useTaskStore.setState((state) => {
        const taskById = new Map(state.tasks.map((t, i) => [t.id, i]));
        for (const change of colorChanges) {
          const idx = taskById.get(change.id);
          if (idx !== undefined) {
            state.tasks[idx].color = change.newColor;
            state.tasks[idx].colorOverride = undefined;
          }
        }
      });

      // Switch to manual mode
      set((state) => {
        state.colorModeState.mode = "manual";
      });

      // Mark file dirty
      useFileStore.getState().markDirty();

      // Record history command
      useHistoryStore.getState().recordCommand({
        id: crypto.randomUUID(),
        type: CommandType.APPLY_COLORS_TO_MANUAL,
        timestamp: Date.now(),
        description: "Apply colors to manual",
        params: {
          previousColorModeState,
          colorChanges,
        },
      });
    },

    // Bulk settings update (for loading from file)
    setViewSettings: (settings: Partial<SettableViewFields>): void => {
      set((state) => {
        if (settings.zoom !== undefined) state.zoom = settings.zoom;
        if (settings.viewAnchorDate !== undefined)
          state.viewAnchorDate = settings.viewAnchorDate;
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
        if (settings.autoScheduling !== undefined)
          state.autoScheduling = settings.autoScheduling;
        if (settings.taskLabelPosition !== undefined)
          state.taskLabelPosition = settings.taskLabelPosition;
        if (settings.workingDaysConfig !== undefined) {
          state.workingDaysConfig = settings.workingDaysConfig;
          // Derive workingDaysMode from config (ignore persisted mode flag)
          state.workingDaysMode =
            settings.workingDaysConfig.excludeSaturday ||
            settings.workingDaysConfig.excludeSunday ||
            settings.workingDaysConfig.excludeHolidays;
        } else if (settings.workingDaysMode !== undefined) {
          state.workingDaysMode = settings.workingDaysMode;
        }
        if (settings.holidayRegion !== undefined)
          state.holidayRegion = settings.holidayRegion;
        if (settings.projectTitle !== undefined)
          state.projectTitle = settings.projectTitle;
        if (settings.projectAuthor !== undefined)
          state.projectAuthor = settings.projectAuthor;
        if (settings.projectLogo !== undefined)
          state.projectLogo = settings.projectLogo;
        if (settings.colorModeState !== undefined)
          state.colorModeState = settings.colorModeState;
        if (settings.hiddenColumns !== undefined)
          state.hiddenColumns = settings.hiddenColumns;
        if (settings.isTaskTableCollapsed !== undefined)
          state.isTaskTableCollapsed = settings.isTaskTableCollapsed;
        if (settings.hiddenTaskIds !== undefined)
          state.hiddenTaskIds = settings.hiddenTaskIds;
      });
      // Update holiday service if region changed
      if (settings.holidayRegion !== undefined) {
        holidayService.setRegion(settings.holidayRegion);
      }
    },

    // Set drag state (for multi-task preview)
    setDragState: (deltaDays: number, sourceTaskId: TaskId): void => {
      set((state) => {
        state.dragState = { deltaDays, sourceTaskId };
      });
    },

    // Clear drag state
    clearDragState: (): void => {
      set((state) => {
        state.dragState = null;
        // Lag delta is also a transient drag overlay — clear it together so
        // a stale pill never lingers after the gesture ends.
        state.lagDelta = null;
      });
    },

    // Set or clear the live lag-delta indicator (pass null to clear).
    // Called from useTaskBarInteraction's mousemove handler in auto-update-lag
    // mode. The setter is a no-op when the new value is structurally equal
    // to the current value to avoid React re-renders on every drag frame.
    setLagDelta: (
      delta: { depId: string; oldLag: number; newLag: number } | null
    ): void => {
      set((state) => {
        const current = state.lagDelta;
        if (delta === null) {
          if (current !== null) state.lagDelta = null;
          return;
        }
        if (
          current !== null &&
          current.depId === delta.depId &&
          current.oldLag === delta.oldLag &&
          current.newLag === delta.newLag
        ) {
          return;
        }
        state.lagDelta = delta;
      });
    },

    // Signal that a file was loaded (triggers scroll positioning)
    signalFileLoaded: (): void => {
      set((state) => {
        state.fileLoadCounter += 1;
      });
    },

    // Request scrolling the timeline to show a specific date.
    // Used by task creation to ensure newly created tasks are visible.
    // Consumed by useScrollToDate hook in GanttLayout.
    requestScrollToDate: (date: string): void => {
      set((state) => {
        state.scrollTargetDate = date;
      });
    },

    clearScrollTarget: (): void => {
      set((state) => {
        state.scrollTargetDate = null;
      });
    },

    // Reset dateRange/scale before loading new data (file open, localStorage restore)
    resetForLoad: (): void => {
      set((state) => {
        state.dateRange = null;
        state.scale = null;
      });
    },

    // Set pending vertical scroll position to restore (consumed by GanttLayout)
    setPendingScrollTop: (top: number | null): void => {
      set((state) => {
        state.pendingScrollTop = top;
      });
    },

    // Expand dateRange to include a target date (used by useScrollToDate)
    expandDateRangeTo: (targetDate: string): void => {
      set((state) => {
        if (!state.dateRange) return;
        const needsExpand =
          targetDate < state.dateRange.min || targetDate > state.dateRange.max;
        if (!needsExpand) return;
        if (targetDate < state.dateRange.min) {
          state.dateRange.min = addDays(targetDate, -DATE_RANGE_PADDING_DAYS);
        }
        if (targetDate > state.dateRange.max) {
          state.dateRange.max = addDays(targetDate, DATE_RANGE_PADDING_DAYS);
        }
        state.scale = deriveScale(state.dateRange, state.zoom);
      });
    },
  }))
);
