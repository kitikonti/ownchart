/**
 * Unit tests for chartSlice pan/zoom functionality
 * Sprint 1.2 Package 3: Navigation & Scale
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useChartStore } from '../../../src/store/slices/chartSlice';
import type { Task } from '../../../src/types/chart.types';

describe('Chart Store - Pan/Zoom Navigation', () => {
  beforeEach(() => {
    // Reset store before each test
    useChartStore.setState({
      scale: null,
      containerWidth: 800,
      dateRange: null,
      zoom: 1.0,
      panOffset: { x: 0, y: 0 },
      showWeekends: true,
      showTodayMarker: true,
      isZooming: false,
      isPanning: false,
    });
  });

  describe('setZoom', () => {
    it('should set zoom level within valid range', () => {
      const { setZoom } = useChartStore.getState();

      setZoom(1.5);
      expect(useChartStore.getState().zoom).toBe(1.5);

      setZoom(2.0);
      expect(useChartStore.getState().zoom).toBe(2.0);
    });

    it('should clamp zoom to minimum (0.05)', () => {
      const { setZoom } = useChartStore.getState();

      setZoom(0.03); // Below minimum
      expect(useChartStore.getState().zoom).toBe(0.05);

      setZoom(0.05); // At minimum
      expect(useChartStore.getState().zoom).toBe(0.05);
    });

    it('should clamp zoom to maximum (3.0)', () => {
      const { setZoom } = useChartStore.getState();

      setZoom(3.5); // Above maximum
      expect(useChartStore.getState().zoom).toBe(3.0);

      setZoom(3.0); // At maximum
      expect(useChartStore.getState().zoom).toBe(3.0);
    });

    it('should accept anchor parameter and return newScrollLeft for scroll adjustment', () => {
      const { setZoom, setContainerWidth, updateScale } = useChartStore.getState();

      // Create minimal mock tasks for scale calculation
      const tasks: Task[] = [
        {
          id: '1',
          name: 'Task 1',
          startDate: '2025-01-01',
          endDate: '2025-01-10',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          metadata: {},
        },
      ];

      // Set up a scale first
      setContainerWidth(1000);
      updateScale(tasks);

      // Start at zoom 1.0, pan offset (0, 0)
      const initialState = useChartStore.getState();
      expect(initialState.zoom).toBe(1.0);
      expect(initialState.panOffset).toEqual({ x: 0, y: 0 });

      // Call setZoom with anchor parameter
      const anchor = {
        anchorDate: '2024-01-15',
        anchorPixelOffset: 400,
      };
      const result = setZoom(2.0, anchor);

      const state = useChartStore.getState();
      expect(state.zoom).toBe(2.0);

      // Pan offset should remain unchanged (only scrollLeft is returned)
      expect(state.panOffset).toEqual({ x: 0, y: 0 });

      // Result should contain newScrollLeft for scroll position adjustment
      expect(result.newScrollLeft).toBeDefined();
      expect(typeof result.newScrollLeft).toBe('number');
    });
  });

  describe('zoomIn', () => {
    it('should increase zoom by exponential factor (×1.2)', () => {
      const { zoomIn } = useChartStore.getState();

      zoomIn();
      expect(useChartStore.getState().zoom).toBeCloseTo(1.2, 2);

      zoomIn();
      expect(useChartStore.getState().zoom).toBeCloseTo(1.44, 2);
    });

    it('should not exceed maximum zoom (3.0)', () => {
      const { setZoom, zoomIn } = useChartStore.getState();

      setZoom(2.6);
      zoomIn(); // 2.6 × 1.2 = 3.12 → clamped to 3.0
      expect(useChartStore.getState().zoom).toBe(3.0);

      zoomIn(); // Should stay at 3.0
      expect(useChartStore.getState().zoom).toBe(3.0);
    });
  });

  describe('zoomOut', () => {
    it('should decrease zoom by exponential factor (÷1.2)', () => {
      const { zoomOut } = useChartStore.getState();

      zoomOut();
      expect(useChartStore.getState().zoom).toBeCloseTo(0.833, 2);

      zoomOut();
      expect(useChartStore.getState().zoom).toBeCloseTo(0.694, 2);
    });

    it('should not go below minimum zoom (0.05)', () => {
      const { setZoom, zoomOut } = useChartStore.getState();

      setZoom(0.06);
      zoomOut(); // 0.06 / 1.2 = 0.05 → clamped to 0.05
      expect(useChartStore.getState().zoom).toBe(0.05);

      zoomOut(); // Should stay at 0.05
      expect(useChartStore.getState().zoom).toBe(0.05);
    });
  });

  describe('resetZoom', () => {
    it('should reset zoom to 1.0', () => {
      const { setZoom, resetZoom } = useChartStore.getState();

      setZoom(2.5);
      expect(useChartStore.getState().zoom).toBe(2.5);

      resetZoom();
      expect(useChartStore.getState().zoom).toBe(1.0);
    });
  });

  describe('setPanOffset', () => {
    it('should set pan offset', () => {
      const { setPanOffset } = useChartStore.getState();

      setPanOffset({ x: 100, y: 50 });
      expect(useChartStore.getState().panOffset).toEqual({ x: 100, y: 50 });

      setPanOffset({ x: -200, y: -150 });
      expect(useChartStore.getState().panOffset).toEqual({ x: -200, y: -150 });
    });

    it('should silently reject NaN or Infinity values', () => {
      const { setPanOffset } = useChartStore.getState();

      setPanOffset({ x: NaN, y: 50 });
      expect(useChartStore.getState().panOffset).toEqual({ x: 0, y: 0 }); // Should not change

      setPanOffset({ x: 100, y: Infinity });
      expect(useChartStore.getState().panOffset).toEqual({ x: 0, y: 0 }); // Should not change
    });
  });

  describe('panBy', () => {
    it('should add delta to current pan offset', () => {
      const { setPanOffset, panBy } = useChartStore.getState();

      setPanOffset({ x: 100, y: 50 });
      panBy({ x: 50, y: 25 });

      expect(useChartStore.getState().panOffset).toEqual({ x: 150, y: 75 });

      panBy({ x: -100, y: -50 });
      expect(useChartStore.getState().panOffset).toEqual({ x: 50, y: 25 });
    });

    it('should reject NaN or Infinity deltas', () => {
      const { setPanOffset, panBy } = useChartStore.getState();

      setPanOffset({ x: 100, y: 50 });
      panBy({ x: NaN, y: 10 });
      expect(useChartStore.getState().panOffset).toEqual({ x: 100, y: 50 }); // Should not change

      panBy({ x: 10, y: Infinity });
      expect(useChartStore.getState().panOffset).toEqual({ x: 100, y: 50 }); // Should not change
    });
  });

  describe('resetPan', () => {
    it('should reset pan offset to origin', () => {
      const { setPanOffset, resetPan } = useChartStore.getState();

      setPanOffset({ x: 200, y: 150 });
      expect(useChartStore.getState().panOffset).toEqual({ x: 200, y: 150 });

      resetPan();
      expect(useChartStore.getState().panOffset).toEqual({ x: 0, y: 0 });
    });
  });

  describe('fitToView', () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        name: 'Task 1',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      },
      {
        id: '2',
        name: 'Task 2',
        startDate: '2025-01-15',
        endDate: '2025-01-30',
        duration: 15,
        progress: 0,
        color: '#3b82f6',
        order: 1,
        metadata: {},
      },
    ];

    it('should calculate zoom to fit all tasks', () => {
      const { fitToView } = useChartStore.getState();

      fitToView(mockTasks);

      const state = useChartStore.getState();
      expect(state.zoom).toBeGreaterThan(0);
      expect(state.zoom).toBeGreaterThanOrEqual(0.5);
      expect(state.zoom).toBeLessThanOrEqual(3.0);
    });

    it('should reset zoom and pan when no tasks', () => {
      const { setZoom, setPanOffset, fitToView } = useChartStore.getState();

      setZoom(2.0);
      setPanOffset({ x: 100, y: 50 });

      fitToView([]);

      expect(useChartStore.getState().zoom).toBe(1.0);
      expect(useChartStore.getState().panOffset).toEqual({ x: 0, y: 0 });
    });
  });

  describe('resetView', () => {
    it('should reset both zoom and pan offset', () => {
      const { setZoom, setPanOffset, resetView } = useChartStore.getState();

      setZoom(2.5);
      setPanOffset({ x: 200, y: 150 });

      resetView();

      expect(useChartStore.getState().zoom).toBe(1.0);
      expect(useChartStore.getState().panOffset).toEqual({ x: 0, y: 0 });
    });
  });

  describe('transient state', () => {
    it('should track panning state', () => {
      const { setIsPanning } = useChartStore.getState();

      setIsPanning(true);
      expect(useChartStore.getState().isPanning).toBe(true);

      setIsPanning(false);
      expect(useChartStore.getState().isPanning).toBe(false);
    });

    it('should track zooming state', () => {
      const { setIsZooming } = useChartStore.getState();

      setIsZooming(true);
      expect(useChartStore.getState().isZooming).toBe(true);

      setIsZooming(false);
      expect(useChartStore.getState().isZooming).toBe(false);
    });
  });
});
