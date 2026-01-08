/**
 * Unit tests for useZoom hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useZoom } from '../../../src/hooks/useZoom';
import { useChartStore } from '../../../src/store/slices/chartSlice';
import { createRef } from 'react';

describe('useZoom', () => {
  let containerRef: React.RefObject<HTMLDivElement>;
  let setZoomSpy: ReturnType<typeof vi.fn>;
  let zoomInSpy: ReturnType<typeof vi.fn>;
  let zoomOutSpy: ReturnType<typeof vi.fn>;
  let resetZoomSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create a ref with a mock element
    containerRef = createRef() as React.RefObject<HTMLDivElement>;
    const mockElement = document.createElement('div');
    mockElement.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 50,
      right: 900,
      bottom: 550,
      width: 800,
      height: 500,
      x: 100,
      y: 50,
      toJSON: () => {},
    }));
    (containerRef as any).current = mockElement;

    // Create spies
    setZoomSpy = vi.fn();
    zoomInSpy = vi.fn();
    zoomOutSpy = vi.fn();
    resetZoomSpy = vi.fn();

    // Mock the store
    useChartStore.setState({
      zoom: 1.0,
      scale: null,
      containerWidth: 800,
      dateRange: null,
      panOffset: { x: 0, y: 0 },
      showWeekends: true,
      showTodayMarker: true,
      isZooming: false,
      isPanning: false,
    });

    vi.spyOn(useChartStore.getState(), 'setZoom').mockImplementation(setZoomSpy);
    vi.spyOn(useChartStore.getState(), 'zoomIn').mockImplementation(zoomInSpy);
    vi.spyOn(useChartStore.getState(), 'zoomOut').mockImplementation(zoomOutSpy);
    vi.spyOn(useChartStore.getState(), 'resetZoom').mockImplementation(resetZoomSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Wheel zoom', () => {
    it('should zoom in on Ctrl+Wheel up (fallback without scale)', () => {
      const { result } = renderHook(() => useZoom({ containerRef }));

      const wheelEvent = {
        ctrlKey: true,
        deltaY: -100, // Negative = wheel up = zoom in
        clientX: 500,
        clientY: 300,
      } as React.WheelEvent;

      result.current.handlers.onWheel(wheelEvent);

      // Without scale, uses fallback: setZoom(zoom * factor) without anchor
      // Exponential zoom: 1.0 × 1.15 = 1.15
      expect(setZoomSpy).toHaveBeenCalledWith(1.15);
    });

    it('should zoom out on Ctrl+Wheel down (fallback without scale)', () => {
      const { result } = renderHook(() => useZoom({ containerRef }));

      const wheelEvent = {
        ctrlKey: true,
        deltaY: 100, // Positive = wheel down = zoom out
        clientX: 500,
        clientY: 300,
      } as React.WheelEvent;

      result.current.handlers.onWheel(wheelEvent);

      // Without scale, uses fallback: setZoom(zoom * factor) without anchor
      // Exponential zoom: 1.0 / 1.15 ≈ 0.8696
      expect(setZoomSpy).toHaveBeenCalledWith(expect.closeTo(0.8696, 3));
    });

    it('should use metaKey on Mac', () => {
      const { result } = renderHook(() => useZoom({ containerRef }));

      const wheelEvent = {
        metaKey: true, // Cmd key on Mac
        deltaY: -100,
        clientX: 500,
        clientY: 300,
      } as React.WheelEvent;

      result.current.handlers.onWheel(wheelEvent);

      expect(setZoomSpy).toHaveBeenCalled();
    });

    it('should not zoom without Ctrl/Cmd key', () => {
      const { result } = renderHook(() => useZoom({ containerRef }));

      const wheelEvent = {
        ctrlKey: false,
        metaKey: false,
        deltaY: -100,
        clientX: 500,
        clientY: 300,
      } as React.WheelEvent;

      result.current.handlers.onWheel(wheelEvent);

      expect(setZoomSpy).not.toHaveBeenCalled();
    });

    it('should not zoom when disabled', () => {
      const { result } = renderHook(() => useZoom({ containerRef, enabled: false }));

      const wheelEvent = {
        ctrlKey: true,
        deltaY: -100,
        clientX: 500,
        clientY: 300,
      } as React.WheelEvent;

      result.current.handlers.onWheel(wheelEvent);

      expect(setZoomSpy).not.toHaveBeenCalled();
    });

    it('should not zoom when container ref is not set', () => {
      const emptyRef = createRef() as React.RefObject<HTMLDivElement>;
      const { result } = renderHook(() => useZoom({ containerRef: emptyRef }));

      const wheelEvent = {
        ctrlKey: true,
        deltaY: -100,
        clientX: 500,
        clientY: 300,
      } as React.WheelEvent;

      result.current.handlers.onWheel(wheelEvent);

      expect(setZoomSpy).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard shortcuts', () => {
    const simulateKeyPress = (key: string, options: Partial<KeyboardEventInit> = {}) => {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...options,
      });
      window.dispatchEvent(event);
      return event;
    };

    it('should reset zoom on Ctrl+0', () => {
      renderHook(() => useZoom({ containerRef }));

      simulateKeyPress('0', { ctrlKey: true });

      expect(resetZoomSpy).toHaveBeenCalledTimes(1);
    });

    it('should zoom in on Ctrl++', () => {
      renderHook(() => useZoom({ containerRef }));

      simulateKeyPress('+', { ctrlKey: true });

      expect(zoomInSpy).toHaveBeenCalledTimes(1);
    });

    it('should zoom in on Ctrl+=', () => {
      renderHook(() => useZoom({ containerRef }));

      simulateKeyPress('=', { ctrlKey: true });

      expect(zoomInSpy).toHaveBeenCalledTimes(1);
    });

    it('should zoom out on Ctrl+-', () => {
      renderHook(() => useZoom({ containerRef }));

      simulateKeyPress('-', { ctrlKey: true });

      expect(zoomOutSpy).toHaveBeenCalledTimes(1);
    });

    it('should zoom out on Ctrl+_', () => {
      renderHook(() => useZoom({ containerRef }));

      simulateKeyPress('_', { ctrlKey: true });

      expect(zoomOutSpy).toHaveBeenCalledTimes(1);
    });

    it('should work with metaKey (Mac)', () => {
      renderHook(() => useZoom({ containerRef }));

      simulateKeyPress('0', { metaKey: true });

      expect(resetZoomSpy).toHaveBeenCalledTimes(1);
    });

    it('should not trigger in input elements', () => {
      renderHook(() => useZoom({ containerRef }));

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: '0',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);

      expect(resetZoomSpy).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not trigger in textarea elements', () => {
      renderHook(() => useZoom({ containerRef }));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent('keydown', {
        key: '+',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      textarea.dispatchEvent(event);

      expect(zoomInSpy).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it.skip('should not trigger in contentEditable elements', () => {
      // Note: contentEditable detection in jsdom has known issues
      renderHook(() => useZoom({ containerRef }));

      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);
      div.focus();

      const event = new KeyboardEvent('keydown', {
        key: '-',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      div.dispatchEvent(event);

      expect(zoomOutSpy).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('should not trigger without Ctrl/Cmd', () => {
      renderHook(() => useZoom({ containerRef }));

      simulateKeyPress('0');

      expect(resetZoomSpy).not.toHaveBeenCalled();
    });

    it('should not trigger when disabled', () => {
      renderHook(() => useZoom({ containerRef, enabled: false }));

      simulateKeyPress('0', { ctrlKey: true });

      expect(resetZoomSpy).not.toHaveBeenCalled();
    });
  });

  describe('Event cleanup', () => {
    it('should remove wheel event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useZoom({ containerRef }));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'wheel',
        expect.any(Function),
        expect.objectContaining({ capture: true })
      );
    });

    it('should remove keydown event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useZoom({ containerRef }));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should not add listeners when disabled', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const callsBefore = addEventListenerSpy.mock.calls.length;

      renderHook(() => useZoom({ containerRef, enabled: false }));

      // Should not add new event listeners
      const callsAfter = addEventListenerSpy.mock.calls.length;
      expect(callsAfter).toBe(callsBefore);
    });
  });

  describe('Multiple zoom operations', () => {
    it('should handle multiple keyboard shortcuts', () => {
      renderHook(() => useZoom({ containerRef }));

      const simulateKeyPress = (key: string, options: Partial<KeyboardEventInit> = {}) => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            key,
            bubbles: true,
            cancelable: true,
            ...options,
          })
        );
      };

      simulateKeyPress('+', { ctrlKey: true });
      simulateKeyPress('+', { ctrlKey: true });
      simulateKeyPress('-', { ctrlKey: true });
      simulateKeyPress('0', { ctrlKey: true });

      expect(zoomInSpy).toHaveBeenCalledTimes(2);
      expect(zoomOutSpy).toHaveBeenCalledTimes(1);
      expect(resetZoomSpy).toHaveBeenCalledTimes(1);
    });
  });
});
