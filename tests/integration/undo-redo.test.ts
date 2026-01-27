/**
 * Integration tests for Undo/Redo system
 * Tests the complete undo/redo flow across all command types
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '../../src/store/slices/taskSlice';
import { useHistoryStore } from '../../src/store/slices/historySlice';

describe('Undo/Redo Integration Tests', () => {
  beforeEach(() => {
    // Reset stores before each test
    useTaskStore.setState({
      tasks: [],
      selectedTaskIds: [],
      lastSelectedTaskId: null,
      activeCell: { taskId: null, field: null },
      isEditingCell: false,
      columnWidths: {},
      collapsedTasks: new Set(),
    });

    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      isUndoing: false,
      isRedoing: false,
    });
  });

  describe('Task Creation', () => {
    it('should undo task creation', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Create a task
      taskStore.addTask({
        name: 'Test Task',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      // Verify task was created
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].name).toBe('Test Task');
      expect(historyStore.canUndo()).toBe(true);

      // Undo
      historyStore.undo();

      // Verify task was removed
      expect(useTaskStore.getState().tasks).toHaveLength(0);
      expect(useHistoryStore.getState().canRedo()).toBe(true);
    });

    it('should redo task creation after undo', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Create task
      taskStore.addTask({
        name: 'Test Task',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      // Undo
      historyStore.undo();
      expect(useTaskStore.getState().tasks).toHaveLength(0);

      // Redo
      historyStore.redo();

      // Verify task was recreated
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].name).toBe('Test Task');
    });
  });

  describe('Task Updates', () => {
    let taskId: string;

    beforeEach(() => {
      const taskStore = useTaskStore.getState();
      taskStore.addTask({
        name: 'Original Name',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        type: 'task',
        parent: undefined,
        metadata: {},
      });
      taskId = useTaskStore.getState().tasks[0].id;
      // Clear the undo stack from task creation
      useHistoryStore.setState({ undoStack: [], redoStack: [] });
    });

    it('should undo task name update', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Update task name
      taskStore.updateTask(taskId, { name: 'Updated Name' });

      // Verify update
      expect(useTaskStore.getState().tasks[0].name).toBe('Updated Name');

      // Undo
      historyStore.undo();

      // Verify undo
      expect(useTaskStore.getState().tasks[0].name).toBe('Original Name');
    });

    it('should undo color change', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Update color
      taskStore.updateTask(taskId, { color: '#ff0000' });

      // Verify update
      expect(useTaskStore.getState().tasks[0].color).toBe('#ff0000');

      // Undo
      historyStore.undo();

      // Verify undo
      expect(useTaskStore.getState().tasks[0].color).toBe('#3b82f6');
    });

    it('should undo and redo multiple field updates', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Update multiple fields
      taskStore.updateTask(taskId, {
        name: 'New Name',
        progress: 50,
        color: '#00ff00'
      });

      // Verify update
      const task = useTaskStore.getState().tasks[0];
      expect(task.name).toBe('New Name');
      expect(task.progress).toBe(50);
      expect(task.color).toBe('#00ff00');

      // Undo
      historyStore.undo();

      // Verify undo
      const undoneTask = useTaskStore.getState().tasks[0];
      expect(undoneTask.name).toBe('Original Name');
      expect(undoneTask.progress).toBe(0);
      expect(undoneTask.color).toBe('#3b82f6');

      // Redo
      historyStore.redo();

      // Verify redo
      const redoneTask = useTaskStore.getState().tasks[0];
      expect(redoneTask.name).toBe('New Name');
      expect(redoneTask.progress).toBe(50);
      expect(redoneTask.color).toBe('#00ff00');
    });
  });

  describe('Task Deletion', () => {
    let taskId: string;

    beforeEach(() => {
      const taskStore = useTaskStore.getState();
      taskStore.addTask({
        name: 'Task to Delete',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        type: 'task',
        parent: undefined,
        metadata: {},
      });
      taskId = useTaskStore.getState().tasks[0].id;
      // Clear undo stack from creation
      useHistoryStore.setState({ undoStack: [], redoStack: [] });
    });

    it('should undo simple task deletion', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Delete task
      taskStore.deleteTask(taskId, false);

      // Verify deletion
      expect(useTaskStore.getState().tasks).toHaveLength(0);

      // Undo
      historyStore.undo();

      // Verify task is restored
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].name).toBe('Task to Delete');
      expect(useTaskStore.getState().tasks[0].id).toBe(taskId);
    });

    it('should redo task deletion after undo', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Delete task
      taskStore.deleteTask(taskId, false);

      // Undo deletion
      historyStore.undo();
      expect(useTaskStore.getState().tasks).toHaveLength(1);

      // Redo deletion
      historyStore.redo();
      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });

    it('should undo cascade deletion of parent and children', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Add child tasks
      const parentId = taskId;

      taskStore.addTask({
        name: 'Child Task 1',
        startDate: '2025-01-01',
        endDate: '2025-01-05',
        duration: 5,
        progress: 0,
        color: '#3b82f6',
        order: 1,
        type: 'task',
        parent: parentId,
        metadata: {},
      });

      taskStore.addTask({
        name: 'Child Task 2',
        startDate: '2025-01-06',
        endDate: '2025-01-10',
        duration: 5,
        progress: 0,
        color: '#3b82f6',
        order: 2,
        type: 'task',
        parent: parentId,
        metadata: {},
      });

      expect(useTaskStore.getState().tasks).toHaveLength(3);

      // Clear undo stack from child creations
      useHistoryStore.setState({ undoStack: [], redoStack: [] });

      // Delete parent with cascade
      taskStore.deleteTask(parentId, true);

      // Verify all tasks deleted
      expect(useTaskStore.getState().tasks).toHaveLength(0);

      // Undo
      historyStore.undo();

      // Verify all tasks restored
      expect(useTaskStore.getState().tasks).toHaveLength(3);
      const tasks = useTaskStore.getState().tasks;
      expect(tasks.find(t => t.name === 'Task to Delete')).toBeDefined();
      expect(tasks.find(t => t.name === 'Child Task 1')).toBeDefined();
      expect(tasks.find(t => t.name === 'Child Task 2')).toBeDefined();
    });

    it('should not duplicate tasks during undo/redo cycles of multi-task deletion (GitHub #4)', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Clear any existing tasks and history
      useTaskStore.setState({ tasks: [], selectedTaskIds: [] });
      useHistoryStore.setState({ undoStack: [], redoStack: [] });

      // Create 3 independent tasks
      taskStore.addTask({
        name: 'Task A',
        startDate: '2025-01-01',
        endDate: '2025-01-05',
        duration: 5,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      taskStore.addTask({
        name: 'Task B',
        startDate: '2025-01-06',
        endDate: '2025-01-10',
        duration: 5,
        progress: 0,
        color: '#3b82f6',
        order: 1,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      taskStore.addTask({
        name: 'Task C',
        startDate: '2025-01-11',
        endDate: '2025-01-15',
        duration: 5,
        progress: 0,
        color: '#3b82f6',
        order: 2,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      expect(useTaskStore.getState().tasks).toHaveLength(3);

      // Get task IDs for selection
      const tasks = useTaskStore.getState().tasks;
      const taskAId = tasks.find(t => t.name === 'Task A')!.id;
      const taskBId = tasks.find(t => t.name === 'Task B')!.id;

      // Clear history from task creation
      useHistoryStore.setState({ undoStack: [], redoStack: [] });

      // Select Task A and Task B (not C)
      useTaskStore.setState({ selectedTaskIds: [taskAId, taskBId] });

      // Delete selected tasks (A and B)
      taskStore.deleteSelectedTasks();

      // Verify only Task C remains
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].name).toBe('Task C');

      // Undo - both tasks should return
      historyStore.undo();
      expect(useTaskStore.getState().tasks).toHaveLength(3);

      // Redo - both tasks should be deleted again (not just one!)
      historyStore.redo();
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].name).toBe('Task C');

      // Undo again - should still have exactly 3 tasks (no duplicates!)
      historyStore.undo();
      expect(useTaskStore.getState().tasks).toHaveLength(3);

      // Redo again - should still have exactly 1 task
      historyStore.redo();
      expect(useTaskStore.getState().tasks).toHaveLength(1);

      // One more cycle to verify no exponential duplication
      historyStore.undo();
      expect(useTaskStore.getState().tasks).toHaveLength(3);
      historyStore.redo();
      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });
  });

  describe('Task Reordering', () => {
    beforeEach(() => {
      const taskStore = useTaskStore.getState();

      // Create 5 tasks
      for (let i = 0; i < 5; i++) {
        taskStore.addTask({
          name: `Task ${i}`,
          startDate: '2025-01-01',
          endDate: '2025-01-10',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: i,
          type: 'task',
          parent: undefined,
          metadata: {},
        });
      }

      // Clear undo stack from creations
      useHistoryStore.setState({ undoStack: [], redoStack: [] });
    });

    it('should undo task reordering', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Get original order
      const originalOrder = useTaskStore.getState().tasks.map(t => t.name);
      expect(originalOrder).toEqual(['Task 0', 'Task 1', 'Task 2', 'Task 3', 'Task 4']);

      // Reorder: move task from index 1 to index 3
      taskStore.reorderTasks(1, 3);

      // Verify reorder
      const reorderedTasks = useTaskStore.getState().tasks.map(t => t.name);
      expect(reorderedTasks).toEqual(['Task 0', 'Task 2', 'Task 3', 'Task 1', 'Task 4']);

      // Undo
      historyStore.undo();

      // Verify original order restored
      const restoredTasks = useTaskStore.getState().tasks.map(t => t.name);
      expect(restoredTasks).toEqual(['Task 0', 'Task 1', 'Task 2', 'Task 3', 'Task 4']);
    });

    it('should redo task reordering after undo', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Reorder
      taskStore.reorderTasks(0, 4);

      // Undo
      historyStore.undo();

      // Redo
      historyStore.redo();

      // Verify reordered state
      const tasks = useTaskStore.getState().tasks.map(t => t.name);
      expect(tasks).toEqual(['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 0']);
    });
  });

  describe('Undo/Redo Stack Management', () => {
    it('should clear redo stack when new action is performed after undo', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Create 3 tasks
      taskStore.addTask({
        name: 'Task 1',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      taskStore.addTask({
        name: 'Task 2',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 1,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      taskStore.addTask({
        name: 'Task 3',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 2,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      // Undo twice
      historyStore.undo();
      historyStore.undo();

      // Verify we can redo
      expect(historyStore.canRedo()).toBe(true);

      // Perform new action
      taskStore.addTask({
        name: 'Task 4',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 3,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      // Verify redo stack is cleared
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });

    it('should respect maximum stack size', () => {
      const taskStore = useTaskStore.getState();

      // Get max stack size
      const maxSize = useHistoryStore.getState().maxStackSize;

      // Create more tasks than max stack size
      for (let i = 0; i < maxSize + 10; i++) {
        taskStore.addTask({
          name: `Task ${i}`,
          startDate: '2025-01-01',
          endDate: '2025-01-10',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: i,
          type: 'task',
          parent: undefined,
          metadata: {},
        });
      }

      // Verify stack doesn't exceed max size
      expect(useHistoryStore.getState().undoStack.length).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('Sequential Operations', () => {
    it('should handle 100 sequential undos without lag', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Create 100 tasks
      for (let i = 0; i < 100; i++) {
        taskStore.addTask({
          name: `Task ${i}`,
          startDate: '2025-01-01',
          endDate: '2025-01-10',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: i,
          type: 'task',
          parent: undefined,
          metadata: {},
        });
      }

      // Undo all 100 tasks
      const undoStartTime = performance.now();
      for (let i = 0; i < 100; i++) {
        historyStore.undo();
      }
      const undoEndTime = performance.now();

      // Verify performance (should be under 1 second for 100 undos)
      const undoTime = undoEndTime - undoStartTime;
      expect(undoTime).toBeLessThan(1000);

      // Verify all tasks were undone
      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });

    it('should handle complex sequence: create → update → delete → undo all', () => {
      const taskStore = useTaskStore.getState();
      const historyStore = useHistoryStore.getState();

      // Create task
      taskStore.addTask({
        name: 'Original Task',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      const taskId = useTaskStore.getState().tasks[0].id;

      // Update task
      taskStore.updateTask(taskId, { name: 'Updated Task', progress: 50 });

      // Delete task
      taskStore.deleteTask(taskId, false);

      expect(useTaskStore.getState().tasks).toHaveLength(0);

      // Undo delete
      historyStore.undo();
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      expect(useTaskStore.getState().tasks[0].name).toBe('Updated Task');
      expect(useTaskStore.getState().tasks[0].progress).toBe(50);

      // Undo update
      historyStore.undo();
      expect(useTaskStore.getState().tasks[0].name).toBe('Original Task');
      expect(useTaskStore.getState().tasks[0].progress).toBe(0);

      // Undo creation
      historyStore.undo();
      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undo when stack is empty', () => {
      const historyStore = useHistoryStore.getState();

      // Verify no undo available
      expect(historyStore.canUndo()).toBe(false);

      // Attempt undo (should not throw)
      expect(() => historyStore.undo()).not.toThrow();

      // Verify state unchanged
      expect(useHistoryStore.getState().canUndo()).toBe(false);
    });

    it('should handle redo when stack is empty', () => {
      const historyStore = useHistoryStore.getState();

      // Verify no redo available
      expect(historyStore.canRedo()).toBe(false);

      // Attempt redo (should not throw)
      expect(() => historyStore.redo()).not.toThrow();

      // Verify state unchanged
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });

    it('should not record commands while undoing', () => {
      const taskStore = useTaskStore.getState();

      // Create task
      taskStore.addTask({
        name: 'Test Task',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      expect(useHistoryStore.getState().undoStack).toHaveLength(1);

      // Undo
      useHistoryStore.getState().undo();

      // Verify no additional command was recorded during undo
      expect(useHistoryStore.getState().undoStack).toHaveLength(0);
      expect(useHistoryStore.getState().redoStack).toHaveLength(1);
    });

    it('should not record commands while redoing', () => {
      const taskStore = useTaskStore.getState();

      // Create task
      taskStore.addTask({
        name: 'Test Task',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        duration: 10,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        type: 'task',
        parent: undefined,
        metadata: {},
      });

      // Undo
      useHistoryStore.getState().undo();

      // Redo
      useHistoryStore.getState().redo();

      // Verify no additional command was recorded during redo
      expect(useHistoryStore.getState().undoStack).toHaveLength(1);
      expect(useHistoryStore.getState().redoStack).toHaveLength(0);
    });
  });
});
