/**
 * Unit tests for useKeyboardShortcuts hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../../src/hooks/useKeyboardShortcuts';
import { useHistoryStore } from '../../../src/store/slices/historySlice';
import { useChartStore } from '../../../src/store/slices/chartSlice';

// Mock the useFileOperations hook
const mockHandleSave = vi.fn();
const mockHandleSaveAs = vi.fn();
const mockHandleOpen = vi.fn();
const mockHandleNew = vi.fn();

vi.mock('../../../src/hooks/useFileOperations', () => ({
  useFileOperations: () => ({
    handleSave: mockHandleSave,
    handleSaveAs: mockHandleSaveAs,
    handleOpen: mockHandleOpen,
    handleNew: mockHandleNew,
  }),
}));

describe('useKeyboardShortcuts', () => {
  let undoSpy: ReturnType<typeof vi.fn>;
  let redoSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create spies for undo/redo
    undoSpy = vi.fn();
    redoSpy = vi.fn();

    // Mock the history store
    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      isUndoing: false,
      isRedoing: false,
    });

    vi.spyOn(useHistoryStore.getState(), 'undo').mockImplementation(undoSpy);
    vi.spyOn(useHistoryStore.getState(), 'redo').mockImplementation(redoSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  describe('Undo/Redo shortcuts', () => {
    it('should call undo on Ctrl+Z', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('z', { ctrlKey: true });

      expect(undoSpy).toHaveBeenCalledTimes(1);
      expect(redoSpy).not.toHaveBeenCalled();
    });

    it('should call redo on Ctrl+Shift+Z', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('z', { ctrlKey: true, shiftKey: true });

      expect(redoSpy).toHaveBeenCalledTimes(1);
      expect(undoSpy).not.toHaveBeenCalled();
    });

    it('should call redo on Ctrl+Y', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('y', { ctrlKey: true });

      expect(redoSpy).toHaveBeenCalledTimes(1);
      expect(undoSpy).not.toHaveBeenCalled();
    });

    it('should work with uppercase keys', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('Z', { ctrlKey: true });

      expect(undoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('File operation shortcuts', () => {
    it('should call handleSave on Ctrl+S', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('s', { ctrlKey: true });

      expect(mockHandleSave).toHaveBeenCalledTimes(1);
      expect(mockHandleSaveAs).not.toHaveBeenCalled();
    });

    it('should call handleSaveAs on Ctrl+Shift+S', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('s', { ctrlKey: true, shiftKey: true });

      expect(mockHandleSaveAs).toHaveBeenCalledTimes(1);
      expect(mockHandleSave).not.toHaveBeenCalled();
    });

    it('should call handleOpen on Ctrl+O', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('o', { ctrlKey: true });

      expect(mockHandleOpen).toHaveBeenCalledTimes(1);
    });

    it('should call handleNew on Ctrl+Alt+N', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('n', { ctrlKey: true, altKey: true });

      expect(mockHandleNew).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input element filtering', () => {
    it('should not trigger shortcuts when typing in input', () => {
      renderHook(() => useKeyboardShortcuts());

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);

      expect(undoSpy).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not trigger shortcuts when typing in textarea', () => {
      renderHook(() => useKeyboardShortcuts());

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      textarea.dispatchEvent(event);

      expect(mockHandleSave).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it.skip('should not trigger shortcuts in contentEditable elements', () => {
      // Note: contentEditable detection in jsdom has known issues
      renderHook(() => useKeyboardShortcuts());

      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);
      div.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      div.dispatchEvent(event);

      expect(redoSpy).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it('should trigger shortcuts when not in input elements', () => {
      renderHook(() => useKeyboardShortcuts());

      const div = document.createElement('div');
      document.body.appendChild(div);
      div.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      div.dispatchEvent(event);

      expect(undoSpy).toHaveBeenCalledTimes(1);

      document.body.removeChild(div);
    });
  });

  describe('Event cleanup', () => {
    it('should remove event listener on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts());

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Mac vs Windows', () => {
    it('should use metaKey on Mac', () => {
      // Mock Mac platform
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('z', { metaKey: true });

      expect(undoSpy).toHaveBeenCalledTimes(1);
    });

    it('should use ctrlKey on Windows', () => {
      // Mock Windows platform
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('z', { ctrlKey: true });

      expect(undoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should not trigger on key without modifier', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('z');

      expect(undoSpy).not.toHaveBeenCalled();
      expect(redoSpy).not.toHaveBeenCalled();
    });

    it('should not trigger on wrong key with modifier', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('a', { ctrlKey: true });

      expect(undoSpy).not.toHaveBeenCalled();
      expect(mockHandleSave).not.toHaveBeenCalled();
    });

    it('should handle multiple shortcuts in sequence', () => {
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('z', { ctrlKey: true });
      simulateKeyPress('y', { ctrlKey: true });
      simulateKeyPress('s', { ctrlKey: true });

      expect(undoSpy).toHaveBeenCalledTimes(1);
      expect(redoSpy).toHaveBeenCalledTimes(1);
      expect(mockHandleSave).toHaveBeenCalledTimes(1);
    });

    it('should prevent default for all shortcuts', () => {
      renderHook(() => useKeyboardShortcuts());

      const event = simulateKeyPress('s', { ctrlKey: true });

      // Check if preventDefault was called by checking defaultPrevented
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('View toggle shortcuts (Sprint 1.5.9)', () => {
    beforeEach(() => {
      // Reset chart store state
      useChartStore.setState({
        showDependencies: true,
        showTodayMarker: true,
        showProgress: true,
        showHolidays: true,
      });
    });

    it('should toggle dependencies on D key', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('d');

      expect(useChartStore.getState().showDependencies).toBe(false);
    });

    it('should toggle today marker on T key', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('t');

      expect(useChartStore.getState().showTodayMarker).toBe(false);
    });

    it('should toggle progress on P key', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('p');

      expect(useChartStore.getState().showProgress).toBe(false);
    });

    it('should toggle holidays on H key', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('h');

      expect(useChartStore.getState().showHolidays).toBe(false);
    });

    it('should not toggle when modifier keys are pressed', () => {
      renderHook(() => useKeyboardShortcuts());

      // With Ctrl
      simulateKeyPress('d', { ctrlKey: true });
      expect(useChartStore.getState().showDependencies).toBe(true);

      // With Alt
      simulateKeyPress('d', { altKey: true });
      expect(useChartStore.getState().showDependencies).toBe(true);

      // With Shift
      simulateKeyPress('d', { shiftKey: true });
      expect(useChartStore.getState().showDependencies).toBe(true);
    });

    it('should work with uppercase keys', () => {
      renderHook(() => useKeyboardShortcuts());
      simulateKeyPress('D');

      expect(useChartStore.getState().showDependencies).toBe(false);
    });
  });
});
