/**
 * Unit tests for svgUtils
 */

import { describe, it, expect, vi } from 'vitest';
import { getSVGPoint } from '../../../src/utils/svgUtils';

describe('getSVGPoint', () => {
  function createMockSVG(ctm: DOMMatrix | null): SVGSVGElement {
    return {
      getScreenCTM: vi.fn(() => ctm),
    } as unknown as SVGSVGElement;
  }

  it('converts client coordinates to SVG coordinates using screen CTM', () => {
    // 2x uniform scale with (50, 100) translation in screen space.
    // Inverse: scale(0.5), translate(-25, -50).
    // x' = 200 * 0.5 + (-25) = 75
    // y' = 300 * 0.5 + (-50) = 100
    const ctm = new DOMMatrix([2, 0, 0, 2, 50, 100]);
    const svg = createMockSVG(ctm);
    const event = { clientX: 200, clientY: 300 } as MouseEvent;

    const result = getSVGPoint(event, svg);

    expect(svg.getScreenCTM).toHaveBeenCalled();
    expect(result.x).toBeCloseTo(75);
    expect(result.y).toBeCloseTo(100);
  });

  it('falls back to clientX/clientY when getScreenCTM returns null', () => {
    const svg = createMockSVG(null);
    const event = { clientX: 150, clientY: 250 } as MouseEvent;

    const result = getSVGPoint(event, svg);

    expect(result.x).toBe(150);
    expect(result.y).toBe(250);
  });
});
