/**
 * Unit tests for svgCoords utilities.
 */

import { describe, it, expect, vi } from "vitest";
import { clientToSvgCoords } from "@/utils/svgCoords";

function makeSvgEl(left: number, top: number): SVGSVGElement {
  const el = {
    getBoundingClientRect: vi.fn(() => ({
      left,
      top,
      right: left + 800,
      bottom: top + 600,
      width: 800,
      height: 600,
      x: left,
      y: top,
      toJSON: vi.fn(),
    })),
  } as unknown as SVGSVGElement;
  return el;
}

describe("clientToSvgCoords", () => {
  it("subtracts the SVG element's left/top from client coordinates", () => {
    const svgEl = makeSvgEl(100, 50);
    const result = clientToSvgCoords(250, 130, svgEl);
    expect(result).toEqual({ x: 150, y: 80 });
  });

  it("returns zero coordinates when client coords equal the bounding rect origin", () => {
    const svgEl = makeSvgEl(200, 300);
    const result = clientToSvgCoords(200, 300, svgEl);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("handles zero offset (SVG at top-left corner of viewport)", () => {
    const svgEl = makeSvgEl(0, 0);
    const result = clientToSvgCoords(400, 200, svgEl);
    expect(result).toEqual({ x: 400, y: 200 });
  });

  it("calls getBoundingClientRect on the provided element", () => {
    const svgEl = makeSvgEl(10, 20);
    clientToSvgCoords(50, 60, svgEl);
    expect(svgEl.getBoundingClientRect).toHaveBeenCalledOnce();
  });
});
