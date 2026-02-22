/**
 * Unit tests for ColorPickerPopover component
 *
 * Tests: rendering, keyboard navigation, color selection,
 * reset button visibility, native picker, focus management,
 * focus trapping, and viewport-aware positioning.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPickerPopover } from '../../../src/components/TaskList/CellEditors/ColorPickerPopover';
import { useTaskStore } from '../../../src/store/slices/taskSlice';

// Mock Zustand store used by useProjectColors
vi.mock('../../../src/store/slices/taskSlice', () => ({
  useTaskStore: vi.fn((selector: (state: { tasks: unknown[] }) => unknown) =>
    selector({ tasks: [] })
  ),
}));

describe('ColorPickerPopover', () => {
  const defaultProps = {
    value: '#3b82f6',
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    it('should render with role="dialog", aria-modal, and aria-label', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-label', 'Color picker');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should display the header text', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      expect(screen.getByText('Choose Color')).toBeInTheDocument();
    });

    it('should show close button with aria-label', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const closeBtn = screen.getByRole('button', { name: 'Close' });
      expect(closeBtn).toBeInTheDocument();
    });

    it('should display current color hex value in uppercase', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      expect(screen.getByText('#3B82F6')).toBeInTheDocument();
    });

    it('should show "Current color" label in manual mode', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      expect(screen.getByText('Current color')).toBeInTheDocument();
    });

    it('should render all curated swatch categories', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      expect(screen.getByText('Blues')).toBeInTheDocument();
      expect(screen.getByText('Greens')).toBeInTheDocument();
      expect(screen.getByText('Warm')).toBeInTheDocument();
      expect(screen.getByText('Neutral')).toBeInTheDocument();
    });

    it('should render custom color section', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      expect(screen.getByText('Custom Color')).toBeInTheDocument();
      expect(screen.getByTitle('Pick custom color')).toBeInTheDocument();
      expect(screen.getByText('Choose custom color...')).toBeInTheDocument();
    });

    it('should render swatch buttons with aria-label for screen readers', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      // Blues category swatch
      const swatch = screen.getByTitle('#0F6CBD');
      expect(swatch).toHaveAttribute('aria-label', 'Select color #0F6CBD');
    });

    it('should render native color input with correct value', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const nativePicker = screen.getByTitle('Pick custom color');
      expect(nativePicker).toHaveAttribute('type', 'color');
      expect(nativePicker).toHaveValue('#3b82f6');
    });
  });

  // ---------------------------------------------------------------------------
  // Focus management
  // ---------------------------------------------------------------------------

  describe('focus management', () => {
    it('should focus the dialog on mount', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveFocus();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard navigation
  // ---------------------------------------------------------------------------

  describe('keyboard navigation', () => {
    it('should call onClose when Escape is pressed', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose for other keys', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Enter' });
      fireEvent.keyDown(dialog, { key: 'Tab' });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Focus trapping
  // ---------------------------------------------------------------------------

  describe('focus trapping', () => {
    it('should wrap focus from last element to first on Tab', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      const lastFocusable = focusable[focusable.length - 1];

      // Focus the last focusable element
      lastFocusable.focus();
      expect(lastFocusable).toHaveFocus();

      // Press Tab — should wrap to first
      fireEvent.keyDown(dialog, { key: 'Tab' });
      expect(focusable[0]).toHaveFocus();
    });

    it('should wrap focus from first element to last on Shift+Tab', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      // Focus the first focusable element
      firstFocusable.focus();
      expect(firstFocusable).toHaveFocus();

      // Press Shift+Tab — should wrap to last
      fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
      expect(lastFocusable).toHaveFocus();
    });

    it('should wrap focus from dialog container to last on Shift+Tab', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      const lastFocusable = focusable[focusable.length - 1];

      // Dialog container is focused on mount
      expect(dialog).toHaveFocus();

      // Press Shift+Tab — should wrap to last focusable
      fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
      expect(lastFocusable).toHaveFocus();
    });
  });

  // ---------------------------------------------------------------------------
  // Close button
  // ---------------------------------------------------------------------------

  describe('close button', () => {
    it('should call onClose when close button is clicked', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const closeBtn = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeBtn);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Click outside
  // ---------------------------------------------------------------------------

  describe('click outside', () => {
    it('should call onClose when clicking outside the popover', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      fireEvent.mouseDown(document.body);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when clicking inside the popover', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.mouseDown(dialog);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Color selection
  // ---------------------------------------------------------------------------

  describe('color selection', () => {
    it('should call onSelect and onClose when a swatch is clicked', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      // Click a swatch from the Blues category (#0F6CBD)
      const swatch = screen.getByTitle('#0F6CBD');
      fireEvent.click(swatch);

      expect(defaultProps.onSelect).toHaveBeenCalledWith('#0F6CBD');
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when native picker value changes', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const nativePicker = screen.getByTitle('Pick custom color');
      fireEvent.change(nativePicker, { target: { value: '#ff0000' } });

      expect(defaultProps.onSelect).toHaveBeenCalledWith('#ff0000');
    });

    it('should not call onClose when native picker changes (keeps popover open)', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const nativePicker = screen.getByTitle('Pick custom color');
      fireEvent.change(nativePicker, { target: { value: '#ff0000' } });

      // onClose is NOT called for native picker — user may want to keep adjusting
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should trigger native picker when "Choose custom color..." button is clicked', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const nativePicker = screen.getByTitle('Pick custom color') as HTMLInputElement;
      const clickSpy = vi.spyOn(nativePicker, 'click');

      const triggerButton = screen.getByText('Choose custom color...');
      fireEvent.click(triggerButton);

      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Reset button
  // ---------------------------------------------------------------------------

  describe('reset button', () => {
    it('should not show reset button in manual mode', () => {
      render(
        <ColorPickerPopover
          {...defaultProps}
          colorMode="manual"
          hasOverride={true}
          onResetOverride={vi.fn()}
        />
      );

      expect(screen.queryByTitle('Reset to automatic color')).not.toBeInTheDocument();
    });

    it('should not show reset button when no override exists', () => {
      render(
        <ColorPickerPopover
          {...defaultProps}
          colorMode="theme"
          hasOverride={false}
          onResetOverride={vi.fn()}
        />
      );

      expect(screen.queryByTitle('Reset to automatic color')).not.toBeInTheDocument();
    });

    it('should not show reset button when onResetOverride is undefined', () => {
      render(
        <ColorPickerPopover
          {...defaultProps}
          colorMode="theme"
          hasOverride={true}
        />
      );

      expect(screen.queryByTitle('Reset to automatic color')).not.toBeInTheDocument();
    });

    it('should show reset button when auto mode + override + handler provided', () => {
      render(
        <ColorPickerPopover
          {...defaultProps}
          colorMode="theme"
          hasOverride={true}
          onResetOverride={vi.fn()}
        />
      );

      expect(screen.getByTitle('Reset to automatic color')).toBeInTheDocument();
      expect(screen.getByText('Manual override')).toBeInTheDocument();
    });

    it('should call onResetOverride and onClose when reset is clicked', () => {
      const onResetOverride = vi.fn();
      render(
        <ColorPickerPopover
          {...defaultProps}
          colorMode="theme"
          hasOverride={true}
          onResetOverride={onResetOverride}
        />
      );

      const resetBtn = screen.getByTitle('Reset to automatic color');
      fireEvent.click(resetBtn);

      expect(onResetOverride).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Positioning
  // ---------------------------------------------------------------------------

  describe('positioning', () => {
    it('should center when no anchorRect is provided', () => {
      render(<ColorPickerPopover {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.style.top).toBe('50%');
      expect(dialog.style.left).toBe('50%');
      expect(dialog.style.transform).toBe('translate(-50%, -50%)');
    });

    it('should position below anchor when enough space', () => {
      const anchorRect = {
        top: 100,
        bottom: 130,
        left: 200,
        right: 300,
        width: 100,
        height: 30,
        x: 200,
        y: 100,
        toJSON: vi.fn(),
      } as DOMRect;

      // Mock viewport with plenty of space below
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

      render(<ColorPickerPopover {...defaultProps} anchorRect={anchorRect} />);

      const dialog = screen.getByRole('dialog');
      // top = anchorRect.bottom + gap (4)
      expect(dialog.style.top).toBe('134px');
    });

    it('should flip above anchor when not enough space below', () => {
      const anchorRect = {
        top: 600,
        bottom: 630,
        left: 200,
        right: 300,
        width: 100,
        height: 30,
        x: 200,
        y: 600,
        toJSON: vi.fn(),
      } as DOMRect;

      // Mock viewport with little space below
      Object.defineProperty(window, 'innerHeight', { value: 700, writable: true });
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

      render(<ColorPickerPopover {...defaultProps} anchorRect={anchorRect} />);

      const dialog = screen.getByRole('dialog');
      // bottom = innerHeight - anchorRect.top + gap (4)
      expect(dialog.style.bottom).toBe('104px');
    });

    it('should constrain horizontal position within viewport', () => {
      const anchorRect = {
        top: 100,
        bottom: 130,
        left: 1100,
        right: 1200,
        width: 100,
        height: 30,
        x: 1100,
        y: 100,
        toJSON: vi.fn(),
      } as DOMRect;

      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

      render(<ColorPickerPopover {...defaultProps} anchorRect={anchorRect} />);

      const dialog = screen.getByRole('dialog');
      // left = Math.min(Math.max(8, 1100), 1200 - 280 - 8) = Math.min(1100, 912) = 912
      expect(dialog.style.left).toBe('912px');
    });
  });

  // ---------------------------------------------------------------------------
  // Selected swatch highlight
  // ---------------------------------------------------------------------------

  describe('swatch selection', () => {
    it('should mark matching swatch as selected (case-insensitive)', () => {
      // #0F6CBD is in the blues category
      render(<ColorPickerPopover {...defaultProps} value="#0f6cbd" />);

      const swatch = screen.getByTitle('#0F6CBD');
      // Selected swatches have a 2px solid brand border
      expect(swatch.style.border).toContain('2px solid');
    });
  });

  // ---------------------------------------------------------------------------
  // Project colors
  // ---------------------------------------------------------------------------

  describe('project colors', () => {
    function mockTasksWithColors(colors: string[]): void {
      vi.mocked(useTaskStore).mockImplementation(
        (selector: (state: { tasks: { color: string }[] }) => unknown) =>
          selector({ tasks: colors.map((color) => ({ color })) })
      );
    }

    afterEach(() => {
      // Restore default mock (empty tasks) so other tests are unaffected
      vi.mocked(useTaskStore).mockImplementation(
        (selector: (state: { tasks: unknown[] }) => unknown) =>
          selector({ tasks: [] })
      );
    });

    it('should render project colors section when tasks have colors', () => {
      mockTasksWithColors(['#FF0000', '#00FF00', '#0000FF']);

      render(<ColorPickerPopover {...defaultProps} />);

      expect(screen.getByText('Project Colors')).toBeInTheDocument();
      // useProjectColors normalizes to uppercase
      expect(screen.getByTitle('#FF0000')).toBeInTheDocument();
      expect(screen.getByTitle('#00FF00')).toBeInTheDocument();
      expect(screen.getByTitle('#0000FF')).toBeInTheDocument();
    });

    it('should allow selecting a project color', () => {
      mockTasksWithColors(['#FF0000', '#00FF00']);

      render(<ColorPickerPopover {...defaultProps} />);

      const swatch = screen.getByTitle('#FF0000');
      fireEvent.click(swatch);

      expect(defaultProps.onSelect).toHaveBeenCalledWith('#FF0000');
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
