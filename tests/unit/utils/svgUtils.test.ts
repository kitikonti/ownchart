/**
 * Unit tests for svgUtils
 */

import { describe, it, expect, vi } from 'vitest';
import { getSVGPoint } from '../../../src/utils/svgUtils';

describe('getSVGPoint', () => {
  function createMockSVG(ctm: DOMMatrix | null): SVGSVGElement {
    const mockPoint = {
      x: 0,
      y: 0,
      matrixTransform(matrix: DOMMatrix): DOMPoint {
        return { x: this.x * matrix.a + matrix.e, y: this.y * matrix.d + matrix.f } as DOMPoint;
      },
    };

    return {
      createSVGPoint: vi.fn(() => mockPoint),
      getScreenCTM: vi.fn(() => ctm),
    } as unknown as SVGSVGElement;
  }

  it('converts client coordinates to SVG coordinates using screen CTM', () => {
    // Create a CTM that represents a 2x scale + 50px translate
    const ctm = {
      a: 2, b: 0, c: 0, d: 2, e: 50, f: 100,
      inverse() {
        // Inverse of scale(2) translate(50,100) = scale(0.5) translate(-25,-50)
        return { a: 0.5, b: 0, c: 0, d: 0.5, e: -25, f: -50 } as DOMMatrix;
      },
    } as DOMMatrix;

    const svg = createMockSVG(ctm);
    const event = { clientX: 200, clientY: 300 } as MouseEvent;

    const result = getSVGPoint(event, svg);

    expect(svg.createSVGPoint).toHaveBeenCalled();
    expect(svg.getScreenCTM).toHaveBeenCalled();
    // The mock point gets clientX/clientY set, then matrixTransform with inverse CTM
    // x = 200 * 0.5 + (-25) = 75
    // y = 300 * 0.5 + (-50) = 100
    expect(result.x).toBe(75);
    expect(result.y).toBe(100);
  });

  it('falls back to clientX/clientY when getScreenCTM returns null', () => {
    const svg = createMockSVG(null);
    const event = { clientX: 150, clientY: 250 } as MouseEvent;

    const result = getSVGPoint(event, svg);

    expect(result.x).toBe(150);
    expect(result.y).toBe(250);
  });
});
