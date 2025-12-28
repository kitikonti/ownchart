/**
 * Chart state management slice for Gantt timeline
 * Manages timeline scale, zoom, scroll, and view settings
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TimelineScale } from '../../utils/timelineUtils';
import { getTimelineScale } from '../../utils/timelineUtils';
import { getDateRange } from '../../utils/dateUtils';
import type { Task } from '../../types/chart.types';

interface ChartState {
  // Scale management (CRITICAL from Architect review)
  scale: TimelineScale | null;
  containerWidth: number;

  // View state
  zoom: number;
  scrollX: number;
  scrollY: number;
  showWeekends: boolean;
  showTodayMarker: boolean;
}

interface ChartActions {
  // Centralized scale lifecycle (Architect recommendation)
  updateScale: (tasks: Task[]) => void;
  setContainerWidth: (width: number) => void;

  // View actions
  setZoom: (zoom: number) => void;
  setScroll: (x: number, y: number) => void;
  setScrollX: (x: number) => void;
  setScrollY: (y: number) => void;
  resetView: () => void;

  // Settings
  toggleWeekends: () => void;
  toggleTodayMarker: () => void;
}

const DEFAULT_CONTAINER_WIDTH = 800;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;

export const useChartStore = create<ChartState & ChartActions>()(
  immer((set) => ({
    // Initial state
    scale: null,
    containerWidth: DEFAULT_CONTAINER_WIDTH,
    zoom: 1,
    scrollX: 0,
    scrollY: 0,
    showWeekends: true,
    showTodayMarker: true,

    // Centralized scale calculation
    updateScale: (tasks: Task[]) => {
      set((state) => {
        const dateRange = getDateRange(tasks);
        state.scale = getTimelineScale(
          dateRange.min,
          dateRange.max,
          state.containerWidth,
          state.zoom
        );
      });
    },

    // Set container width and recalculate scale
    setContainerWidth: (width: number) => {
      set((state) => {
        state.containerWidth = width;

        // Recalculate scale with new width if scale exists
        if (state.scale) {
          state.scale = getTimelineScale(
            state.scale.minDate,
            state.scale.maxDate,
            width,
            state.zoom
          );
        }
      });
    },

    // Zoom with constraints
    setZoom: (zoom: number) => {
      set((state) => {
        const constrainedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
        state.zoom = constrainedZoom;

        // Recalculate scale with new zoom
        if (state.scale) {
          state.scale = getTimelineScale(
            state.scale.minDate,
            state.scale.maxDate,
            state.containerWidth,
            constrainedZoom
          );
        }
      });
    },

    // Set scroll position
    setScroll: (x: number, y: number) => {
      set((state) => {
        state.scrollX = Math.max(0, x);
        state.scrollY = Math.max(0, y);
      });
    },

    setScrollX: (x: number) => {
      set((state) => {
        state.scrollX = Math.max(0, x);
      });
    },

    setScrollY: (y: number) => {
      set((state) => {
        state.scrollY = Math.max(0, y);
      });
    },

    // Reset to default view
    resetView: () => {
      set((state) => {
        state.zoom = 1;
        state.scrollX = 0;
        state.scrollY = 0;

        // Recalculate scale with default zoom
        if (state.scale) {
          state.scale = getTimelineScale(
            state.scale.minDate,
            state.scale.maxDate,
            state.containerWidth,
            1
          );
        }
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
