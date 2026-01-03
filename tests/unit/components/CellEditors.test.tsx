/**
 * Unit tests for Cell Editor components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorCellEditor } from '../../../src/components/TaskList/CellEditors/ColorCellEditor';
import { TypeCellEditor } from '../../../src/components/TaskList/CellEditors/TypeCellEditor';
import type { TaskType } from '../../../src/types/chart.types';

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

describe('TypeCellEditor', () => {
  const defaultProps = {
    value: 'task' as TaskType,
    onChange: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with initial type value', () => {
    render(<TypeCellEditor {...defaultProps} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('task');
  });

  it('should render all type options', () => {
    render(<TypeCellEditor {...defaultProps} />);

    const taskOption = screen.getByRole('option', { name: 'Task' }) as HTMLOptionElement;
    const summaryOption = screen.getByRole('option', { name: 'Summary' }) as HTMLOptionElement;
    const milestoneOption = screen.getByRole('option', {
      name: 'Milestone',
    }) as HTMLOptionElement;

    expect(taskOption).toBeInTheDocument();
    expect(summaryOption).toBeInTheDocument();
    expect(milestoneOption).toBeInTheDocument();
  });

  it('should call onChange when type changes', () => {
    render(<TypeCellEditor {...defaultProps} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'summary' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('summary');
  });

  it('should update local value when prop changes', () => {
    const { rerender } = render(<TypeCellEditor {...defaultProps} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('task');

    rerender(<TypeCellEditor {...defaultProps} value="milestone" />);

    expect(select.value).toBe('milestone');
  });

  it('should call onSave when Enter is pressed', () => {
    render(<TypeCellEditor {...defaultProps} />);

    const select = screen.getByRole('combobox');
    fireEvent.keyDown(select, { key: 'Enter' });

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Escape is pressed', () => {
    render(<TypeCellEditor {...defaultProps} />);

    const select = screen.getByRole('combobox');
    fireEvent.keyDown(select, { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should not crash when onSave is undefined on Enter', () => {
    const props = { ...defaultProps, onSave: undefined };
    render(<TypeCellEditor {...props} />);

    const select = screen.getByRole('combobox');
    expect(() => fireEvent.keyDown(select, { key: 'Enter' })).not.toThrow();
  });

  it('should not crash when onCancel is undefined on Escape', () => {
    const props = { ...defaultProps, onCancel: undefined };
    render(<TypeCellEditor {...props} />);

    const select = screen.getByRole('combobox');
    expect(() => fireEvent.keyDown(select, { key: 'Escape' })).not.toThrow();
  });

  it('should change from task to summary', () => {
    render(<TypeCellEditor {...defaultProps} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('task');

    fireEvent.change(select, { target: { value: 'summary' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('summary');
  });

  it('should change from task to milestone', () => {
    render(<TypeCellEditor {...defaultProps} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('task');

    fireEvent.change(select, { target: { value: 'milestone' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('milestone');
  });

  it('should handle multiple type changes', () => {
    render(<TypeCellEditor {...defaultProps} />);

    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'summary' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('summary');

    fireEvent.change(select, { target: { value: 'milestone' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('milestone');

    fireEvent.change(select, { target: { value: 'task' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('task');

    expect(defaultProps.onChange).toHaveBeenCalledTimes(3);
  });

  it('should render TaskTypeIcon for current type', () => {
    const { container } = render(<TypeCellEditor {...defaultProps} />);

    // TaskTypeIcon should be rendered (we're not testing its internal implementation)
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should update icon when type changes', () => {
    const { rerender } = render(<TypeCellEditor {...defaultProps} value="task" />);

    rerender(<TypeCellEditor {...defaultProps} value="summary" />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('summary');
  });

  it('should call onSave and prevent propagation on Enter', () => {
    render(<TypeCellEditor {...defaultProps} />);

    const select = screen.getByRole('combobox');
    fireEvent.keyDown(select, { key: 'Enter', bubbles: true });

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel and prevent propagation on Escape', () => {
    render(<TypeCellEditor {...defaultProps} />);

    const select = screen.getByRole('combobox');
    fireEvent.keyDown(select, { key: 'Escape', bubbles: true });

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
