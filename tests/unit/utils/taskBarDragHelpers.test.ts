/**
 * Unit tests for taskBarDragHelpers — pure helper functions
 * extracted from useTaskBarInteraction.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Task } from '../../../src/types/chart.types';
import type { TaskBarGeometry } from '../../../src/utils/timelineUtils';
import type { WorkingDaysConfig } from '../../../src/types/preferences.types';
import { toTaskId } from '../../../src/types/branded.types';
import { toHexColor } from '../../../src/types/branded.types';
import {
  EDGE_THRESHOLD,
  detectInteractionZone,
  determineInteractionMode,
  pixelsToDeltaDays,
  computeEndDateForDrag,
  computeResizePreview,
  calculateDeltaDaysFromDates,
  buildMoveUpdates,
  buildResizeUpdate,
  type DragState,
  type WorkingDaysContext,
} from '../../../src/utils/taskBarDragHelpers';

// Mock dragValidation
vi.mock('../../../src/utils/dragValidation', () => ({
  validateDragOperation: vi.fn(() => ({ valid: true })),
}));

// Mock workingDaysCalculator
vi.mock('../../../src/utils/workingDaysCalculator', () => ({
  calculateWorkingDays: vi.fn(() => 5),
  addWorkingDays: vi.fn(
    (start: string) =>
      // Simple mock: just return start + 6 days (5 working days ≈ 6 calendar)
      start.replace(/\d{2}$/, (d: string) =>
        String(Number(d) + 6).padStart(2, '0'),
      ),
  ),
}));

import { validateDragOperation } from '../../../src/utils/dragValidation';
import {
  calculateWorkingDays,
  addWorkingDays,
} from '../../../src/utils/workingDaysCalculator';

const mockValidate = vi.mocked(validateDragOperation);
const mockCalcWorkingDays = vi.mocked(calculateWorkingDays);
const mockAddWorkingDays = vi.mocked(addWorkingDays);

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: toTaskId('task-1'),
    name: 'Test Task',
    startDate: '2025-01-10',
    endDate: '2025-01-20',
    duration: 11,
    progress: 50,
    color: toHexColor('#4A90D9'),
    order: 0,
    metadata: {},
    type: 'task',
    ...overrides,
  };
}

function createGeometry(
  overrides: Partial<TaskBarGeometry> = {},
): TaskBarGeometry {
  return {
    x: 100,
    y: 40,
    width: 200,
    height: 26,
    ...overrides,
  };
}

const defaultConfig: WorkingDaysConfig = {
  excludeSaturday: true,
  excludeSunday: true,
  excludeHolidays: false,
};

const disabledCtx: WorkingDaysContext = {
  enabled: false,
  config: defaultConfig,
  holidayRegion: undefined,
};

const enabledCtx: WorkingDaysContext = {
  enabled: true,
  config: defaultConfig,
  holidayRegion: undefined,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockValidate.mockReturnValue({ valid: true });
  mockCalcWorkingDays.mockReturnValue(5);
  mockAddWorkingDays.mockImplementation(
    (start: string) =>
      start.replace(/\d{2}$/, (d: string) =>
        String(Number(d) + 6).padStart(2, '0'),
      ),
  );
});

// ─── detectInteractionZone ─────────────────────────────────────────────

describe('detectInteractionZone', () => {
  const geo = createGeometry({ x: 100, width: 200 });

  it('returns left-edge when mouse is within threshold of left side', () => {
    expect(detectInteractionZone(100, geo)).toBe('left-edge');
    expect(detectInteractionZone(107, geo)).toBe('left-edge');
  });

  it('returns right-edge when mouse is within threshold of right side', () => {
    expect(detectInteractionZone(300, geo)).toBe('right-edge');
    expect(detectInteractionZone(293, geo)).toBe('right-edge');
  });

  it('returns center for middle of bar', () => {
    expect(detectInteractionZone(200, geo)).toBe('center');
    expect(detectInteractionZone(108, geo)).toBe('center'); // just past threshold
    expect(detectInteractionZone(292, geo)).toBe('center'); // just before threshold
  });

  it('handles narrow bar where edges overlap', () => {
    const narrowGeo = createGeometry({ x: 100, width: 10 });
    // With width=10 and threshold=8, relativeX<8 is left-edge, >2 is right-edge
    // At relativeX=5: <8 so left-edge wins
    expect(detectInteractionZone(105, narrowGeo)).toBe('left-edge');
    // At relativeX=9: not <8, but >10-8=2, so right-edge
    expect(detectInteractionZone(109, narrowGeo)).toBe('right-edge');
  });

  it('exports EDGE_THRESHOLD constant', () => {
    expect(EDGE_THRESHOLD).toBe(8);
  });
});

// ─── determineInteractionMode ──────────────────────────────────────────

describe('determineInteractionMode', () => {
  it('forces drag mode for summary tasks regardless of zone', () => {
    expect(determineInteractionMode('summary', 'left-edge')).toBe('dragging');
    expect(determineInteractionMode('summary', 'right-edge')).toBe('dragging');
    expect(determineInteractionMode('summary', 'center')).toBe('dragging');
  });

  it('forces drag mode for milestones regardless of zone', () => {
    expect(determineInteractionMode('milestone', 'left-edge')).toBe(
      'dragging',
    );
    expect(determineInteractionMode('milestone', 'center')).toBe('dragging');
  });

  it('maps zones correctly for regular tasks', () => {
    expect(determineInteractionMode('task', 'center')).toBe('dragging');
    expect(determineInteractionMode('task', 'left-edge')).toBe(
      'resizing-left',
    );
    expect(determineInteractionMode('task', 'right-edge')).toBe(
      'resizing-right',
    );
  });

  it('treats undefined type as regular task', () => {
    expect(determineInteractionMode(undefined, 'left-edge')).toBe(
      'resizing-left',
    );
  });
});

// ─── pixelsToDeltaDays ─────────────────────────────────────────────────

describe('pixelsToDeltaDays', () => {
  it('converts positive pixel delta', () => {
    expect(pixelsToDeltaDays(75, 25)).toBe(3);
  });

  it('converts negative pixel delta', () => {
    expect(pixelsToDeltaDays(-50, 25)).toBe(-2);
  });

  it('rounds to nearest integer', () => {
    expect(pixelsToDeltaDays(38, 25)).toBe(2); // 1.52 → 2
    expect(pixelsToDeltaDays(30, 25)).toBe(1); // 1.2 → 1
  });

  it('returns 0 for zero delta', () => {
    expect(pixelsToDeltaDays(0, 25)).toBe(0);
  });
});

// ─── computeEndDateForDrag ─────────────────────────────────────────────

describe('computeEndDateForDrag', () => {
  it('uses calendar days shift when working days disabled', () => {
    const result = computeEndDateForDrag(
      '2025-01-15',
      '2025-01-10',
      '2025-01-20',
      5,
      'task',
      disabledCtx,
    );
    // addDays('2025-01-20', 5) = '2025-01-25'
    expect(result).toBe('2025-01-25');
  });

  it('uses working days calculation when enabled', () => {
    computeEndDateForDrag(
      '2025-01-15',
      '2025-01-10',
      '2025-01-20',
      5,
      'task',
      enabledCtx,
    );
    expect(mockCalcWorkingDays).toHaveBeenCalledWith(
      '2025-01-10',
      '2025-01-20',
      enabledCtx.config,
      undefined,
    );
    expect(mockAddWorkingDays).toHaveBeenCalledWith(
      '2025-01-15',
      5,
      enabledCtx.config,
      undefined,
    );
  });

  it('skips working days for milestones even when enabled', () => {
    const result = computeEndDateForDrag(
      '2025-01-15',
      '2025-01-10',
      '2025-01-10',
      5,
      'milestone',
      enabledCtx,
    );
    // Falls through to calendar days: addDays('2025-01-10', 5) = '2025-01-15'
    expect(result).toBe('2025-01-15');
    expect(mockCalcWorkingDays).not.toHaveBeenCalled();
  });

  it('passes holiday region when configured', () => {
    const ctxWithHolidays: WorkingDaysContext = {
      enabled: true,
      config: { ...defaultConfig, excludeHolidays: true },
      holidayRegion: 'DE',
    };
    computeEndDateForDrag(
      '2025-01-15',
      '2025-01-10',
      '2025-01-20',
      5,
      'task',
      ctxWithHolidays,
    );
    expect(mockCalcWorkingDays).toHaveBeenCalledWith(
      '2025-01-10',
      '2025-01-20',
      ctxWithHolidays.config,
      'DE',
    );
  });
});

// ─── computeResizePreview ──────────────────────────────────────────────

describe('computeResizePreview', () => {
  const baseDrag: DragState = {
    mode: 'resizing-left',
    startX: 100,
    startMouseX: 200,
    originalStartDate: '2025-01-10',
    originalEndDate: '2025-01-20',
  };

  it('adjusts start date for resizing-left', () => {
    const result = computeResizePreview(baseDrag, 3);
    expect(result).toEqual({
      previewStart: '2025-01-13',
      previewEnd: '2025-01-20',
    });
  });

  it('returns null when resizing-left would make duration < 1', () => {
    // Moving start past end: deltaDays = 11 → new start = Jan 21, end = Jan 20 → duration 0
    const result = computeResizePreview(baseDrag, 11);
    expect(result).toBeNull();
  });

  it('adjusts end date for resizing-right', () => {
    const rightDrag: DragState = { ...baseDrag, mode: 'resizing-right' };
    const result = computeResizePreview(rightDrag, 5);
    expect(result).toEqual({
      previewStart: '2025-01-10',
      previewEnd: '2025-01-25',
    });
  });

  it('returns null when resizing-right would make duration < 1', () => {
    const rightDrag: DragState = { ...baseDrag, mode: 'resizing-right' };
    const result = computeResizePreview(rightDrag, -11);
    expect(result).toBeNull();
  });
});

// ─── calculateDeltaDaysFromDates ───────────────────────────────────────

describe('calculateDeltaDaysFromDates', () => {
  it('calculates positive delta (forward)', () => {
    expect(calculateDeltaDaysFromDates('2025-01-10', '2025-01-15')).toBe(5);
  });

  it('calculates negative delta (backward)', () => {
    expect(calculateDeltaDaysFromDates('2025-01-15', '2025-01-10')).toBe(-5);
  });

  it('returns 0 for same dates', () => {
    expect(calculateDeltaDaysFromDates('2025-01-10', '2025-01-10')).toBe(0);
  });
});

// ─── buildMoveUpdates ──────────────────────────────────────────────────

describe('buildMoveUpdates', () => {
  it('builds updates for regular tasks', () => {
    const t = createTask();
    const taskMap = new Map([[t.id, t]]);
    const updates = buildMoveUpdates([t.id], taskMap, 5, disabledCtx);

    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe(t.id);
    expect(updates[0].updates.startDate).toBe('2025-01-15');
    expect(updates[0].updates.endDate).toBe('2025-01-25');
    expect(updates[0].updates.duration).toBe(11);
  });

  it('builds milestone updates with duration 0', () => {
    const t = createTask({
      type: 'milestone',
      endDate: '2025-01-10',
      duration: 0,
    });
    const taskMap = new Map([[t.id, t]]);
    const updates = buildMoveUpdates([t.id], taskMap, 3, disabledCtx);

    expect(updates).toHaveLength(1);
    expect(updates[0].updates).toEqual({
      startDate: '2025-01-13',
      endDate: '2025-01-13',
      duration: 0,
    });
  });

  it('skips summary tasks', () => {
    const t = createTask({ type: 'summary' });
    const taskMap = new Map([[t.id, t]]);
    const updates = buildMoveUpdates([t.id], taskMap, 5, disabledCtx);

    expect(updates).toHaveLength(0);
  });

  it('skips tasks that fail validation', () => {
    mockValidate.mockReturnValue({ valid: false, error: 'bad' });
    const t = createTask();
    const taskMap = new Map([[t.id, t]]);
    const updates = buildMoveUpdates([t.id], taskMap, 5, disabledCtx);

    expect(updates).toHaveLength(0);
  });

  it('skips missing tasks (O(1) Map lookup)', () => {
    const taskMap = new Map<ReturnType<typeof toTaskId>, Task>();
    const updates = buildMoveUpdates(
      [toTaskId('nonexistent')],
      taskMap,
      5,
      disabledCtx,
    );

    expect(updates).toHaveLength(0);
  });

  it('uses working days when context is enabled', () => {
    const t = createTask();
    const taskMap = new Map([[t.id, t]]);
    buildMoveUpdates([t.id], taskMap, 5, enabledCtx);

    expect(mockCalcWorkingDays).toHaveBeenCalled();
    expect(mockAddWorkingDays).toHaveBeenCalled();
  });
});

// ─── buildResizeUpdate ─────────────────────────────────────────────────

describe('buildResizeUpdate', () => {
  it('returns update when dates changed', () => {
    const t = createTask();
    const result = buildResizeUpdate(t, '2025-01-12', '2025-01-20');
    expect(result).toEqual({
      startDate: '2025-01-12',
      endDate: '2025-01-20',
      duration: 9,
    });
  });

  it('returns null when dates are unchanged', () => {
    const t = createTask();
    const result = buildResizeUpdate(t, '2025-01-10', '2025-01-20');
    expect(result).toBeNull();
  });

  it('returns null when validation fails', () => {
    mockValidate.mockReturnValue({ valid: false, error: 'bad' });
    const t = createTask();
    const result = buildResizeUpdate(t, '2025-01-12', '2025-01-20');
    expect(result).toBeNull();
  });

  it('falls back to task dates when preview is undefined', () => {
    const t = createTask();
    const result = buildResizeUpdate(t, undefined, undefined);
    // Both fallback to task dates → no change → null
    expect(result).toBeNull();
  });

  it('handles partial undefined preview (start changed, end undefined)', () => {
    const t = createTask();
    const result = buildResizeUpdate(t, '2025-01-12', undefined);
    // endDate falls back to task.endDate ('2025-01-20')
    expect(result).toEqual({
      startDate: '2025-01-12',
      endDate: '2025-01-20',
      duration: 9,
    });
  });
});
