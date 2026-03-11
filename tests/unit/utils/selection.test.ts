/**
 * Unit tests for selection utilities.
 */

import { describe, it, expect } from 'vitest';
import { findTopmostSelectedTaskId } from '../../../src/utils/selection';
import type { Task } from '../../../src/types/chart.types';
import { tid } from '../../helpers/branded';

function makeTask(id: string, order: number, extra: Partial<Task> = {}): Task {
  return {
    id: tid(id),
    name: `Task ${id}`,
    startDate: '2025-01-01',
    endDate: '2025-01-05',
    duration: 5,
    progress: 0,
    color: '#3b82f6',
    order,
    type: 'task',
    metadata: {},
    ...extra,
  };
}

describe('findTopmostSelectedTaskId', () => {
  const tasks = [
    makeTask('a', 0),
    makeTask('b', 1),
    makeTask('c', 2),
    makeTask('d', 3),
  ];

  it('returns null for an empty selection', () => {
    expect(findTopmostSelectedTaskId(tasks, [])).toBeNull();
  });

  it('returns null when no selected task exists in the flat list', () => {
    expect(findTopmostSelectedTaskId(tasks, [tid('x'), tid('y')])).toBeNull();
  });

  it('returns the only selected task', () => {
    expect(findTopmostSelectedTaskId(tasks, [tid('c')])).toBe(tid('c'));
  });

  it('returns the topmost task when multiple are selected', () => {
    // 'd' comes before 'c' and 'b' in order but 'b' is topmost by flat order
    expect(findTopmostSelectedTaskId(tasks, [tid('d'), tid('c'), tid('b')])).toBe(tid('b'));
  });

  it('returns the topmost task regardless of selection-array order', () => {
    // Selection array has 'd' first, but 'a' is topmost in the visual list
    expect(findTopmostSelectedTaskId(tasks, [tid('d'), tid('a')])).toBe(tid('a'));
  });

  it('respects visual order for hierarchical tasks', () => {
    const hierarchical = [
      makeTask('root', 0),
      makeTask('child1', 1, { parent: tid('root') }),
      makeTask('child2', 2, { parent: tid('root') }),
      makeTask('sibling', 3),
    ];
    // child1 appears before sibling in the flattened list
    expect(findTopmostSelectedTaskId(hierarchical, [tid('sibling'), tid('child1')])).toBe(
      tid('child1'),
    );
  });

  it('excludes children of collapsed parents from the flat list', () => {
    const hierarchical = [
      makeTask('root', 0, { open: false }),
      makeTask('child', 1, { parent: tid('root') }),
      makeTask('other', 2),
    ];
    // 'child' is hidden because its parent is collapsed
    // Only 'root' and 'other' appear in the flat list
    expect(findTopmostSelectedTaskId(hierarchical, [tid('child'), tid('other')])).toBe(
      tid('other'),
    );
  });

  it('handles empty task list', () => {
    expect(findTopmostSelectedTaskId([], [tid('a')])).toBeNull();
  });
});
