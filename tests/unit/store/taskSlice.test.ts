import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '../../../src/store/slices/taskSlice';
import type { Task } from '../../../src/types/chart.types';

describe('Task Store - CRUD Operations', () => {
  beforeEach(() => {
    // Reset store before each test
    useTaskStore.setState({ tasks: [], selectedTaskId: null });
  });

  describe('addTask', () => {
    it('should add a new task with generated UUID', () => {
      const { addTask, tasks } = useTaskStore.getState();

      const taskData: Omit<Task, 'id'> = {
        name: 'Test Task',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      };

      addTask(taskData);

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks).toHaveLength(1);
      expect(updatedTasks[0]).toMatchObject(taskData);
      expect(updatedTasks[0].id).toBeDefined();
      expect(typeof updatedTasks[0].id).toBe('string');
    });

    it('should add multiple tasks', () => {
      const { addTask } = useTaskStore.getState();

      addTask({
        name: 'Task 1',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      addTask({
        name: 'Task 2',
        startDate: '2025-12-26',
        endDate: '2025-12-31',
        duration: 5,
        progress: 50,
        color: '#ef4444',
        order: 1,
        metadata: {},
      });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(2);
      expect(tasks[0].name).toBe('Task 1');
      expect(tasks[1].name).toBe('Task 2');
    });

    it('should generate unique IDs for each task', () => {
      const { addTask } = useTaskStore.getState();

      addTask({
        name: 'Task 1',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      addTask({
        name: 'Task 2',
        startDate: '2025-12-26',
        endDate: '2025-12-31',
        duration: 5,
        progress: 0,
        color: '#ef4444',
        order: 1,
        metadata: {},
      });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks[0].id).not.toBe(tasks[1].id);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', () => {
      const { addTask, updateTask } = useTaskStore.getState();

      addTask({
        name: 'Original Task',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      const taskId = useTaskStore.getState().tasks[0].id;

      updateTask(taskId, { name: 'Updated Task', progress: 50 });

      const updatedTask = useTaskStore.getState().tasks[0];
      expect(updatedTask.name).toBe('Updated Task');
      expect(updatedTask.progress).toBe(50);
      expect(updatedTask.id).toBe(taskId);
    });

    it('should not modify other tasks', () => {
      const { addTask, updateTask } = useTaskStore.getState();

      addTask({
        name: 'Task 1',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      addTask({
        name: 'Task 2',
        startDate: '2025-12-26',
        endDate: '2025-12-31',
        duration: 5,
        progress: 0,
        color: '#ef4444',
        order: 1,
        metadata: {},
      });

      const task1Id = useTaskStore.getState().tasks[0].id;
      updateTask(task1Id, { name: 'Updated Task 1' });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks[0].name).toBe('Updated Task 1');
      expect(tasks[1].name).toBe('Task 2');
    });

    it('should handle non-existent task ID gracefully', () => {
      const { updateTask } = useTaskStore.getState();

      updateTask('non-existent-id', { name: 'Should not crash' });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(0);
    });

    it('should partially update task properties', () => {
      const { addTask, updateTask } = useTaskStore.getState();

      addTask({
        name: 'Task',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      updateTask(taskId, { progress: 75 });

      const task = useTaskStore.getState().tasks[0];
      expect(task.progress).toBe(75);
      expect(task.name).toBe('Task');
      expect(task.startDate).toBe('2025-12-18');
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task', () => {
      const { addTask, deleteTask } = useTaskStore.getState();

      addTask({
        name: 'Task to Delete',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      expect(useTaskStore.getState().tasks).toHaveLength(1);

      deleteTask(taskId);

      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });

    it('should delete only the specified task', () => {
      const { addTask, deleteTask } = useTaskStore.getState();

      addTask({
        name: 'Task 1',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      addTask({
        name: 'Task 2',
        startDate: '2025-12-26',
        endDate: '2025-12-31',
        duration: 5,
        progress: 0,
        color: '#ef4444',
        order: 1,
        metadata: {},
      });

      const task1Id = useTaskStore.getState().tasks[0].id;
      deleteTask(task1Id);

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe('Task 2');
    });

    it('should handle non-existent task ID gracefully', () => {
      const { deleteTask } = useTaskStore.getState();

      deleteTask('non-existent-id');

      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });
  });

  describe('selectTask', () => {
    it('should select a task', () => {
      const { addTask, selectTask } = useTaskStore.getState();

      addTask({
        name: 'Task 1',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      selectTask(taskId);

      expect(useTaskStore.getState().selectedTaskId).toBe(taskId);
    });

    it('should deselect by passing null', () => {
      const { addTask, selectTask } = useTaskStore.getState();

      addTask({
        name: 'Task 1',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      const taskId = useTaskStore.getState().tasks[0].id;
      selectTask(taskId);
      expect(useTaskStore.getState().selectedTaskId).toBe(taskId);

      selectTask(null);
      expect(useTaskStore.getState().selectedTaskId).toBeNull();
    });
  });

  describe('reorderTasks', () => {
    it('should reorder tasks correctly', () => {
      const { addTask, reorderTasks } = useTaskStore.getState();

      addTask({
        name: 'Task 1',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      addTask({
        name: 'Task 2',
        startDate: '2025-12-26',
        endDate: '2025-12-31',
        duration: 5,
        progress: 0,
        color: '#ef4444',
        order: 1,
        metadata: {},
      });

      addTask({
        name: 'Task 3',
        startDate: '2026-01-01',
        endDate: '2026-01-05',
        duration: 4,
        progress: 0,
        color: '#10b981',
        order: 2,
        metadata: {},
      });

      // Move first task to last position
      reorderTasks(0, 2);

      const tasks = useTaskStore.getState().tasks;
      expect(tasks[0].name).toBe('Task 2');
      expect(tasks[1].name).toBe('Task 3');
      expect(tasks[2].name).toBe('Task 1');
    });

    it('should update order property', () => {
      const { addTask, reorderTasks } = useTaskStore.getState();

      addTask({
        name: 'Task 1',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      addTask({
        name: 'Task 2',
        startDate: '2025-12-26',
        endDate: '2025-12-31',
        duration: 5,
        progress: 0,
        color: '#ef4444',
        order: 1,
        metadata: {},
      });

      reorderTasks(0, 1);

      const tasks = useTaskStore.getState().tasks;
      expect(tasks[0].order).toBe(0);
      expect(tasks[1].order).toBe(1);
    });

    it('should handle invalid indices gracefully', () => {
      const { addTask, reorderTasks } = useTaskStore.getState();

      addTask({
        name: 'Task 1',
        startDate: '2025-12-18',
        endDate: '2025-12-25',
        duration: 7,
        progress: 0,
        color: '#3b82f6',
        order: 0,
        metadata: {},
      });

      const originalTasks = [...useTaskStore.getState().tasks];

      // Invalid indices
      reorderTasks(-1, 0);
      reorderTasks(0, 5);
      reorderTasks(5, 0);

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toEqual(originalTasks);
    });
  });
});
