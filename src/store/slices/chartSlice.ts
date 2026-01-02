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

  // Navigation state (SINGLE SOURCE OF TRUTH - Sprint 1.2 Package 3)
  zoom: number; // 0.5 to 3.0 (50% to 300%)
  panOffset: { x: number; y: number }; // Pan position in pixels

  // View settings
  showWeekends: boolean;
  showTodayMarker: boolean;

  // Transient UI state
  isZooming: boolean;
  isPanning: boolean;

  // Scale lock (prevents updateScale from overriding fitToView's padded scale)
  scaleLocked: boolean;
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
}

const DEFAULT_CONTAINER_WIDTH = 800;

export const useChartStore = create<ChartState & ChartActions>()(
  immer((set, get) => ({
    // Initial state
    scale: null,
    containerWidth: DEFAULT_CONTAINER_WIDTH,
    zoom: 1.0,
    panOffset: { x: 0, y: 0 },
    showWeekends: true,
    showTodayMarker: true,
    isZooming: false,
    isPanning: false,
    scaleLocked: false,

    // Centralized scale calculation
    updateScale: (tasks: Task[]) => {
      console.log('🏪 [chartSlice] updateScale called');
      const currentState = get();

      // Check if scale is locked by fitToView
      if (currentState.scaleLocked) {
        console.log('  🔒 Scale locked by fitToView, unlocking and skipping update');
        set((state) => {
          state.scaleLocked = false;
        });
        return;
      }

      console.log('  📦 tasks.length:', tasks.length);
      console.log('  📏 current containerWidth:', currentState.containerWidth);
      console.log('  🔍 current zoom:', currentState.zoom);

      set((state) => {
        const dateRange = getDateRange(tasks);
        console.log('  📅 Raw task range:', { min: dateRange.min, max: dateRange.max });

        // Add 7 days padding for comfortable view
        const paddedMin = addDays(dateRange.min, -7);
        const paddedMax = addDays(dateRange.max, 7);
        console.log('  📅 Padded range:', { min: paddedMin, max: paddedMax });

        const newScale = getTimelineScale(
          paddedMin,
          paddedMax,
          state.containerWidth,
          state.zoom
        );

        console.log('  📐 calculated scale.totalWidth:', newScale.totalWidth);
        console.log('  📊 calculated scale.pixelsPerDay:', newScale.pixelsPerDay);

        state.scale = newScale;
      });

      console.log('  ✅ updateScale complete');
    },

    // Set container width (scale will be recalculated by updateScale)
    setContainerWidth: (width: number) => {
      console.log('🏪 [chartSlice] setContainerWidth called with:', width);
      const currentState = get();
      console.log('  📏 OLD containerWidth:', currentState.containerWidth);

      set((state) => {
        state.containerWidth = width;
        // Don't recalculate scale here - let updateScale (which has task data) handle it
        // This prevents using extended minDate/maxDate from previous zoom operations
      });

      console.log('  ✅ setContainerWidth complete');
    },

    // Zoom with optional mouse centering (Sprint 1.2 Package 3)
    setZoom: (newZoom: number, _centerPoint?: { x: number; y: number }) => {
      set((state) => {
        const constrainedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

        // Don't recalculate scale here - let updateScale (which has task data) handle it
        // This prevents accumulating extended minDate/maxDate from previous zoom operations

        // Note: centerPoint pan adjustment removed - would need scale recalculation
        // The updateScale in ChartCanvas will trigger and recalculate correctly

        state.zoom = constrainedZoom;
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
      console.log('🎯 [chartSlice] fitToView called');

      if (tasks.length === 0) {
        get().resetZoom();
        get().resetPan();
        return;
      }

      const { min, max } = getDateRange(tasks);
      console.log('  📅 Raw task range:', { min, max });

      // Add 1 week (7 days) padding before and after tasks
      const paddedMin = addDays(min, -7);
      const paddedMax = addDays(max, 7);
      console.log('  📅 Padded range:', { min: paddedMin, max: paddedMax });

      const paddedDuration = calculateDuration(paddedMin, paddedMax);
      console.log('  📊 Padded duration:', paddedDuration, 'days');

      const containerWidth = get().containerWidth;
      console.log('  📏 Container width:', containerWidth, 'px');

      // Calculate zoom to fit padded duration exactly in container
      // Formula: totalWidth = paddedDuration × (FIXED_BASE_PIXELS_PER_DAY × zoom)
      // We want: containerWidth = paddedDuration × (25 × zoom)
      // Therefore: zoom = containerWidth / (paddedDuration × 25)
      const idealZoom = containerWidth / (paddedDuration * FIXED_BASE_PIXELS_PER_DAY);
      console.log('  🔍 Ideal zoom:', idealZoom);

      // Set zoom (clamped to valid range)
      const finalZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, idealZoom));
      console.log('  🔍 Final zoom (clamped):', finalZoom);

      // IMPORTANT: Set zoom AND scale directly with padded dates
      // Lock scale to prevent updateScale from overriding with original task dates
      const newScale = getTimelineScale(
        paddedMin,
        paddedMax,
        containerWidth,
        finalZoom
      );
      console.log('  📐 New scale:', {
        minDate: newScale.minDate,
        maxDate: newScale.maxDate,
        totalWidth: newScale.totalWidth,
        totalDays: newScale.totalDays,
        pixelsPerDay: newScale.pixelsPerDay,
      });

      set((state) => {
        state.zoom = finalZoom;
        state.scale = newScale;
        state.panOffset = { x: 0, y: 0 };
        state.scaleLocked = true; // Prevent next updateScale from overriding
      });

      console.log('  ✅ fitToView complete, scaleLocked = true');
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
  }))
);
