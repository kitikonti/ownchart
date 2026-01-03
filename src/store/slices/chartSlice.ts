/**
 * Chart state management slice for Gantt timeline
 * Manages timeline scale, zoom, pan, and view settings
 * SINGLE SOURCE OF TRUTH for navigation state (Sprint 1.2 Package 3)
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TimelineScale } from '../../utils/timelineUtils';
import { getTimelineScale, MIN_ZOOM, MAX_ZOOM, FIXED_BASE_PIXELS_PER_DAY } from '../../utils/timelineUtils';
import { getDateRange, calculateDuration, addDays } from '../../utils/dateUtils';
import type { Task } from '../../types/chart.types';

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

  // View settings
  showWeekends: boolean;
  showTodayMarker: boolean;

  // Transient UI state
  isZooming: boolean;
  isPanning: boolean;
}

interface ChartActions {
  // Centralized scale lifecycle (Architect recommendation)
  updateScale: (tasks: Task[]) => void;
  setContainerWidth: (width: number) => void;

  // Zoom actions (Sprint 1.2 Package 3)
  setZoom: (zoom: number, centerPoint?: { x: number; y: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

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

  // Settings
  toggleWeekends: () => void;
  toggleTodayMarker: () => void;
  setShowWeekends: (show: boolean) => void;
  setShowTodayMarker: (show: boolean) => void;
}

const DEFAULT_CONTAINER_WIDTH = 800;

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

  return getTimelineScale(
    dateRange.min,
    dateRange.max,
    containerWidth,
    zoom
  );
}

export const useChartStore = create<ChartState & ChartActions>()(
  immer((set, get) => ({
    // Initial state
    scale: null,
    containerWidth: DEFAULT_CONTAINER_WIDTH,
    dateRange: null,
    zoom: 1.0,
    panOffset: { x: 0, y: 0 },
    showWeekends: true,
    showTodayMarker: true,
    isZooming: false,
    isPanning: false,

    // Centralized scale calculation - updates dateRange from tasks, then derives scale
    updateScale: (tasks: Task[]) => {
      set((state) => {
        const taskDateRange = getDateRange(tasks);

        // Add 7 days padding for comfortable view
        const paddedMin = addDays(taskDateRange.min, -7);
        const paddedMax = addDays(taskDateRange.max, 7);

        // Update dateRange
        state.dateRange = { min: paddedMin, max: paddedMax };

        // Derive scale from dateRange
        state.scale = deriveScale(state.dateRange, state.containerWidth, state.zoom);
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

    // Zoom with optional mouse centering (Sprint 1.2 Package 3)
    setZoom: (newZoom: number, _centerPoint?: { x: number; y: number }) => {
      set((state) => {
        const constrainedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        state.zoom = constrainedZoom;

        // Recalculate scale if we have a dateRange
        // Note: centerPoint pan adjustment not implemented yet
        if (state.dateRange) {
          state.scale = deriveScale(state.dateRange, state.containerWidth, constrainedZoom);
        }
      });
    },

    // Zoom in by 25% increment
    zoomIn: () => {
      const current = get().zoom;
      get().setZoom(Math.min(MAX_ZOOM, current + 0.25));
    },

    // Zoom out by 25% decrement
    zoomOut: () => {
      const current = get().zoom;
      get().setZoom(Math.max(MIN_ZOOM, current - 0.25));
    },

    // Reset zoom to 100%
    resetZoom: () => {
      get().setZoom(1.0);
    },

    // Set pan offset (validates for NaN/Infinity)
    setPanOffset: (offset: { x: number; y: number }) => {
      set((state) => {
        // Validate to prevent NaN or Infinity
        if (isFinite(offset.x) && isFinite(offset.y)) {
          state.panOffset = offset;
        } else {
          console.error('Invalid pan offset:', offset);
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

    // Fit all tasks in view with 1 week padding on each side
    fitToView: (tasks: Task[]) => {
      if (tasks.length === 0) {
        get().resetZoom();
        get().resetPan();
        return;
      }

      const { min, max } = getDateRange(tasks);

      // Add 1 week (7 days) padding before and after tasks
      const paddedMin = addDays(min, -7);
      const paddedMax = addDays(max, 7);

      const paddedDuration = calculateDuration(paddedMin, paddedMax);
      const containerWidth = get().containerWidth;

      // Calculate zoom to fit padded duration exactly in container
      // Formula: totalWidth = paddedDuration × (FIXED_BASE_PIXELS_PER_DAY × zoom)
      // We want: containerWidth = paddedDuration × (25 × zoom)
      // Therefore: zoom = containerWidth / (paddedDuration × 25)
      const idealZoom = containerWidth / (paddedDuration * FIXED_BASE_PIXELS_PER_DAY);

      // Set zoom (clamped to valid range)
      const finalZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, idealZoom));

      // Set dateRange and zoom, then derive scale
      // No need for scaleLocked - dateRange IS the source of truth now
      const newDateRange = { min: paddedMin, max: paddedMax };

      set((state) => {
        state.dateRange = newDateRange;
        state.zoom = finalZoom;
        state.panOffset = { x: 0, y: 0 };
        state.scale = deriveScale(newDateRange, containerWidth, finalZoom);
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
  }))
);
