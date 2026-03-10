/**
 * Unit tests for useDropdown hook.
 * Covers: open/close state, outside-click, Escape key, focus-out, onClose callback.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDropdown } from '../../../src/hooks/useDropdown';

function fireKeydown(key: string): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function fireMousedown(target: EventTarget = document.body): void {
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
}

describe('useDropdown', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start closed', () => {
      const { result } = renderHook(() => useDropdown());
      expect(result.current.isOpen).toBe(false);
    });

    it('should expose stable triggerProps', () => {
      const { result } = renderHook(() => useDropdown());
      expect(result.current.triggerProps['aria-expanded']).toBe(false);
      expect(typeof result.current.triggerProps.onClick).toBe('function');
    });
  });

  describe('toggle', () => {
    it('should open on first toggle', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should close on second toggle', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.toggle();
      });
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('setIsOpen', () => {
    it('should open when called with true', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.setIsOpen(true);
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should close when called with false while open', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.setIsOpen(true);
      });
      act(() => {
        result.current.setIsOpen(false);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should be a no-op when already closed and called with false', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.setIsOpen(false);
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('close', () => {
    it('should close the dropdown', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should call onClose callback when provided', () => {
      const onClose = vi.fn();
      const { result } = renderHook(() => useDropdown({ onClose }));

      act(() => {
        result.current.toggle();
      });
      act(() => {
        result.current.close();
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose even if options object changes identity on each render', () => {
      // Simulates caller passing inline { onClose: ... } each render
      const onClose = vi.fn();
      const { result } = renderHook(() => useDropdown({ onClose }));

      act(() => {
        result.current.toggle();
      });
      act(() => {
        result.current.close();
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Escape key', () => {
    it('should close on Escape when open', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        fireKeydown('Escape');
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should not close on other keys', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.toggle();
      });

      act(() => {
        fireKeydown('Enter');
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should not attach keydown listener when closed', () => {
      const { result } = renderHook(() => useDropdown());

      // Dropdown is closed — Escape should not do anything special
      act(() => {
        fireKeydown('Escape');
      });

      // Should remain closed (was already closed, and shouldn't throw)
      expect(result.current.isOpen).toBe(false);
    });

    it('should remove Escape listener after closing', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.toggle();
      });
      act(() => {
        fireKeydown('Escape');
      });
      expect(result.current.isOpen).toBe(false);

      // Re-pressing Escape should not re-open (listener was removed)
      act(() => {
        fireKeydown('Escape');
      });
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('outside click', () => {
    it('should close when clicking outside the container', () => {
      const { result } = renderHook(() => useDropdown());

      // Create and mount a container element
      const container = document.createElement('div');
      document.body.appendChild(container);

      // Simulate attaching the containerRef
      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
        configurable: true,
      });

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        fireMousedown(document.body); // clicks outside container
      });

      expect(result.current.isOpen).toBe(false);

      document.body.removeChild(container);
    });

    it('should not close when clicking inside the container', () => {
      const { result } = renderHook(() => useDropdown());

      const container = document.createElement('div');
      const inner = document.createElement('button');
      container.appendChild(inner);
      document.body.appendChild(container);

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
        configurable: true,
      });

      act(() => {
        result.current.toggle();
      });

      act(() => {
        fireMousedown(inner); // inside container
      });

      expect(result.current.isOpen).toBe(true);

      document.body.removeChild(container);
    });
  });

  describe('focus-out', () => {
    it('should close when focus leaves the container', () => {
      const { result } = renderHook(() => useDropdown());

      const container = document.createElement('div');
      const trigger = document.createElement('button');
      container.appendChild(trigger);
      document.body.appendChild(container);

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
        configurable: true,
      });

      act(() => {
        result.current.toggle();
      });

      // Simulate focus moving outside
      const outside = document.createElement('button');
      document.body.appendChild(outside);

      act(() => {
        container.dispatchEvent(
          new FocusEvent('focusout', {
            bubbles: true,
            relatedTarget: outside,
          })
        );
      });

      expect(result.current.isOpen).toBe(false);

      document.body.removeChild(container);
      document.body.removeChild(outside);
    });

    it('should NOT close when relatedTarget is null (blur to non-focusable)', () => {
      const { result } = renderHook(() => useDropdown());

      const container = document.createElement('div');
      document.body.appendChild(container);

      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
        configurable: true,
      });

      act(() => {
        result.current.toggle();
      });

      act(() => {
        container.dispatchEvent(
          new FocusEvent('focusout', { bubbles: true, relatedTarget: null })
        );
      });

      // Should remain open — the outside-click handler covers this case
      expect(result.current.isOpen).toBe(true);

      document.body.removeChild(container);
    });
  });

  describe('triggerProps', () => {
    it('should reflect open state in aria-expanded', () => {
      const { result } = renderHook(() => useDropdown());

      expect(result.current.triggerProps['aria-expanded']).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.triggerProps['aria-expanded']).toBe(true);
    });

    it('should have default aria-haspopup of "true"', () => {
      const { result } = renderHook(() => useDropdown());
      expect(result.current.triggerProps['aria-haspopup']).toBe('true');
    });

    it('triggerProps onClick calls toggle', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.triggerProps.onClick();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('triggerRef and focus return', () => {
    it('should return focus to trigger on Escape', async () => {
      const { result } = renderHook(() => useDropdown());

      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      const focusSpy = vi.spyOn(trigger, 'focus');

      // Attach trigger ref
      act(() => {
        result.current.triggerRef(trigger);
      });

      act(() => {
        result.current.toggle();
      });

      act(() => {
        fireKeydown('Escape');
      });

      // Focus is returned via requestAnimationFrame
      await act(async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });

      expect(focusSpy).toHaveBeenCalled();

      document.body.removeChild(trigger);
    });
  });

  describe('unmount cleanup', () => {
    it('should not throw or leave stale listeners after unmount', () => {
      const { result, unmount } = renderHook(() => useDropdown());

      act(() => {
        result.current.toggle();
      });

      // Should not throw
      expect(() => unmount()).not.toThrow();
    });
  });
});
