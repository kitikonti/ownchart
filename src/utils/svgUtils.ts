/**
 * SVG utility functions shared across hooks.
 */

import type { MouseEvent as ReactMouseEvent } from "react";

/** A 2-D point in SVG user-space coordinates. */
export interface Point {
  x: number;
  y: number;
}

/**
 * Convert screen coordinates (clientX/clientY) to SVG element coordinates.
 *
 * Falls back to raw screen coordinates when getScreenCTM() returns null
 * (element not rendered / not in the document). This path should not be
 * reached during normal user interaction.
 */
export function getSVGPoint(
  e: MouseEvent | ReactMouseEvent,
  svg: SVGSVGElement
): Point {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: e.clientX, y: e.clientY };

  const svgPoint = new DOMPoint(e.clientX, e.clientY).matrixTransform(
    ctm.inverse()
  );
  return { x: svgPoint.x, y: svgPoint.y };
}
