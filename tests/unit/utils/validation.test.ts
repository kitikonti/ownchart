import { describe, it, expect } from 'vitest';
import {
  validateTaskName,
  validateDateString,
  validateColor,
  validateDuration,
  validateProgress,
  validateTask,
} from '../../../src/utils/validation';

describe('validateTaskName', () => {
  it('should accept valid task names', () => {
    expect(validateTaskName('Task 1')).toEqual({ valid: true });
    expect(validateTaskName('A')).toEqual({ valid: true });
    expect(validateTaskName('a'.repeat(200))).toEqual({ valid: true });
  });

  it('should reject empty names', () => {
    const result = validateTaskName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Task name is required');
  });

  it('should reject whitespace-only names', () => {
    const result = validateTaskName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Task name is required');
  });

  it('should reject names longer than 200 characters', () => {
    const result = validateTaskName('a'.repeat(201));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Task name must be 200 characters or less');
  });
});

describe('validateDateString', () => {
  it('should accept valid ISO dates', () => {
    expect(validateDateString('2025-12-18')).toEqual({ valid: true });
    expect(validateDateString('2025-01-01')).toEqual({ valid: true });
    expect(validateDateString('2025-12-31')).toEqual({ valid: true });
  });

  it('should reject empty dates', () => {
    const result = validateDateString('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Date is required');
  });

  it('should reject non-ISO format dates', () => {
    const result = validateDateString('12/18/2025');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Date must be in ISO format (YYYY-MM-DD)');
  });

  it('should reject invalid dates', () => {
    const result = validateDateString('2025-02-30');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid date');
  });

  it('should reject malformed dates', () => {
    const result = validateDateString('not-a-date');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Date must be in ISO format (YYYY-MM-DD)');
  });

  it('should handle leap years correctly', () => {
    expect(validateDateString('2024-02-29')).toEqual({ valid: true });
    const result = validateDateString('2025-02-29');
    expect(result.valid).toBe(false);
  });
});

describe('validateColor', () => {
  it('should accept valid hex colors', () => {
    expect(validateColor('#3b82f6')).toEqual({ valid: true });
    expect(validateColor('#000')).toEqual({ valid: true });
    expect(validateColor('#FFF')).toEqual({ valid: true });
    expect(validateColor('#AbCdEf')).toEqual({ valid: true });
  });

  it('should reject empty colors', () => {
    const result = validateColor('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Color is required');
  });

  it('should reject invalid hex colors', () => {
    const result = validateColor('not-a-color');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Color must be a valid hex code (#RRGGBB or #RGB)');
  });

  it('should reject colors without hash', () => {
    const result = validateColor('3b82f6');
    expect(result.valid).toBe(false);
  });
});

describe('validateProgress', () => {
  it('should accept valid progress values', () => {
    expect(validateProgress(0)).toEqual({ valid: true });
    expect(validateProgress(50)).toEqual({ valid: true });
    expect(validateProgress(100)).toEqual({ valid: true });
  });

  it('should reject negative values', () => {
    const result = validateProgress(-1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Progress must be between 0 and 100');
  });

  it('should reject values over 100', () => {
    const result = validateProgress(101);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Progress must be between 0 and 100');
  });

  it('should reject non-number values', () => {
    const result = validateProgress(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Progress must be a number');
  });
});

describe('validateDuration', () => {
  it('should accept valid duration values', () => {
    expect(validateDuration(1)).toEqual({ valid: true });
    expect(validateDuration(5)).toEqual({ valid: true });
    expect(validateDuration(365)).toEqual({ valid: true });
  });

  it('should reject values less than 1', () => {
    const result = validateDuration(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Duration must be at least 1 day');
  });

  it('should reject negative values', () => {
    const result = validateDuration(-5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Duration must be at least 1 day');
  });

  it('should reject non-number values', () => {
    const result = validateDuration(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Duration must be a number');
  });
});

describe('validateTask', () => {
  it('should accept valid task data', () => {
    const task = {
      name: 'Task 1',
      startDate: '2025-12-18',
      endDate: '2025-12-25',
      progress: 50,
      color: '#3b82f6',
    };
    expect(validateTask(task)).toEqual({ valid: true });
  });

  it('should reject invalid task name', () => {
    const task = { name: '' };
    const result = validateTask(task);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Task name is required');
  });

  it('should reject invalid start date', () => {
    const task = { startDate: 'invalid-date' };
    const result = validateTask(task);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Start date');
  });

  it('should reject invalid end date', () => {
    const task = { endDate: 'invalid-date' };
    const result = validateTask(task);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('End date');
  });

  it('should reject end date before start date', () => {
    const task = {
      startDate: '2025-12-25',
      endDate: '2025-12-18',
    };
    const result = validateTask(task);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('End date must be greater than or equal to start date');
  });

  it('should accept end date equal to start date', () => {
    const task = {
      startDate: '2025-12-18',
      endDate: '2025-12-18',
    };
    expect(validateTask(task)).toEqual({ valid: true });
  });

  it('should reject invalid progress', () => {
    const task = { progress: 150 };
    const result = validateTask(task);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Progress must be between 0 and 100');
  });

  it('should reject invalid color', () => {
    const task = { color: 'not-a-color' };
    const result = validateTask(task);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('hex code');
  });

  it('should validate partial task objects', () => {
    expect(validateTask({ name: 'Task 1' })).toEqual({ valid: true });
    expect(validateTask({ startDate: '2025-12-18' })).toEqual({ valid: true });
    expect(validateTask({})).toEqual({ valid: true });
  });

  it('should validate complete task with all fields', () => {
    const task = {
      name: 'Complete Task',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      progress: 75,
      color: '#ff0000',
    };
    expect(validateTask(task)).toEqual({ valid: true });
  });
});
