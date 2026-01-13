import '@testing-library/jest-dom';
import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// Clear localStorage before each test to prevent state pollution
beforeEach(() => {
  localStorage.clear();
});

// Make expect available globally
globalThis.expect = expect;

// Mock ResizeObserver (Sprint 1.2 Package 3 - needed for ChartCanvas)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLCanvasElement.getContext for text measurement in jsdom
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType: string) => {
  if (contextType === '2d') {
    let currentFont = '12px sans-serif';
    return {
      get font() { return currentFont; },
      set font(value: string) { currentFont = value; },
      measureText: vi.fn().mockImplementation((text: string) => {
        // Extract font size from current font string (e.g., "16px Inter")
        const fontSizeMatch = currentFont.match(/(\d+)px/);
        const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 12;
        // Approximate width: 0.6 * fontSize per character
        return { width: text.length * fontSize * 0.6 };
      }),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ data: [] }),
      putImageData: vi.fn(),
      createImageData: vi.fn().mockReturnValue([]),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      clip: vi.fn(),
    };
  }
  return null;
});
