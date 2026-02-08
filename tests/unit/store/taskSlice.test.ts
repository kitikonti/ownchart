import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskStore } from '../../../src/store/slices/taskSlice';
import { useHistoryStore } from '../../../src/store/slices/historySlice';
import type { Task, TaskType } from '../../../src/types/chart.types';

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

      const allTasks = useTaskStore.getState().tasks;
      const task1Id = allTasks.find(t => t.name === 'Task 1')!.id;
      const task3Id = allTasks.find(t => t.name === 'Task 3')!.id;

      // Move first task to last position (drag Task 1 onto Task 3)
      reorderTasks(task1Id, task3Id);

      const tasks = useTaskStore.getState().tasks;
      const names = [...tasks].sort((a, b) => a.order - b.order).map(t => t.name);
      expect(names).toEqual(['Task 2', 'Task 3', 'Task 1']);
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

      const allTasks = useTaskStore.getState().tasks;
      const task1Id = allTasks.find(t => t.name === 'Task 1')!.id;
      const task2Id = allTasks.find(t => t.name === 'Task 2')!.id;

      reorderTasks(task1Id, task2Id);

      const tasks = useTaskStore.getState().tasks;
      const sorted = [...tasks].sort((a, b) => a.order - b.order);
      expect(sorted[0].order).toBe(0);
      expect(sorted[1].order).toBe(1);
    });

    it('should handle invalid IDs gracefully', () => {
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

      const originalTasks = useTaskStore.getState().tasks.map(t => ({ ...t }));

      // Non-existent IDs
      reorderTasks('nonexistent-1', 'nonexistent-2');
      reorderTasks(originalTasks[0].id, 'nonexistent');
      reorderTasks('nonexistent', originalTasks[0].id);

      const tasks = useTaskStore.getState().tasks;
      expect(tasks.length).toBe(originalTasks.length);
      expect(tasks[0].name).toBe(originalTasks[0].name);
    });
  });

  describe('reorderTasks - hierarchy', () => {
    const taskTemplate = {
      startDate: '2025-12-01',
      endDate: '2025-12-10',
      duration: 10,
      progress: 0,
      color: '#3b82f6',
      metadata: {},
    };

    /**
     * Helper: creates tasks and returns a map of name → id.
     * Clears undo stack after creation.
     */
    function setupTasks(taskDefs: Array<{ name: string; parent?: string; order: number; type?: string }>): Record<string, string> {
      const { addTask } = useTaskStore.getState();
      const nameToId: Record<string, string> = {};

      for (const def of taskDefs) {
        addTask({
          ...taskTemplate,
          name: def.name,
          order: def.order,
          type: (def.type as TaskType) ?? 'task',
          parent: def.parent ? nameToId[def.parent] : undefined,
        });
        const tasks = useTaskStore.getState().tasks;
        const created = tasks.find(t => t.name === def.name);
        if (created) nameToId[def.name] = created.id;
      }

      // Clear undo stack from task creations
      useHistoryStore.setState({ undoStack: [], redoStack: [] });
      return nameToId;
    }

    function getOrderedNames(parentId?: string | null): string[] {
      const tasks = useTaskStore.getState().tasks;
      return tasks
        .filter(t => {
          if (parentId === undefined) return true;
          if (parentId === null) return !t.parent;
          return t.parent === parentId;
        })
        .sort((a, b) => a.order - b.order)
        .map(t => t.name);
    }

    describe('within same parent group', () => {
      it('should move task forward within group', () => {
        const ids = setupTasks([
          { name: 'A', order: 0 },
          { name: 'B', order: 1 },
          { name: 'C', order: 2 },
        ]);

        // Drag A onto C (move down)
        useTaskStore.getState().reorderTasks(ids['A'], ids['C']);

        expect(getOrderedNames(null)).toEqual(['B', 'C', 'A']);
      });

      it('should move task backward within group', () => {
        const ids = setupTasks([
          { name: 'A', order: 0 },
          { name: 'B', order: 1 },
          { name: 'C', order: 2 },
        ]);

        // Drag C onto A (move up)
        useTaskStore.getState().reorderTasks(ids['C'], ids['A']);

        expect(getOrderedNames(null)).toEqual(['C', 'A', 'B']);
      });

      it('should swap adjacent siblings', () => {
        const ids = setupTasks([
          { name: 'A', order: 0 },
          { name: 'B', order: 1 },
        ]);

        // Drag A onto B
        useTaskStore.getState().reorderTasks(ids['A'], ids['B']);

        expect(getOrderedNames(null)).toEqual(['B', 'A']);
      });

      it('should move within child group without affecting root', () => {
        const ids = setupTasks([
          { name: 'Parent', order: 0, type: 'summary' },
          { name: 'Child1', order: 0, parent: 'Parent' },
          { name: 'Child2', order: 1, parent: 'Parent' },
          { name: 'Child3', order: 2, parent: 'Parent' },
          { name: 'Root2', order: 1 },
        ]);

        // Drag Child1 onto Child3 (move down within Parent's children)
        useTaskStore.getState().reorderTasks(ids['Child1'], ids['Child3']);

        expect(getOrderedNames(ids['Parent'])).toEqual(['Child2', 'Child3', 'Child1']);
        // Root level unchanged
        expect(getOrderedNames(null)).toEqual(['Parent', 'Root2']);
      });
    });

    describe('isolation - core bug verification', () => {
      it('should not affect Engineering children when reordering within Procurement', () => {
        const ids = setupTasks([
          { name: 'Procurement', order: 0, type: 'summary' },
          { name: 'P-Alpha', order: 0, parent: 'Procurement' },
          { name: 'P-Beta', order: 1, parent: 'Procurement' },
          { name: 'P-Gamma', order: 2, parent: 'Procurement' },
          { name: 'Engineering', order: 1, type: 'summary' },
          { name: 'E-Alpha', order: 0, parent: 'Engineering' },
          { name: 'E-Beta', order: 1, parent: 'Engineering' },
        ]);

        // Reorder within Procurement: drag P-Alpha onto P-Gamma
        useTaskStore.getState().reorderTasks(ids['P-Alpha'], ids['P-Gamma']);

        // Procurement children reordered
        expect(getOrderedNames(ids['Procurement'])).toEqual(['P-Beta', 'P-Gamma', 'P-Alpha']);

        // Engineering children UNCHANGED
        expect(getOrderedNames(ids['Engineering'])).toEqual(['E-Alpha', 'E-Beta']);

        // Root level unchanged
        expect(getOrderedNames(null)).toEqual(['Procurement', 'Engineering']);
      });

      it('should not affect Procurement children when reordering within Engineering', () => {
        const ids = setupTasks([
          { name: 'Procurement', order: 0, type: 'summary' },
          { name: 'P-Alpha', order: 0, parent: 'Procurement' },
          { name: 'P-Beta', order: 1, parent: 'Procurement' },
          { name: 'Engineering', order: 1, type: 'summary' },
          { name: 'E-Alpha', order: 0, parent: 'Engineering' },
          { name: 'E-Beta', order: 1, parent: 'Engineering' },
          { name: 'E-Gamma', order: 2, parent: 'Engineering' },
        ]);

        // Reorder within Engineering: drag E-Gamma onto E-Alpha
        useTaskStore.getState().reorderTasks(ids['E-Gamma'], ids['E-Alpha']);

        // Engineering children reordered
        expect(getOrderedNames(ids['Engineering'])).toEqual(['E-Gamma', 'E-Alpha', 'E-Beta']);

        // Procurement children UNCHANGED
        expect(getOrderedNames(ids['Procurement'])).toEqual(['P-Alpha', 'P-Beta']);
      });

      it('root-level reorder should not change children parent references', () => {
        const ids = setupTasks([
          { name: 'GroupA', order: 0, type: 'summary' },
          { name: 'A-Child', order: 0, parent: 'GroupA' },
          { name: 'GroupB', order: 1, type: 'summary' },
          { name: 'B-Child', order: 0, parent: 'GroupB' },
        ]);

        // Reorder root: drag GroupA onto GroupB
        useTaskStore.getState().reorderTasks(ids['GroupA'], ids['GroupB']);

        const tasks = useTaskStore.getState().tasks;
        const aChild = tasks.find(t => t.name === 'A-Child')!;
        const bChild = tasks.find(t => t.name === 'B-Child')!;

        expect(aChild.parent).toBe(ids['GroupA']);
        expect(bChild.parent).toBe(ids['GroupB']);
      });

      it('three-group test: only target group changes', () => {
        const ids = setupTasks([
          { name: 'G1', order: 0, type: 'summary' },
          { name: 'G1-A', order: 0, parent: 'G1' },
          { name: 'G1-B', order: 1, parent: 'G1' },
          { name: 'G2', order: 1, type: 'summary' },
          { name: 'G2-A', order: 0, parent: 'G2' },
          { name: 'G2-B', order: 1, parent: 'G2' },
          { name: 'G3', order: 2, type: 'summary' },
          { name: 'G3-A', order: 0, parent: 'G3' },
          { name: 'G3-B', order: 1, parent: 'G3' },
        ]);

        // Reorder within G2 only
        useTaskStore.getState().reorderTasks(ids['G2-A'], ids['G2-B']);

        expect(getOrderedNames(ids['G1'])).toEqual(['G1-A', 'G1-B']);
        expect(getOrderedNames(ids['G2'])).toEqual(['G2-B', 'G2-A']);
        expect(getOrderedNames(ids['G3'])).toEqual(['G3-A', 'G3-B']);
      });
    });

    describe('cross-parent drag (re-parenting)', () => {
      it('should move task from one parent to another', () => {
        const ids = setupTasks([
          { name: 'ParentA', order: 0, type: 'summary' },
          { name: 'A-Child1', order: 0, parent: 'ParentA' },
          { name: 'A-Child2', order: 1, parent: 'ParentA' },
          { name: 'ParentB', order: 1, type: 'summary' },
          { name: 'B-Child1', order: 0, parent: 'ParentB' },
        ]);

        // Drag A-Child1 onto B-Child1 → A-Child1 moves to ParentB
        useTaskStore.getState().reorderTasks(ids['A-Child1'], ids['B-Child1']);

        const tasks = useTaskStore.getState().tasks;
        const moved = tasks.find(t => t.name === 'A-Child1')!;
        expect(moved.parent).toBe(ids['ParentB']);

        expect(getOrderedNames(ids['ParentA'])).toEqual(['A-Child2']);
        expect(getOrderedNames(ids['ParentB'])).toContain('A-Child1');
        expect(getOrderedNames(ids['ParentB'])).toContain('B-Child1');
      });

      it('should prevent circular hierarchy', () => {
        const ids = setupTasks([
          { name: 'Parent', order: 0, type: 'summary' },
          { name: 'Child', order: 0, parent: 'Parent' },
          { name: 'Grandchild', order: 0, parent: 'Child' },
        ]);

        // Drag Parent onto Grandchild → would create circular, should be no-op
        useTaskStore.getState().reorderTasks(ids['Parent'], ids['Grandchild']);

        const tasks = useTaskStore.getState().tasks;
        const parent = tasks.find(t => t.name === 'Parent')!;
        expect(parent.parent).toBeUndefined();
      });

      it('should prevent exceeding max depth', () => {
        const ids = setupTasks([
          { name: 'L0', order: 0, type: 'summary' },
          { name: 'L1', order: 0, parent: 'L0', type: 'summary' },
          { name: 'L2', order: 0, parent: 'L1' },
          { name: 'SummaryWithChild', order: 1, type: 'summary' },
          { name: 'SWC-Child', order: 0, parent: 'SummaryWithChild' },
        ]);

        // Drag SummaryWithChild onto L2 → would put SWC-Child at level 4, exceeding max 3
        useTaskStore.getState().reorderTasks(ids['SummaryWithChild'], ids['L2']);

        const tasks = useTaskStore.getState().tasks;
        const swc = tasks.find(t => t.name === 'SummaryWithChild')!;
        // Should still be root level (no-op)
        expect(swc.parent).toBeUndefined();
      });

      it('should allow leaf task move within depth limits', () => {
        const ids = setupTasks([
          { name: 'L0', order: 0, type: 'summary' },
          { name: 'L1', order: 0, parent: 'L0', type: 'summary' },
          { name: 'L2', order: 0, parent: 'L1' },
          { name: 'LeafToMove', order: 1 },
        ]);

        // Drag LeafToMove onto L2 → both at level 2 under L1, within limits
        useTaskStore.getState().reorderTasks(ids['LeafToMove'], ids['L2']);

        const tasks = useTaskStore.getState().tasks;
        const leaf = tasks.find(t => t.name === 'LeafToMove')!;
        expect(leaf.parent).toBe(ids['L1']);
      });
    });

    describe('summary tasks', () => {
      it('should move summary at root level while keeping children', () => {
        const ids = setupTasks([
          { name: 'Summary1', order: 0, type: 'summary' },
          { name: 'S1-Child', order: 0, parent: 'Summary1' },
          { name: 'Summary2', order: 1, type: 'summary' },
          { name: 'S2-Child', order: 0, parent: 'Summary2' },
        ]);

        // Move Summary1 after Summary2
        useTaskStore.getState().reorderTasks(ids['Summary1'], ids['Summary2']);

        expect(getOrderedNames(null)).toEqual(['Summary2', 'Summary1']);

        // Children parent refs unchanged
        const tasks = useTaskStore.getState().tasks;
        expect(tasks.find(t => t.name === 'S1-Child')!.parent).toBe(ids['Summary1']);
        expect(tasks.find(t => t.name === 'S2-Child')!.parent).toBe(ids['Summary2']);
      });
    });

    describe('edge cases', () => {
      it('should handle non-sequential order values', () => {
        const ids = setupTasks([
          { name: 'A', order: 0 },
          { name: 'B', order: 5 },
          { name: 'C', order: 10 },
        ]);

        useTaskStore.getState().reorderTasks(ids['C'], ids['A']);

        const tasks = useTaskStore.getState().tasks;
        const sorted = [...tasks].sort((a, b) => a.order - b.order);
        // Verify orders are normalized (sequential)
        expect(sorted[0].order).toBe(0);
        expect(sorted[1].order).toBe(1);
        expect(sorted[2].order).toBe(2);
        expect(sorted.map(t => t.name)).toEqual(['C', 'A', 'B']);
      });
    });

    describe('undo/redo', () => {
      it('should undo reorder within same parent', () => {
        const ids = setupTasks([
          { name: 'A', order: 0 },
          { name: 'B', order: 1 },
          { name: 'C', order: 2 },
        ]);

        useTaskStore.getState().reorderTasks(ids['A'], ids['C']);
        expect(getOrderedNames(null)).toEqual(['B', 'C', 'A']);

        useHistoryStore.getState().undo();
        expect(getOrderedNames(null)).toEqual(['A', 'B', 'C']);
      });

      it('should redo reorder', () => {
        const ids = setupTasks([
          { name: 'A', order: 0 },
          { name: 'B', order: 1 },
          { name: 'C', order: 2 },
        ]);

        useTaskStore.getState().reorderTasks(ids['A'], ids['C']);
        useHistoryStore.getState().undo();
        useHistoryStore.getState().redo();

        expect(getOrderedNames(null)).toEqual(['B', 'C', 'A']);
      });

      it('should undo cross-parent move and restore old parent', () => {
        const ids = setupTasks([
          { name: 'ParentA', order: 0, type: 'summary' },
          { name: 'A-Child', order: 0, parent: 'ParentA' },
          { name: 'ParentB', order: 1, type: 'summary' },
          { name: 'B-Child', order: 0, parent: 'ParentB' },
        ]);

        // Move A-Child to ParentB
        useTaskStore.getState().reorderTasks(ids['A-Child'], ids['B-Child']);

        const tasks1 = useTaskStore.getState().tasks;
        expect(tasks1.find(t => t.name === 'A-Child')!.parent).toBe(ids['ParentB']);

        // Undo
        useHistoryStore.getState().undo();

        const tasks2 = useTaskStore.getState().tasks;
        expect(tasks2.find(t => t.name === 'A-Child')!.parent).toBe(ids['ParentA']);
        expect(getOrderedNames(ids['ParentA'])).toEqual(['A-Child']);
      });
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
    const setupTasks = (): void => {
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

      it('should navigate in visual (hierarchy) order, not raw array order', () => {
        // Array order: parentA, parentB, childA1, childA2
        // Visual order: parentA, childA1, childA2, parentB
        const tasks: Task[] = [
          {
            id: 'parentA', name: 'Parent A', startDate: '2025-01-01', endDate: '2025-01-10',
            duration: 10, progress: 0, color: '#3b82f6', order: 0, type: 'summary', parent: undefined, metadata: {},
          },
          {
            id: 'parentB', name: 'Parent B', startDate: '2025-01-01', endDate: '2025-01-10',
            duration: 10, progress: 0, color: '#3b82f6', order: 1, type: 'task', parent: undefined, metadata: {},
          },
          {
            id: 'childA1', name: 'Child A1', startDate: '2025-01-01', endDate: '2025-01-05',
            duration: 5, progress: 0, color: '#3b82f6', order: 0, type: 'task', parent: 'parentA', metadata: {},
          },
          {
            id: 'childA2', name: 'Child A2', startDate: '2025-01-06', endDate: '2025-01-10',
            duration: 5, progress: 0, color: '#3b82f6', order: 1, type: 'task', parent: 'parentA', metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { setActiveCell, navigateCell } = useTaskStore.getState();

        // Start at parentA, go down → should be childA1 (not parentB)
        setActiveCell('parentA', 'name');
        navigateCell('down');
        expect(useTaskStore.getState().activeCell.taskId).toBe('childA1');

        // From childA1, go down → childA2
        navigateCell('down');
        expect(useTaskStore.getState().activeCell.taskId).toBe('childA2');

        // From childA2, go down → parentB
        navigateCell('down');
        expect(useTaskStore.getState().activeCell.taskId).toBe('parentB');

        // From parentB, go up → childA2
        navigateCell('up');
        expect(useTaskStore.getState().activeCell.taskId).toBe('childA2');
      });

      it('should skip collapsed children when navigating', () => {
        const tasks: Task[] = [
          {
            id: 'parentA', name: 'Parent A', startDate: '2025-01-01', endDate: '2025-01-10',
            duration: 10, progress: 0, color: '#3b82f6', order: 0, type: 'summary', parent: undefined, metadata: {}, open: false,
          },
          {
            id: 'parentB', name: 'Parent B', startDate: '2025-01-11', endDate: '2025-01-20',
            duration: 10, progress: 0, color: '#3b82f6', order: 1, type: 'task', parent: undefined, metadata: {},
          },
          {
            id: 'childA1', name: 'Child A1', startDate: '2025-01-01', endDate: '2025-01-05',
            duration: 5, progress: 0, color: '#3b82f6', order: 0, type: 'task', parent: 'parentA', metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { setActiveCell, navigateCell } = useTaskStore.getState();

        // parentA is collapsed, so down from parentA should skip childA1 → parentB
        setActiveCell('parentA', 'name');
        navigateCell('down');
        expect(useTaskStore.getState().activeCell.taskId).toBe('parentB');

        // Up from parentB should go to parentA (skipping collapsed children)
        navigateCell('up');
        expect(useTaskStore.getState().activeCell.taskId).toBe('parentA');
      });

      it('should not navigate beyond boundaries with hierarchy', () => {
        const tasks: Task[] = [
          {
            id: 'parentA', name: 'Parent A', startDate: '2025-01-01', endDate: '2025-01-10',
            duration: 10, progress: 0, color: '#3b82f6', order: 0, type: 'summary', parent: undefined, metadata: {},
          },
          {
            id: 'childA1', name: 'Child A1', startDate: '2025-01-01', endDate: '2025-01-05',
            duration: 5, progress: 0, color: '#3b82f6', order: 0, type: 'task', parent: 'parentA', metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { setActiveCell, navigateCell } = useTaskStore.getState();

        // At last visible task (childA1), down should stay
        setActiveCell('childA1', 'name');
        navigateCell('down');
        expect(useTaskStore.getState().activeCell.taskId).toBe('childA1');

        // At first visible task (parentA), up should stay
        setActiveCell('parentA', 'name');
        navigateCell('up');
        expect(useTaskStore.getState().activeCell.taskId).toBe('parentA');
      });
    });

    describe('selectTaskRange with hierarchy', () => {
      it('should select range in visual order', () => {
        // Array order: parentA, parentB, childA1, childA2
        // Visual order: parentA, childA1, childA2, parentB
        const tasks: Task[] = [
          {
            id: 'parentA', name: 'Parent A', startDate: '2025-01-01', endDate: '2025-01-10',
            duration: 10, progress: 0, color: '#3b82f6', order: 0, type: 'summary', parent: undefined, metadata: {},
          },
          {
            id: 'parentB', name: 'Parent B', startDate: '2025-01-11', endDate: '2025-01-20',
            duration: 10, progress: 0, color: '#3b82f6', order: 1, type: 'task', parent: undefined, metadata: {},
          },
          {
            id: 'childA1', name: 'Child A1', startDate: '2025-01-01', endDate: '2025-01-05',
            duration: 5, progress: 0, color: '#3b82f6', order: 0, type: 'task', parent: 'parentA', metadata: {},
          },
          {
            id: 'childA2', name: 'Child A2', startDate: '2025-01-06', endDate: '2025-01-10',
            duration: 5, progress: 0, color: '#3b82f6', order: 1, type: 'task', parent: 'parentA', metadata: {},
          },
        ];
        useTaskStore.setState({ tasks });

        const { selectTaskRange } = useTaskStore.getState();

        // Select from parentA to parentB → should include childA1, childA2 (visual order)
        selectTaskRange('parentA', 'parentB');

        const state = useTaskStore.getState();
        expect(state.selectedTaskIds).toContain('parentA');
        expect(state.selectedTaskIds).toContain('childA1');
        expect(state.selectedTaskIds).toContain('childA2');
        expect(state.selectedTaskIds).toContain('parentB');
        expect(state.selectedTaskIds).toHaveLength(4);
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

    it('should recalculate parent summary dates when inserting above a child', () => {
      const tasks: Task[] = [
        {
          id: 'summary-1',
          name: 'Summary',
          startDate: '2025-01-10',
          endDate: '2025-01-20',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'summary',
          metadata: {},
        },
        {
          id: 'child-1',
          name: 'Child Task',
          startDate: '2025-01-10',
          endDate: '2025-01-20',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          parent: 'summary-1',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskAbove } = useTaskStore.getState();
      insertTaskAbove('child-1');

      const state = useTaskStore.getState();
      const summary = state.tasks.find((t) => t.id === 'summary-1');
      const newTask = state.tasks.find(
        (t) => t.id !== 'summary-1' && t.id !== 'child-1'
      );

      // New task inserted above child-1 should end the day before child-1 starts (2025-01-09)
      // and start 7 days before that
      expect(newTask).toBeDefined();
      expect(newTask!.parent).toBe('summary-1');
      // Summary should now start at the new task's earlier start date
      expect(summary!.startDate).toBe(newTask!.startDate);
    });
  });

  describe('insertMultipleTasksAbove', () => {
    it('should insert correct number of tasks', () => {
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

      const { insertMultipleTasksAbove } = useTaskStore.getState();
      insertMultipleTasksAbove('task-1', 3);

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks).toHaveLength(4);
      expect(updatedTasks[3].id).toBe('task-1');
      // All new tasks should be named "New Task"
      expect(updatedTasks[0].name).toBe('New Task');
      expect(updatedTasks[1].name).toBe('New Task');
      expect(updatedTasks[2].name).toBe('New Task');
    });

    it('should assign correct parent from reference task', () => {
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
          name: 'Child',
          startDate: '2025-01-10',
          endDate: '2025-01-17',
          duration: 7,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          parent: 'parent',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertMultipleTasksAbove } = useTaskStore.getState();
      insertMultipleTasksAbove('child', 2);

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks).toHaveLength(4);
      // Both new tasks should have the same parent
      expect(updatedTasks[1].parent).toBe('parent');
      expect(updatedTasks[2].parent).toBe('parent');
    });

    it('should give tasks sequential dates before reference', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task',
          startDate: '2025-02-01',
          endDate: '2025-02-08',
          duration: 7,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertMultipleTasksAbove } = useTaskStore.getState();
      insertMultipleTasksAbove('task-1', 2);

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks).toHaveLength(3);
      // The second inserted task (closer to reference) should end before reference starts
      const closerTask = updatedTasks[1];
      expect(closerTask.endDate).toBe('2025-01-31');
      // The first inserted task should end before the second inserted task
      const fartherTask = updatedTasks[0];
      expect(new Date(fartherTask.endDate!).getTime()).toBeLessThan(
        new Date(closerTask.startDate!).getTime()
      );
    });

    it('should normalize task order after insert', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'First',
          startDate: '2025-01-10',
          endDate: '2025-01-17',
          duration: 7,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'task',
          metadata: {},
        },
        {
          id: 'task-2',
          name: 'Second',
          startDate: '2025-01-18',
          endDate: '2025-01-25',
          duration: 7,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertMultipleTasksAbove } = useTaskStore.getState();
      insertMultipleTasksAbove('task-2', 2);

      const updatedTasks = useTaskStore.getState().tasks;
      expect(updatedTasks).toHaveLength(4);
      // Order should be sequential
      updatedTasks.forEach((task, index) => {
        expect(task.order).toBe(index);
      });
    });

    it('should do nothing for non-existent reference task', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'First',
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

      const { insertMultipleTasksAbove } = useTaskStore.getState();
      insertMultipleTasksAbove('non-existent', 2);

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

    it('should recalculate parent summary dates when inserting below a child', () => {
      const tasks: Task[] = [
        {
          id: 'summary-1',
          name: 'Summary',
          startDate: '2025-01-10',
          endDate: '2025-01-20',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'summary',
          metadata: {},
        },
        {
          id: 'child-1',
          name: 'Child Task',
          startDate: '2025-01-10',
          endDate: '2025-01-20',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          parent: 'summary-1',
          metadata: {},
        },
      ];
      useTaskStore.setState({ tasks });

      const { insertTaskBelow } = useTaskStore.getState();
      insertTaskBelow('child-1');

      const state = useTaskStore.getState();
      const summary = state.tasks.find((t) => t.id === 'summary-1');
      const newTask = state.tasks.find(
        (t) => t.id !== 'summary-1' && t.id !== 'child-1'
      );

      // New task inserted below child-1 should start the day after child-1 ends (2025-01-21)
      expect(newTask).toBeDefined();
      expect(newTask!.parent).toBe('summary-1');
      expect(newTask!.startDate).toBe('2025-01-21');
      // Summary should now end at the new task's later end date
      expect(summary!.endDate).toBe(newTask!.endDate);
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

  describe('deleteSelectedTasks - summary recalculation', () => {
    it('should recalculate parent summary dates after deleting a child', () => {
      const tasks: Task[] = [
        {
          id: 'summary-1',
          name: 'Summary',
          startDate: '2025-01-01',
          endDate: '2025-01-20',
          duration: 20,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'summary',
          open: true,
          metadata: {},
        },
        {
          id: 'child-1',
          name: 'Child 1',
          startDate: '2025-01-01',
          endDate: '2025-01-10',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          parent: 'summary-1',
          metadata: {},
        },
        {
          id: 'child-2',
          name: 'Child 2',
          startDate: '2025-01-11',
          endDate: '2025-01-20',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 2,
          type: 'task',
          parent: 'summary-1',
          metadata: {},
        },
      ];

      useTaskStore.setState({ tasks, selectedTaskIds: ['child-2'] });

      const { deleteSelectedTasks } = useTaskStore.getState();
      deleteSelectedTasks();

      const updatedTasks = useTaskStore.getState().tasks;
      const summary = updatedTasks.find(t => t.id === 'summary-1');
      expect(summary).toBeDefined();
      expect(summary!.startDate).toBe('2025-01-01');
      expect(summary!.endDate).toBe('2025-01-10');
      expect(summary!.duration).toBe(10);
    });

    it('should clear summary dates when last child is deleted', () => {
      const tasks: Task[] = [
        {
          id: 'summary-1',
          name: 'Summary',
          startDate: '2025-01-01',
          endDate: '2025-01-10',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'summary',
          open: true,
          metadata: {},
        },
        {
          id: 'child-1',
          name: 'Child 1',
          startDate: '2025-01-01',
          endDate: '2025-01-10',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'task',
          parent: 'summary-1',
          metadata: {},
        },
      ];

      useTaskStore.setState({ tasks, selectedTaskIds: ['child-1'] });

      const { deleteSelectedTasks } = useTaskStore.getState();
      deleteSelectedTasks();

      const updatedTasks = useTaskStore.getState().tasks;
      const summary = updatedTasks.find(t => t.id === 'summary-1');
      expect(summary).toBeDefined();
      expect(summary!.startDate).toBe('');
      expect(summary!.endDate).toBe('');
      expect(summary!.duration).toBe(0);
    });

    it('should cascade up nested summaries after child deletion', () => {
      const tasks: Task[] = [
        {
          id: 'grandparent',
          name: 'Grandparent',
          startDate: '2025-01-01',
          endDate: '2025-01-30',
          duration: 30,
          progress: 0,
          color: '#3b82f6',
          order: 0,
          type: 'summary',
          open: true,
          metadata: {},
        },
        {
          id: 'parent',
          name: 'Parent',
          startDate: '2025-01-01',
          endDate: '2025-01-20',
          duration: 20,
          progress: 0,
          color: '#3b82f6',
          order: 1,
          type: 'summary',
          parent: 'grandparent',
          open: true,
          metadata: {},
        },
        {
          id: 'child-1',
          name: 'Child 1',
          startDate: '2025-01-01',
          endDate: '2025-01-10',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 2,
          type: 'task',
          parent: 'parent',
          metadata: {},
        },
        {
          id: 'child-2',
          name: 'Child 2',
          startDate: '2025-01-11',
          endDate: '2025-01-20',
          duration: 10,
          progress: 0,
          color: '#3b82f6',
          order: 3,
          type: 'task',
          parent: 'parent',
          metadata: {},
        },
      ];

      useTaskStore.setState({ tasks, selectedTaskIds: ['child-2'] });

      const { deleteSelectedTasks } = useTaskStore.getState();
      deleteSelectedTasks();

      const updatedTasks = useTaskStore.getState().tasks;

      // Parent summary should shrink
      const parent = updatedTasks.find(t => t.id === 'parent');
      expect(parent!.startDate).toBe('2025-01-01');
      expect(parent!.endDate).toBe('2025-01-10');

      // Grandparent summary should also shrink (cascade)
      const grandparent = updatedTasks.find(t => t.id === 'grandparent');
      expect(grandparent!.startDate).toBe('2025-01-01');
      expect(grandparent!.endDate).toBe('2025-01-10');
    });
  });
});
