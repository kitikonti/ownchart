import { describe, it, expect } from 'vitest';
import {
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_WIDTH_PRESETS,
  INITIAL_EXPORT_STATE,
} from '../../../../src/utils/export/types';

describe('EXPORT_WIDTH_PRESETS', () => {
  it('should have correct preset values', () => {
    expect(EXPORT_WIDTH_PRESETS.HD).toBe(1280);
    expect(EXPORT_WIDTH_PRESETS.FULL_HD).toBe(1920);
    expect(EXPORT_WIDTH_PRESETS.QHD).toBe(2560);
    expect(EXPORT_WIDTH_PRESETS['4K']).toBe(3840);
  });

  it('should have all required presets', () => {
    expect(Object.keys(EXPORT_WIDTH_PRESETS)).toHaveLength(4);
  });
});

describe('DEFAULT_EXPORT_OPTIONS', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_EXPORT_OPTIONS.width).toBe(1920);
    expect(DEFAULT_EXPORT_OPTIONS.includeTaskList).toBe(true);
    expect(DEFAULT_EXPORT_OPTIONS.includeHeader).toBe(true);
    expect(DEFAULT_EXPORT_OPTIONS.background).toBe('white');
  });

  it('should default to Full HD width', () => {
    expect(DEFAULT_EXPORT_OPTIONS.width).toBe(EXPORT_WIDTH_PRESETS.FULL_HD);
  });
});

describe('INITIAL_EXPORT_STATE', () => {
  it('should have correct initial state', () => {
    expect(INITIAL_EXPORT_STATE.isExporting).toBe(false);
    expect(INITIAL_EXPORT_STATE.progress).toBe(0);
    expect(INITIAL_EXPORT_STATE.error).toBeNull();
  });
});
