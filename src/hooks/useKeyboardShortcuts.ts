/**
 * Global keyboard shortcuts hook
 * Handles Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo alternative)
 */

import { useEffect } from 'react';
import { useHistoryStore } from '../store/slices/historySlice';

export function useKeyboardShortcuts() {
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ignore if typing in input/textarea or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z (without Shift)
      if (modKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Cmd+Shift+Z
      if (modKey && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Y (alternative)
      if (modKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);
}
