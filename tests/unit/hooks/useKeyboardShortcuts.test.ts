/**
 * Unit tests for useKeyboardShortcuts hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../../src/hooks/useKeyboardShortcuts';
import { useHistoryStore } from '../../../src/store/slices/historySlice';
import { useChartStore } from '../../../src/store/slices/chartSlice';
import { useTaskStore } from '../../../src/store/slices/taskSlice';
import type { Task } from '../../../src/types/chart.types';

// Mock the useFileOperations hook
const mockHandleSave = vi.fn();
const mockHandleSaveAs = vi.fn();
const mockHandleOpen = vi.fn();
const mockHandleNew = vi.fn();

vi.mock('../../../src/hooks/useFileOperations', () => ({
  useFileOperations: (): Record<string, unknown> => ({
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

  const simulateKeyPress = (key: string, options: Partial<KeyboardEventInit> = {}): KeyboardEvent => {
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

  describe('Ctrl++ / Ctrl+- row insert/delete shortcuts', () => {
    const makeTasks = (count: number): Task[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `task-${i + 1}`,
        name: `Task ${i + 1}`,
        startDate: '2025-01-10',
        endDate: '2025-01-17',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: i,
        type: 'task' as const,
        metadata: {},
      }));

    beforeEach(() => {
      useTaskStore.setState({
        tasks: makeTasks(3),
        selectedTaskIds: [],
        lastSelectedTaskId: null,
        activeCell: { taskId: null, field: null },
        isEditingCell: false,
      });
    });

    it('should insert one row above when single task is selected via Ctrl++', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-2'] });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('+', { ctrlKey: true });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(4);
      expect(tasks[1].name).toBe('New Task');
      expect(tasks[2].id).toBe('task-2');
    });

    it('should insert N rows when N tasks are selected via Ctrl++', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-1', 'task-2', 'task-3'] });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('=', { ctrlKey: true });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(6); // 3 original + 3 new
    });

    it('should use topmost selected task as reference for Ctrl++', () => {
      // Select tasks 2 and 3 — topmost is task-2 (index 1)
      useTaskStore.setState({ selectedTaskIds: ['task-3', 'task-2'] });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('+', { ctrlKey: true });

      const tasks = useTaskStore.getState().tasks;
      // 2 new tasks inserted above task-2 (at index 1)
      expect(tasks).toHaveLength(5);
      expect(tasks[0].id).toBe('task-1');
      expect(tasks[1].name).toBe('New Task');
      expect(tasks[2].name).toBe('New Task');
      expect(tasks[3].id).toBe('task-2');
    });

    it('should fallback to activeCell.taskId for Ctrl++ when no selection', () => {
      useTaskStore.setState({
        selectedTaskIds: [],
        activeCell: { taskId: 'task-2', field: 'name' },
      });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('+', { ctrlKey: true });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(4);
    });

    it('should do nothing for Ctrl++ when no task selected and no active cell', () => {
      useTaskStore.setState({
        selectedTaskIds: [],
        activeCell: { taskId: null, field: null },
      });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('+', { ctrlKey: true });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(3);
    });

    it('should not insert when editing a cell via Ctrl++', () => {
      useTaskStore.setState({
        selectedTaskIds: ['task-1'],
        isEditingCell: true,
      });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('+', { ctrlKey: true });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(3);
    });

    it('should delete selected tasks via Ctrl+-', () => {
      useTaskStore.setState({ selectedTaskIds: ['task-2'] });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('-', { ctrlKey: true });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(2);
      expect(tasks.find(t => t.id === 'task-2')).toBeUndefined();
    });

    it('should not delete when editing a cell via Ctrl+-', () => {
      useTaskStore.setState({
        selectedTaskIds: ['task-1'],
        isEditingCell: true,
      });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('-', { ctrlKey: true });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(3);
    });

    it('should not delete when no tasks are selected via Ctrl+-', () => {
      useTaskStore.setState({ selectedTaskIds: [] });
      renderHook(() => useKeyboardShortcuts());

      simulateKeyPress('-', { ctrlKey: true });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(3);
    });
  });
});
