/**
 * Unit tests for Cell Editor components
 * Updated for popover-based ColorCellEditor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ColorCellEditor } from '../../../src/components/TaskList/CellEditors/ColorCellEditor';

// Mock the Zustand stores used by ColorPickerPopover
vi.mock('../../../src/store/slices/taskSlice', () => ({
  useTaskStore: vi.fn(() => []),
}));

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

  it('should render with color swatch button', () => {
    render(<ColorCellEditor {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Open color picker' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveStyle({ backgroundColor: '#3b82f6' });
  });

  it('should open popover on mount', async () => {
    render(<ColorCellEditor {...defaultProps} />);

    // Popover opens automatically on mount
    await waitFor(() => {
      expect(screen.getByText('Choose Color')).toBeInTheDocument();
    });
  });

  it('should show current color in popover preview', async () => {
    render(<ColorCellEditor {...defaultProps} />);

    await waitFor(() => {
      // The popover shows the color hex value in uppercase
      expect(screen.getByText('#3B82F6')).toBeInTheDocument();
    });
  });

  it('should call onCancel when Escape is pressed on trigger', () => {
    render(<ColorCellEditor {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Open color picker' });
    fireEvent.keyDown(button, { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should not crash when onCancel is undefined on Escape', () => {
    const props = { ...defaultProps, onCancel: undefined };
    render(<ColorCellEditor {...props} />);

    const button = screen.getByRole('button', { name: 'Open color picker' });
    expect(() => fireEvent.keyDown(button, { key: 'Escape' })).not.toThrow();
  });

  it('should call onSave when popover closes', async () => {
    render(<ColorCellEditor {...defaultProps} />);

    // Wait for popover to open
    await waitFor(() => {
      expect(screen.getByText('Choose Color')).toBeInTheDocument();
    });

    // Click the close button in the popover
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('should apply custom height prop', () => {
    render(<ColorCellEditor {...defaultProps} height={40} />);

    const button = screen.getByRole('button', { name: 'Open color picker' });
    expect(button).toHaveStyle({ height: '40px' });
  });

  it('should show native color picker in popover', async () => {
    render(<ColorCellEditor {...defaultProps} />);

    await waitFor(() => {
      const nativePicker = screen.getByTitle('Pick custom color');
      expect(nativePicker).toBeInTheDocument();
      expect(nativePicker).toHaveAttribute('type', 'color');
    });
  });

  it('should call onChange when selecting from native picker', async () => {
    render(<ColorCellEditor {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTitle('Pick custom color')).toBeInTheDocument();
    });

    const nativePicker = screen.getByTitle('Pick custom color');
    fireEvent.change(nativePicker, { target: { value: '#ff0000' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('#ff0000');
  });
});
