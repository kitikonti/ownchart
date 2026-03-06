import '@testing-library/jest-dom';
import { expect, afterEach, beforeEach, vi } from 'vitest';

// ─── Geometry API polyfills ────────────────────────────────────────────────────
// jsdom does not implement DOMMatrix or DOMPoint. Provide minimal but correct
// 2D affine-transform polyfills so geometry utilities can be tested without a
// real browser. Only installed when the API is missing.

if (typeof globalThis.DOMMatrix === 'undefined') {
  class DOMMatrixImpl {
    a: number; b: number; c: number; d: number; e: number; f: number;
    constructor(init?: number[]) {
      const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = init ?? [];
      this.a = a; this.b = b; this.c = c; this.d = d; this.e = e; this.f = f;
    }
    inverse(): DOMMatrixImpl {
      const det = this.a * this.d - this.b * this.c;
      return new DOMMatrixImpl([
        this.d / det,         -this.b / det,
        -this.c / det,         this.a / det,
        (this.c * this.f - this.d * this.e) / det,
        (this.b * this.e - this.a * this.f) / det,
      ]);
    }
  }
  (globalThis as Record<string, unknown>).DOMMatrix = DOMMatrixImpl;
}

if (typeof globalThis.DOMPoint === 'undefined') {
  class DOMPointImpl {
    x: number; y: number; z: number; w: number;
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x; this.y = y; this.z = z; this.w = w;
    }
    matrixTransform(m: { a: number; b: number; c: number; d: number; e: number; f: number }): DOMPointImpl {
      return new DOMPointImpl(
        m.a * this.x + m.c * this.y + m.e,
        m.b * this.x + m.d * this.y + m.f,
      );
    }
  }
  (globalThis as Record<string, unknown>).DOMPoint = DOMPointImpl;
}
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

// Mock matchMedia (needed for useDeviceDetection and other media query hooks)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (Sprint 1.2 Package 3 - needed for ChartCanvas)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLCanvasElement.getContext for text measurement in jsdom
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType: string): unknown => {
  if (contextType === '2d') {
    let currentFont = '12px sans-serif';
    return {
      get font(): string { return currentFont; },
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
