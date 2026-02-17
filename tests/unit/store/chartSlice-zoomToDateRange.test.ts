/**
 * Unit tests for chartSlice.zoomToDateRange action
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useChartStore } from '../../../src/store/slices/chartSlice';
import { FIXED_BASE_PIXELS_PER_DAY } from '../../../src/utils/timelineUtils';
import { calculateDuration, addDays } from '../../../src/utils/dateUtils';
import type { Task } from '../../../src/types/chart.types';

describe('chartSlice - zoomToDateRange', () => {
  beforeEach(() => {
    useChartStore.setState({
      scale: null,
      containerWidth: 1000,
      dateRange: null,
      zoom: 1.0,
      panOffset: { x: 0, y: 0 },
      lastFitToViewTime: 0,
    });

    // Initialize with tasks to get a valid scale
    const tasks: Task[] = [
      {
        id: '1',
        name: 'Task 1',
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        duration: 90,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      },
    ];
    useChartStore.getState().updateScale(tasks);
  });

  it('should set zoom to fit the specified date range with padding', () => {
    const { zoomToDateRange } = useChartStore.getState();

    zoomToDateRange('2025-02-01', '2025-02-28');

    const state = useChartStore.getState();

    // Expected: 28 days + 4 days padding = 32 days visible
    const paddedStart = addDays('2025-02-01', -2);
    const paddedEnd = addDays('2025-02-28', 2);
    const visibleDuration = calculateDuration(paddedStart, paddedEnd);
    const expectedZoom = 1000 / (visibleDuration * FIXED_BASE_PIXELS_PER_DAY);

    expect(state.zoom).toBeCloseTo(expectedZoom, 5);
  });

  it('should set dateRange with 85/90 days scroll padding', () => {
    const { zoomToDateRange } = useChartStore.getState();

    zoomToDateRange('2025-02-01', '2025-02-28');

    const state = useChartStore.getState();
    expect(state.dateRange).not.toBeNull();
    // Left: 85 days so GanttLayout's SCROLL_OFFSET_DAYS (83) lands at startDate - 2
    expect(state.dateRange!.min).toBe(addDays('2025-02-01', -85));
    expect(state.dateRange!.max).toBe(addDays('2025-02-28', 90));
  });

  it('should reset pan offset to zero', () => {
    // Set a non-zero pan offset first
    useChartStore.setState({ panOffset: { x: 100, y: 50 } });

    const { zoomToDateRange } = useChartStore.getState();
    zoomToDateRange('2025-02-01', '2025-02-28');

    expect(useChartStore.getState().panOffset).toEqual({ x: 0, y: 0 });
  });

  it('should update lastFitToViewTime to block infinite scroll', () => {
    const before = Date.now();
    const { zoomToDateRange } = useChartStore.getState();

    zoomToDateRange('2025-02-01', '2025-02-28');

    const state = useChartStore.getState();
    expect(state.lastFitToViewTime).toBeGreaterThanOrEqual(before);
  });

  it('should derive a valid scale after zoom', () => {
    const { zoomToDateRange } = useChartStore.getState();

    zoomToDateRange('2025-02-01', '2025-02-28');

    const state = useChartStore.getState();
    expect(state.scale).not.toBeNull();
    expect(state.scale!.pixelsPerDay).toBeGreaterThan(0);
  });

  it('should handle a single-day range', () => {
    const { zoomToDateRange } = useChartStore.getState();

    zoomToDateRange('2025-02-15', '2025-02-15');

    const state = useChartStore.getState();
    // Should still produce a valid zoom (4 days padding: -2 to +2)
    expect(state.zoom).toBeGreaterThan(0);
    expect(state.scale).not.toBeNull();
  });

  it('should clamp zoom within MIN_ZOOM and MAX_ZOOM bounds', () => {
    // Very large range should clamp to MIN_ZOOM
    const { zoomToDateRange } = useChartStore.getState();

    zoomToDateRange('2020-01-01', '2030-12-31');

    const state = useChartStore.getState();
    expect(state.zoom).toBeGreaterThanOrEqual(0.05);
    expect(state.zoom).toBeLessThanOrEqual(3.0);
  });
});
