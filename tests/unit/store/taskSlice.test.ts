import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskStore } from '../../../src/store/slices/taskSlice';
import { useHistoryStore } from '../../../src/store/slices/historySlice';
import type { Task } from '../../../src/types/chart.types';

describe('Task Store - CRUD Operations', () => {
  beforeEach(() => {
    // Reset stores before each test
    useTaskStore.setState({
      tasks: [],
      selectedTaskIds: [],
      lastSelectedTaskId: null,
      activeCell: { taskId: null, field: null },
      isEditingCell: false,
      columnWidths: {},
      taskTableWidth: null,
    });
    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      isUndoing: false,
      isRedoing: false,
    });
  });

  describe('addTask', () => {
    it('should add a new task with generated UUID', () => {
      const { addTask } = useTaskStore.getState();

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

  describe('setTasks', () => {
    it('should replace all tasks', () => {
      const { addTask, setTasks } = useTaskStore.getState();

      // Add some initial tasks
      addTask({
        name: 'Old Task',
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

      const newTasks: Task[] = [
        {
          id: 'task-1',
          name: 'New Task 1',
          startDate: '2025-02-01',
          endDate: '2025-02-10',
          duration: 10,
          progress: 50,
          color: '#ef4444',
          order: 0,
          type: 'task',
          parent: undefined,
          metadata: {},
        },
        {
          id: 'task-2',
          name: 'New Task 2',
          startDate: '2025-02-11',
          endDate: '2025-02-20',
          duration: 10,
          progress: 25,
          color: '#10b981',
          order: 1,
          type: 'task',
          parent: undefined,
          metadata: {},
        },
      ];

      setTasks(newTasks);

      const tasks = useTaskStore.getState().tasks;
      expect(tasks).toHaveLength(2);
      expect(tasks[0].name).toBe('New Task 1');
      expect(tasks[1].name).toBe('New Task 2');
    });

    it('should reset selection state', () => {
      const { setTasks, toggleTaskSelection } = useTaskStore.getState();

      // Set up selection
      useTaskStore.setState({
        tasks: [
          {
            id: 'task-1',
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
          },
        ],
      });
      toggleTaskSelection('task-1');

      expect(useTaskStore.getState().selectedTaskIds).toContain('task-1');

      setTasks([]);

      const state = useTaskStore.getState();
      expect(state.selectedTaskIds).toEqual([]);
      expect(state.lastSelectedTaskId).toBeNull();
      expect(state.activeCell.taskId).toBeNull();
      expect(state.activeCell.field).toBeNull();
      expect(state.isEditingCell).toBe(false);
    });
  });

  describe('Multi-selection', () => {
    const setupTasks = () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
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
        },
        {
          id: 'task-2',
          name: 'Task 2',
          startDate: '2025-01-11',
          endDate: '2025-01-20',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          parent: undefined,
          metadata: {},
        },
        {
          id: 'task-3',
          name: 'Task 3',
          startDate: '2025-01-21',
          endDate: '2025-01-30',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 2,
          type: 'task',
          parent: undefined,
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });
      return tasks;
    };

    describe('toggleTaskSelection', () => {
      it('should select unselected task', () => {
        setupTasks();
        const { toggleTaskSelection } = useTaskStore.getState();

        toggleTaskSelection('task-1');

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).toContain('task-1');
        expect(state.lastSelectedTaskId).toBe('task-1');
      });

      it('should deselect selected task', () => {
        setupTasks();
        const { toggleTaskSelection } = useTaskStore.getState();

        toggleTaskSelection('task-1');
        toggleTaskSelection('task-1');

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).not.toContain('task-1');
        expect(state.lastSelectedTaskId).toBe('task-1');
      });

      it('should toggle multiple tasks', () => {
        setupTasks();
        const { toggleTaskSelection } = useTaskStore.getState();

        toggleTaskSelection('task-1');
        toggleTaskSelection('task-2');

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).toContain('task-1');
        expect(state.selectedTaskIds).toContain('task-2');
        expect(state.selectedTaskIds).toHaveLength(2);
      });
    });

    describe('selectTaskRange', () => {
      it('should select range from start to end', () => {
        setupTasks();
        const { selectTaskRange } = useTaskStore.getState();

        selectTaskRange('task-1', 'task-3');

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).toContain('task-1');
        expect(state.selectedTaskIds).toContain('task-2');
        expect(state.selectedTaskIds).toContain('task-3');
        expect(state.lastSelectedTaskId).toBe('task-3');
      });

      it('should select range in reverse order', () => {
        setupTasks();
        const { selectTaskRange } = useTaskStore.getState();

        selectTaskRange('task-3', 'task-1');

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).toContain('task-1');
        expect(state.selectedTaskIds).toContain('task-2');
        expect(state.selectedTaskIds).toContain('task-3');
        expect(state.lastSelectedTaskId).toBe('task-1');
      });

      it('should handle invalid task IDs', () => {
        setupTasks();
        const { selectTaskRange } = useTaskStore.getState();

        selectTaskRange('invalid-id', 'task-2');

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).toHaveLength(0);
      });

      it('should merge with existing selection', () => {
        setupTasks();
        const { toggleTaskSelection, selectTaskRange } = useTaskStore.getState();

        toggleTaskSelection('task-1');
        selectTaskRange('task-2', 'task-3');

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).toContain('task-1');
        expect(state.selectedTaskIds).toContain('task-2');
        expect(state.selectedTaskIds).toContain('task-3');
      });
    });

    describe('selectAllTasks', () => {
      it('should select all tasks', () => {
        setupTasks();
        const { selectAllTasks } = useTaskStore.getState();

        selectAllTasks();

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).toHaveLength(3);
        expect(state.selectedTaskIds).toContain('task-1');
        expect(state.selectedTaskIds).toContain('task-2');
        expect(state.selectedTaskIds).toContain('task-3');
      });

      it('should work with empty task list', () => {
        const { selectAllTasks } = useTaskStore.getState();

        selectAllTasks();

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).toHaveLength(0);
      });
    });

    describe('clearSelection', () => {
      it('should clear all selections', () => {
        setupTasks();
        const { toggleTaskSelection, clearSelection } = useTaskStore.getState();

        toggleTaskSelection('task-1');
        toggleTaskSelection('task-2');

        clearSelection();

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).toHaveLength(0);
        expect(state.lastSelectedTaskId).toBeNull();
      });
    });
  });

  describe('Cell Navigation', () => {
    describe('setActiveCell', () => {
      it('should set active cell', () => {
        const { setActiveCell } = useTaskStore.getState();

        setActiveCell('task-1', 'name');

        const state = useTaskStore.getState();
        expect(state.activeCell.taskId).toBe('task-1');
        expect(state.activeCell.field).toBe('name');
        expect(state.isEditingCell).toBe(false);
      });

      it('should clear active cell', () => {
        const { setActiveCell } = useTaskStore.getState();

        setActiveCell('task-1', 'name');
        setActiveCell(null, null);

        const state = useTaskStore.getState();
        expect(state.activeCell.taskId).toBeNull();
        expect(state.activeCell.field).toBeNull();
      });
    });

    describe('navigateCell', () => {
      beforeEach(() => {
        const tasks: Task[] = [
          {
            id: 'task-1',
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
          },
          {
            id: 'task-2',
            name: 'Task 2',
            startDate: '2025-01-11',
            endDate: '2025-01-20',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: undefined,
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });
      });

      it('should navigate down', () => {
        const { setActiveCell, navigateCell } = useTaskStore.getState();

        setActiveCell('task-1', 'name');
        navigateCell('down');

        const state = useTaskStore.getState();
        expect(state.activeCell.taskId).toBe('task-2');
        expect(state.activeCell.field).toBe('name');
      });

      it('should navigate up', () => {
        const { setActiveCell, navigateCell } = useTaskStore.getState();

        setActiveCell('task-2', 'name');
        navigateCell('up');

        const state = useTaskStore.getState();
        expect(state.activeCell.taskId).toBe('task-1');
        expect(state.activeCell.field).toBe('name');
      });

      it('should navigate right', () => {
        const { setActiveCell, navigateCell } = useTaskStore.getState();

        setActiveCell('task-1', 'name');
        navigateCell('right');

        const state = useTaskStore.getState();
        expect(state.activeCell.taskId).toBe('task-1');
        expect(state.activeCell.field).toBe('type');
      });

      it('should navigate left', () => {
        const { setActiveCell, navigateCell } = useTaskStore.getState();

        setActiveCell('task-1', 'type');
        navigateCell('left');

        const state = useTaskStore.getState();
        expect(state.activeCell.taskId).toBe('task-1');
        expect(state.activeCell.field).toBe('name');
      });

      it('should not navigate beyond boundaries', () => {
        const { setActiveCell, navigateCell } = useTaskStore.getState();

        setActiveCell('task-1', 'name');
        navigateCell('up'); // Already at top
        navigateCell('left'); // Already at leftmost

        const state = useTaskStore.getState();
        expect(state.activeCell.taskId).toBe('task-1');
        expect(state.activeCell.field).toBe('name');
      });
    });

    describe('startCellEdit / stopCellEdit', () => {
      it('should start cell editing', () => {
        const { startCellEdit } = useTaskStore.getState();

        startCellEdit();

        expect(useTaskStore.getState().isEditingCell).toBe(true);
      });

      it('should stop cell editing', () => {
        const { startCellEdit, stopCellEdit } = useTaskStore.getState();

        startCellEdit();
        stopCellEdit();

        expect(useTaskStore.getState().isEditingCell).toBe(false);
      });
    });

    describe('setColumnWidth', () => {
      it('should set column width', () => {
        const { setColumnWidth } = useTaskStore.getState();

        setColumnWidth('name', 200);

        expect(useTaskStore.getState().columnWidths['name']).toBe(200);
      });

      it('should update existing column width', () => {
        const { setColumnWidth } = useTaskStore.getState();

        setColumnWidth('name', 200);
        setColumnWidth('name', 300);

        expect(useTaskStore.getState().columnWidths['name']).toBe(300);
      });
    });
  });

  describe('Split Pane', () => {
    describe('setTaskTableWidth', () => {
      it('should set task table width', () => {
        const { setTaskTableWidth } = useTaskStore.getState();

        setTaskTableWidth(500);

        expect(useTaskStore.getState().taskTableWidth).toBe(500);
      });

      it('should set to null for auto width', () => {
        const { setTaskTableWidth } = useTaskStore.getState();

        setTaskTableWidth(500);
        setTaskTableWidth(null);

        expect(useTaskStore.getState().taskTableWidth).toBeNull();
      });
    });
  });

  describe('Hierarchy Actions', () => {
    describe('toggleTaskCollapsed / expandTask / collapseTask', () => {
      beforeEach(() => {
        const tasks: Task[] = [
          {
            id: 'parent',
            name: 'Parent',
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            duration: 31,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'summary',
            open: true,
            parent: undefined,
            metadata: {},
          },
          {
            id: 'child',
            name: 'Child',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: 'parent',
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });
      });

      it('should toggle task from open to closed', () => {
        const { toggleTaskCollapsed } = useTaskStore.getState();

        toggleTaskCollapsed('parent');

        const parent = useTaskStore.getState().tasks.find((t) => t.id === 'parent');
        expect(parent?.open).toBe(false);
      });

      it('should toggle task from closed to open', () => {
        const { toggleTaskCollapsed } = useTaskStore.getState();

        toggleTaskCollapsed('parent');
        toggleTaskCollapsed('parent');

        const parent = useTaskStore.getState().tasks.find((t) => t.id === 'parent');
        expect(parent?.open).toBe(true);
      });

      it('should expand task', () => {
        const { collapseTask, expandTask } = useTaskStore.getState();

        collapseTask('parent');
        expandTask('parent');

        const parent = useTaskStore.getState().tasks.find((t) => t.id === 'parent');
        expect(parent?.open).toBe(true);
      });

      it('should collapse task', () => {
        const { collapseTask } = useTaskStore.getState();

        collapseTask('parent');

        const parent = useTaskStore.getState().tasks.find((t) => t.id === 'parent');
        expect(parent?.open).toBe(false);
      });

      it('should not toggle task without children', () => {
        const { toggleTaskCollapsed } = useTaskStore.getState();

        const childBefore = useTaskStore.getState().tasks.find((t) => t.id === 'child');
        toggleTaskCollapsed('child');
        const childAfter = useTaskStore.getState().tasks.find((t) => t.id === 'child');

        expect(childAfter?.open).toBe(childBefore?.open);
      });
    });

    describe('expandAll / collapseAll', () => {
      beforeEach(() => {
        const tasks: Task[] = [
          {
            id: 'parent1',
            name: 'Parent 1',
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            duration: 31,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'summary',
            open: true,
            parent: undefined,
            metadata: {},
          },
          {
            id: 'child1',
            name: 'Child 1',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: 'parent1',
            metadata: {},
          },
          {
            id: 'parent2',
            name: 'Parent 2',
            startDate: '2025-02-01',
            endDate: '2025-02-28',
            duration: 28,
            progress: 0,
            color: '#3b82f6',
            order: 2,
            type: 'summary',
            open: false,
            parent: undefined,
            metadata: {},
          },
          {
            id: 'child2',
            name: 'Child 2',
            startDate: '2025-02-01',
            endDate: '2025-02-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 3,
            type: 'task',
            parent: 'parent2',
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });
      });

      it('should expand all tasks with children', () => {
        const { expandAll } = useTaskStore.getState();

        expandAll();

        const tasks = useTaskStore.getState().tasks;
        const parent1 = tasks.find((t) => t.id === 'parent1');
        const parent2 = tasks.find((t) => t.id === 'parent2');

        expect(parent1?.open).toBe(true);
        expect(parent2?.open).toBe(true);
      });

      it('should collapse all tasks with children', () => {
        const { collapseAll } = useTaskStore.getState();

        collapseAll();

        const tasks = useTaskStore.getState().tasks;
        const parent1 = tasks.find((t) => t.id === 'parent1');
        const parent2 = tasks.find((t) => t.id === 'parent2');

        expect(parent1?.open).toBe(false);
        expect(parent2?.open).toBe(false);
      });
    });

    describe('moveTaskToParent', () => {
      beforeEach(() => {
        const tasks: Task[] = [
          {
            id: 'task-1',
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
          },
          {
            id: 'task-2',
            name: 'Task 2',
            startDate: '2025-01-11',
            endDate: '2025-01-20',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'summary',
            parent: undefined,
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });
      });

      it('should move task to new parent', () => {
        const { moveTaskToParent } = useTaskStore.getState();
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        moveTaskToParent('task-1', 'task-2');

        const task = useTaskStore.getState().tasks.find((t) => t.id === 'task-1');
        expect(task?.parent).toBe('task-2');

        consoleErrorSpy.mockRestore();
      });

      it('should move task to root level', () => {
        const { moveTaskToParent } = useTaskStore.getState();

        // First make it a child
        moveTaskToParent('task-1', 'task-2');

        // Then move to root
        moveTaskToParent('task-1', null);

        const task = useTaskStore.getState().tasks.find((t) => t.id === 'task-1');
        expect(task?.parent).toBeUndefined();
      });

      it('should prevent circular hierarchy', () => {
        const { moveTaskToParent } = useTaskStore.getState();
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Make task-1 parent of task-2
        moveTaskToParent('task-2', 'task-1');

        // Try to make task-2 parent of task-1 (would create circular)
        moveTaskToParent('task-1', 'task-2');

        const task = useTaskStore.getState().tasks.find((t) => t.id === 'task-1');
        expect(task?.parent).toBeUndefined(); // Should not change

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('circular hierarchy')
        );

        consoleErrorSpy.mockRestore();
      });

      it('should prevent milestones as parents', () => {
        const tasks: Task[] = [
          {
            id: 'milestone',
            name: 'Milestone',
            startDate: '2025-01-01',
            endDate: '',
            duration: 0,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'milestone',
            parent: undefined,
            metadata: {},
          },
          {
            id: 'task',
            name: 'Task',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: undefined,
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { moveTaskToParent } = useTaskStore.getState();
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        moveTaskToParent('task', 'milestone');

        const task = useTaskStore.getState().tasks.find((t) => t.id === 'task');
        expect(task?.parent).toBeUndefined();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('milestones cannot be parents')
        );

        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('Summary Task Operations', () => {
    describe('createSummaryTask', () => {
      it('should create summary task with generated ID', () => {
        const { createSummaryTask } = useTaskStore.getState();

        const newId = createSummaryTask({
          name: 'Summary Task',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          duration: 31,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          parent: undefined,
          metadata: {},
        });

        const tasks = useTaskStore.getState().tasks;
        expect(tasks).toHaveLength(1);
        expect(tasks[0].type).toBe('summary');
        expect(tasks[0].open).toBe(true);
        expect(tasks[0].id).toBe(newId);
      });
    });

    describe('convertToSummary', () => {
      it('should convert task to summary without children', () => {
        const tasks: Task[] = [
          {
            id: 'task-1',
            name: 'Task 1',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 50,
            color: '#3b82f6',
            order: 0,
            type: 'task',
            parent: undefined,
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { convertToSummary } = useTaskStore.getState();

        convertToSummary('task-1');

        const task = useTaskStore.getState().tasks.find((t) => t.id === 'task-1');
        expect(task?.type).toBe('summary');
        expect(task?.open).toBe(true);
        expect(task?.startDate).toBe('');
        expect(task?.endDate).toBe('');
        expect(task?.duration).toBe(0);
      });

      it('should convert task to summary with children and recalculate dates', () => {
        const tasks: Task[] = [
          {
            id: 'parent',
            name: 'Parent',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'task',
            parent: undefined,
            metadata: {},
          },
          {
            id: 'child',
            name: 'Child',
            startDate: '2025-01-05',
            endDate: '2025-01-15',
            duration: 11,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: 'parent',
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { convertToSummary } = useTaskStore.getState();

        convertToSummary('parent');

        const parent = useTaskStore.getState().tasks.find((t) => t.id === 'parent');
        expect(parent?.type).toBe('summary');
        expect(parent?.startDate).toBe('2025-01-05');
        expect(parent?.endDate).toBe('2025-01-15');
      });
    });

    describe('convertToTask', () => {
      it('should convert summary to task', () => {
        const tasks: Task[] = [
          {
            id: 'summary-1',
            name: 'Summary 1',
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            duration: 31,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'summary',
            open: true,
            parent: undefined,
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { convertToTask } = useTaskStore.getState();
        const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

        convertToTask('summary-1');

        const task = useTaskStore.getState().tasks.find((t) => t.id === 'summary-1');
        expect(task?.type).toBe('task');
        expect(task?.open).toBeUndefined();

        expect(consoleInfoSpy).toHaveBeenCalled();
        consoleInfoSpy.mockRestore();
      });

      it('should keep open state if has children', () => {
        const tasks: Task[] = [
          {
            id: 'parent',
            name: 'Parent',
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            duration: 31,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'summary',
            open: false,
            parent: undefined,
            metadata: {},
          },
          {
            id: 'child',
            name: 'Child',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: 'parent',
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { convertToTask } = useTaskStore.getState();
        const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

        convertToTask('parent');

        const parent = useTaskStore.getState().tasks.find((t) => t.id === 'parent');
        expect(parent?.type).toBe('task');
        expect(parent?.open).toBe(false); // Kept because has children

        consoleInfoSpy.mockRestore();
      });
    });
  });

  describe('Indent/Outdent Operations', () => {
    describe('canIndentSelection / canOutdentSelection', () => {
      beforeEach(() => {
        const tasks: Task[] = [
          {
            id: 'task-1',
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
          },
          {
            id: 'task-2',
            name: 'Task 2',
            startDate: '2025-01-11',
            endDate: '2025-01-20',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: undefined,
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });
      });

      it('should return true when can indent', () => {
        const { toggleTaskSelection, canIndentSelection } = useTaskStore.getState();

        toggleTaskSelection('task-2'); // Select second task

        expect(canIndentSelection()).toBe(true);
      });

      it('should return false when cannot indent (no previous sibling)', () => {
        const { toggleTaskSelection, canIndentSelection } = useTaskStore.getState();

        toggleTaskSelection('task-1'); // Select first task

        expect(canIndentSelection()).toBe(false);
      });

      it('should return false when no selection', () => {
        const { canIndentSelection } = useTaskStore.getState();

        expect(canIndentSelection()).toBe(false);
      });

      it('should return true when can outdent', () => {
        const { moveTaskToParent, toggleTaskSelection, canOutdentSelection } =
          useTaskStore.getState();

        // Make task-2 a child of task-1
        moveTaskToParent('task-2', 'task-1');
        toggleTaskSelection('task-2');

        expect(canOutdentSelection()).toBe(true);
      });

      it('should return false when cannot outdent (root level)', () => {
        const { toggleTaskSelection, canOutdentSelection } = useTaskStore.getState();

        toggleTaskSelection('task-1'); // Root level task

        expect(canOutdentSelection()).toBe(false);
      });
    });
  });

  describe('Type Conversion Edge Cases', () => {
    describe('updateTask - milestone conversion', () => {
      it('should prevent milestone conversion when task has children', () => {
        const tasks: Task[] = [
          {
            id: 'parent',
            name: 'Parent',
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            duration: 31,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'task',
            parent: undefined,
            metadata: {},
          },
          {
            id: 'child',
            name: 'Child',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: 'parent',
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { updateTask } = useTaskStore.getState();
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        updateTask('parent', { type: 'milestone' });

        const parent = useTaskStore.getState().tasks.find((t) => t.id === 'parent');
        expect(parent?.type).toBe('task'); // Should not change

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Cannot convert to milestone')
        );

        consoleWarnSpy.mockRestore();
      });

      it('should set endDate equal to startDate when converting to milestone', () => {
        const tasks: Task[] = [
          {
            id: 'task-1',
            name: 'Task 1',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 50,
            color: '#3b82f6',
            order: 0,
            type: 'task',
            parent: undefined,
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { updateTask } = useTaskStore.getState();

        updateTask('task-1', { type: 'milestone' });

        const task = useTaskStore.getState().tasks.find((t) => t.id === 'task-1');
        expect(task?.type).toBe('milestone');
        expect(task?.endDate).toBe('2025-01-01');
        expect(task?.duration).toBe(0);
        expect(task?.progress).toBe(0);
      });
    });

    describe('updateTask - date preservation during type switching', () => {
      it('should preserve dates when converting task to summary without children', () => {
        const tasks: Task[] = [
          {
            id: 'task-1',
            name: 'Task 1',
            startDate: '2025-03-01',
            endDate: '2025-03-15',
            duration: 15,
            progress: 50,
            color: '#3b82f6',
            order: 0,
            type: 'task',
            parent: undefined,
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { updateTask } = useTaskStore.getState();
        updateTask('task-1', { type: 'summary' });

        const task = useTaskStore.getState().tasks.find((t) => t.id === 'task-1');
        expect(task?.type).toBe('summary');
        expect(task?.startDate).toBe('2025-03-01');
        expect(task?.endDate).toBe('2025-03-15');
        expect(task?.duration).toBe(15);
      });

      it('should set 7-day duration when converting milestone to task', () => {
        const tasks: Task[] = [
          {
            id: 'ms-1',
            name: 'Milestone 1',
            startDate: '2025-06-10',
            endDate: '2025-06-10',
            duration: 0,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'milestone',
            parent: undefined,
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { updateTask } = useTaskStore.getState();
        updateTask('ms-1', { type: 'task' });

        const task = useTaskStore.getState().tasks.find((t) => t.id === 'ms-1');
        expect(task?.type).toBe('task');
        expect(task?.startDate).toBe('2025-06-10');
        expect(task?.endDate).toBe('2025-06-16');
        expect(task?.duration).toBe(7);
      });

      it('should preserve dates through full type cycle: task → summary → milestone → task', () => {
        const tasks: Task[] = [
          {
            id: 'cycle-1',
            name: 'Cycle Test',
            startDate: '2025-04-01',
            endDate: '2025-04-10',
            duration: 10,
            progress: 30,
            color: '#3b82f6',
            order: 0,
            type: 'task',
            parent: undefined,
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { updateTask } = useTaskStore.getState();

        // task → summary (no children, dates preserved)
        updateTask('cycle-1', { type: 'summary' });
        let task = useTaskStore.getState().tasks.find((t) => t.id === 'cycle-1');
        expect(task?.type).toBe('summary');
        expect(task?.startDate).toBe('2025-04-01');

        // summary → milestone (startDate preserved)
        updateTask('cycle-1', { type: 'milestone' });
        task = useTaskStore.getState().tasks.find((t) => t.id === 'cycle-1');
        expect(task?.type).toBe('milestone');
        expect(task?.startDate).toBe('2025-04-01');
        expect(task?.endDate).toBe('2025-04-01');
        expect(task?.duration).toBe(0);

        // milestone → task (gets 7-day duration from milestone date)
        updateTask('cycle-1', { type: 'task' });
        task = useTaskStore.getState().tasks.find((t) => t.id === 'cycle-1');
        expect(task?.type).toBe('task');
        expect(task?.startDate).toBe('2025-04-01');
        expect(task?.endDate).toBe('2025-04-07');
        expect(task?.duration).toBe(7);
      });
    });

    describe('deleteTask - cascade and parent recalculation', () => {
      it('should cascade delete children', () => {
        const tasks: Task[] = [
          {
            id: 'parent',
            name: 'Parent',
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            duration: 31,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'summary',
            parent: undefined,
            metadata: {},
          },
          {
            id: 'child1',
            name: 'Child 1',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: 'parent',
            metadata: {},
          },
          {
            id: 'grandchild',
            name: 'Grandchild',
            startDate: '2025-01-01',
            endDate: '2025-01-05',
            duration: 5,
            progress: 0,
            color: '#3b82f6',
            order: 2,
            type: 'task',
            parent: 'child1',
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { deleteTask } = useTaskStore.getState();

        deleteTask('parent', true); // Cascade delete

        expect(useTaskStore.getState().tasks).toHaveLength(0);
      });

      it('should recalculate parent dates after child deletion', () => {
        const tasks: Task[] = [
          {
            id: 'parent',
            name: 'Parent',
            startDate: '2025-01-01',
            endDate: '2025-01-20',
            duration: 20,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'summary',
            parent: undefined,
            metadata: {},
          },
          {
            id: 'child1',
            name: 'Child 1',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: 'parent',
            metadata: {},
          },
          {
            id: 'child2',
            name: 'Child 2',
            startDate: '2025-01-11',
            endDate: '2025-01-20',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 2,
            type: 'task',
            parent: 'parent',
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { deleteTask } = useTaskStore.getState();

        deleteTask('child2', false);

        const parent = useTaskStore.getState().tasks.find((t) => t.id === 'parent');
        expect(parent?.startDate).toBe('2025-01-01');
        expect(parent?.endDate).toBe('2025-01-10');
      });

      it('should clear parent dates when last child is deleted', () => {
        const tasks: Task[] = [
          {
            id: 'parent',
            name: 'Parent',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 0,
            type: 'summary',
            parent: undefined,
            metadata: {},
          },
          {
            id: 'child',
            name: 'Child',
            startDate: '2025-01-01',
            endDate: '2025-01-10',
            duration: 10,
            progress: 0,
            color: '#3b82f6',
            order: 1,
            type: 'task',
            parent: 'parent',
            metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { deleteTask } = useTaskStore.getState();

        deleteTask('child', false);

        const parent = useTaskStore.getState().tasks.find((t) => t.id === 'parent');
        expect(parent?.startDate).toBe('');
        expect(parent?.endDate).toBe('');
        expect(parent?.duration).toBe(0);
      });
    });
  });

  describe('insertTaskAbove', () => {
    it('should insert a new task above the reference task', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'First Task',
          startDate: '2025-01-10',
          endDate: '2025-01-17',
          duration: 7,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskAbove } = useTaskStore.getState();
      insertTaskAbove('task-1');

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks).toHaveLength(2);
      expect(updatedTasks[0].name).toBe('New Task');
      expect(updatedTasks[1].id).toBe('task-1');
    });

    it('should set end date one day before reference start date', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Reference Task',
          startDate: '2025-01-15',
          endDate: '2025-01-20',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskAbove } = useTaskStore.getState();
      insertTaskAbove('task-1');

      const newTask = useTaskStore.getState().tasks[0];
      expect(newTask.endDate).toBe('2025-01-14'); // Day before 2025-01-15
    });

    it('should inherit parent from reference task', () => {
      const tasks: Task[] = [
        {
          id: 'parent',
          name: 'Parent',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          duration: 31,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'summary',
          metadata: {},
        },
        {
          id: 'child',
          name: 'Child Task',
          startDate: '2025-01-10',
          endDate: '2025-01-15',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          parent: 'parent',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskAbove } = useTaskStore.getState();
      insertTaskAbove('child');

      const newTask = useTaskStore.getState().tasks[1];
      expect(newTask.parent).toBe('parent');
    });

    it('should update order for all tasks', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          startDate: '2025-01-10',
          endDate: '2025-01-15',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
        {
          id: 'task-2',
          name: 'Task 2',
          startDate: '2025-01-20',
          endDate: '2025-01-25',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskAbove } = useTaskStore.getState();
      insertTaskAbove('task-2');

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks[0].order).toBe(0);
      expect(updatedTasks[1].order).toBe(1);
      expect(updatedTasks[2].order).toBe(2);
    });

    it('should do nothing if reference task not found', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          startDate: '2025-01-10',
          endDate: '2025-01-15',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskAbove } = useTaskStore.getState();
      insertTaskAbove('non-existent');

      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });
  });

  describe('insertTaskBelow', () => {
    it('should insert a new task below the reference task', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'First Task',
          startDate: '2025-01-10',
          endDate: '2025-01-17',
          duration: 7,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskBelow } = useTaskStore.getState();
      insertTaskBelow('task-1');

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks).toHaveLength(2);
      expect(updatedTasks[0].id).toBe('task-1');
      expect(updatedTasks[1].name).toBe('New Task');
    });

    it('should set start date one day after reference end date', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Reference Task',
          startDate: '2025-01-10',
          endDate: '2025-01-15',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskBelow } = useTaskStore.getState();
      insertTaskBelow('task-1');

      const newTask = useTaskStore.getState().tasks[1];
      expect(newTask.startDate).toBe('2025-01-16'); // Day after 2025-01-15
    });

    it('should inherit parent from reference task', () => {
      const tasks: Task[] = [
        {
          id: 'parent',
          name: 'Parent',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          duration: 31,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'summary',
          metadata: {},
        },
        {
          id: 'child',
          name: 'Child Task',
          startDate: '2025-01-10',
          endDate: '2025-01-15',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          parent: 'parent',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskBelow } = useTaskStore.getState();
      insertTaskBelow('child');

      const newTask = useTaskStore.getState().tasks[2];
      expect(newTask.parent).toBe('parent');
    });

    it('should update order for all tasks', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          startDate: '2025-01-10',
          endDate: '2025-01-15',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
        {
          id: 'task-2',
          name: 'Task 2',
          startDate: '2025-01-20',
          endDate: '2025-01-25',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskBelow } = useTaskStore.getState();
      insertTaskBelow('task-1');

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks[0].order).toBe(0);
      expect(updatedTasks[1].order).toBe(1);
      expect(updatedTasks[2].order).toBe(2);
    });

    it('should do nothing if reference task not found', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          startDate: '2025-01-10',
          endDate: '2025-01-15',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskBelow } = useTaskStore.getState();
      insertTaskBelow('non-existent');

      expect(useTaskStore.getState().tasks).toHaveLength(1);
    });

    it('should create task with default 7-day duration', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Reference Task',
          startDate: '2025-01-10',
          endDate: '2025-01-15',
          duration: 6,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskBelow } = useTaskStore.getState();
      insertTaskBelow('task-1');

      const newTask = useTaskStore.getState().tasks[1];
      expect(newTask.duration).toBe(7);
      expect(newTask.startDate).toBe('2025-01-16');
      expect(newTask.endDate).toBe('2025-01-22'); // 7 days from 2025-01-16
    });
  });
});

describe('Task Store - Multi-Task Operations', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      selectedTaskIds: [],
      lastSelectedTaskId: null,
      activeCell: { taskId: null, field: null },
      isEditingCell: false,
      columnWidths: {},
      taskTableWidth: null,
    });
    useHistoryStore.setState({
      undoStack: [],
      redoStack: [],
      isUndoing: false,
      isRedoing: false,
    });
  });

  describe('updateMultipleTasks', () => {
    it('should update multiple tasks at once', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          startDate: '2025-01-01',
          endDate: '2025-01-05',
          duration: 5,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
        {
          id: 'task-2',
          name: 'Task 2',
          startDate: '2025-01-06',
          endDate: '2025-01-10',
          duration: 5,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();
      updateMultipleTasks([
        { id: 'task-1', updates: { startDate: '2025-01-02', endDate: '2025-01-06' } },
        { id: 'task-2', updates: { startDate: '2025-01-07', endDate: '2025-01-11' } },
      ]);

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks[0].startDate).toBe('2025-01-02');
      expect(updatedTasks[0].endDate).toBe('2025-01-06');
      expect(updatedTasks[1].startDate).toBe('2025-01-07');
      expect(updatedTasks[1].endDate).toBe('2025-01-11');
    });

    it('should record a single undo command for multiple task updates', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          startDate: '2025-01-01',
          endDate: '2025-01-05',
          duration: 5,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
        {
          id: 'task-2',
          name: 'Task 2',
          startDate: '2025-01-06',
          endDate: '2025-01-10',
          duration: 5,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();
      updateMultipleTasks([
        { id: 'task-1', updates: { startDate: '2025-01-02', endDate: '2025-01-06' } },
        { id: 'task-2', updates: { startDate: '2025-01-07', endDate: '2025-01-11' } },
      ]);

      const undoStack = useHistoryStore.getState().undoStack;
      expect(undoStack).toHaveLength(1);
      expect(undoStack[0].type).toBe('multiDragTasks');
    });

    it('should cascade updates to parent summary tasks', () => {
      const tasks: Task[] = [
        {
          id: 'summary',
          name: 'Summary',
          startDate: '2025-01-01',
          endDate: '2025-01-10',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'summary',
          metadata: {},
        },
        {
          id: 'child-1',
          name: 'Child 1',
          startDate: '2025-01-01',
          endDate: '2025-01-05',
          duration: 5,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          parent: 'summary',
          metadata: {},
        },
        {
          id: 'child-2',
          name: 'Child 2',
          startDate: '2025-01-06',
          endDate: '2025-01-10',
          duration: 5,
          progress: 0,
          color: '#3b82f6',
          order: 2,
          type: 'task',
          parent: 'summary',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();
      // Move both children forward by 5 days
      updateMultipleTasks([
        { id: 'child-1', updates: { startDate: '2025-01-06', endDate: '2025-01-10', duration: 5 } },
        { id: 'child-2', updates: { startDate: '2025-01-11', endDate: '2025-01-15', duration: 5 } },
      ]);

      const updatedTasks = useTaskStore.getState().tasks;
      const summary = updatedTasks.find(t => t.id === 'summary');

      // Summary should have updated dates based on children
      expect(summary?.startDate).toBe('2025-01-06');
      expect(summary?.endDate).toBe('2025-01-15');
    });

    it('should handle empty updates array', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          startDate: '2025-01-01',
          endDate: '2025-01-05',
          duration: 5,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();
      updateMultipleTasks([]);

      // No undo command should be recorded
      const undoStack = useHistoryStore.getState().undoStack;
      expect(undoStack).toHaveLength(0);
    });

    it('should skip non-existent task IDs', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          startDate: '2025-01-01',
          endDate: '2025-01-05',
          duration: 5,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { updateMultipleTasks } = useTaskStore.getState();
      updateMultipleTasks([
        { id: 'task-1', updates: { startDate: '2025-01-02', endDate: '2025-01-06' } },
        { id: 'nonexistent', updates: { startDate: '2025-01-02', endDate: '2025-01-06' } },
      ]);

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks).toHaveLength(1);
      expect(updatedTasks[0].startDate).toBe('2025-01-02');
    });
  });
});
