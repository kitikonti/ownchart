/**
 * Unit tests for Cell Editor components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorCellEditor } from '../../../src/components/TaskList/CellEditors/ColorCellEditor';

describe('ColorCellEditor', () => {
  const defaultProps = {
    value: '#3b82f6',
    onChange: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with initial color value', () => {
    render(<ColorCellEditor {...defaultProps} />);

    const input = screen.getByTitle('Choose color') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('color');
    expect(input.value).toBe('#3b82f6');
  });

  it('should call onChange when color changes', () => {
    render(<ColorCellEditor {...defaultProps} />);

    const input = screen.getByTitle('Choose color') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '#ff0000' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('#ff0000');
  });

  it('should update local value when prop changes', () => {
    const { rerender } = render(<ColorCellEditor {...defaultProps} />);

    const input = screen.getByTitle('Choose color') as HTMLInputElement;
    expect(input.value).toBe('#3b82f6');

    rerender(<ColorCellEditor {...defaultProps} value="#00ff00" />);

    expect(input.value).toBe('#00ff00');
  });

  it('should call onSave when Enter is pressed', () => {
    render(<ColorCellEditor {...defaultProps} />);

    const input = screen.getByTitle('Choose color');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Escape is pressed', () => {
    render(<ColorCellEditor {...defaultProps} />);

    const input = screen.getByTitle('Choose color');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onSave on blur', () => {
    render(<ColorCellEditor {...defaultProps} />);

    const input = screen.getByTitle('Choose color');
    fireEvent.blur(input);

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('should not crash when onSave is undefined on Enter', () => {
    const props = { ...defaultProps, onSave: undefined };
    render(<ColorCellEditor {...props} />);

    const input = screen.getByTitle('Choose color');
    expect(() => fireEvent.keyDown(input, { key: 'Enter' })).not.toThrow();
  });

  it('should not crash when onCancel is undefined on Escape', () => {
    const props = { ...defaultProps, onCancel: undefined };
    render(<ColorCellEditor {...props} />);

    const input = screen.getByTitle('Choose color');
    expect(() => fireEvent.keyDown(input, { key: 'Escape' })).not.toThrow();
  });

  it('should not crash when onSave is undefined on blur', () => {
    const props = { ...defaultProps, onSave: undefined };
    render(<ColorCellEditor {...props} />);

    const input = screen.getByTitle('Choose color');
    expect(() => fireEvent.blur(input)).not.toThrow();
  });

  it('should handle multiple color changes', () => {
    render(<ColorCellEditor {...defaultProps} />);

    const input = screen.getByTitle('Choose color') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '#ff0000' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('#ff0000');

    fireEvent.change(input, { target: { value: '#00ff00' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('#00ff00');

    fireEvent.change(input, { target: { value: '#0000ff' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('#0000ff');

    expect(defaultProps.onChange).toHaveBeenCalledTimes(3);
  });
});
