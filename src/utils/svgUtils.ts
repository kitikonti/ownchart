/**
 * SVG utility functions shared across hooks.
 */

/**
 * Convert screen coordinates (clientX/clientY) to SVG element coordinates.
 */
export function getSVGPoint(
  e: MouseEvent | React.MouseEvent,
  svg: SVGSVGElement
): { x: number; y: number } {
  const point = svg.createSVGPoint();
  point.x = e.clientX;
  point.y = e.clientY;

  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: e.clientX, y: e.clientY };

  const svgPoint = point.matrixTransform(ctm.inverse());
  return { x: svgPoint.x, y: svgPoint.y };
}
