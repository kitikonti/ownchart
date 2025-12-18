import { describe, it, expect } from 'vitest';
import { validateTaskName, validateDateString } from '../../../src/utils/validation';

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
