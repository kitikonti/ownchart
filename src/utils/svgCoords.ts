/**
 * SVG coordinate conversion utilities.
 * getBoundingClientRect() already reflects the scroll position of the parent
 * container, so no scroll-offset correction is needed.
 */

/** Convert client coordinates to SVG-local coordinates. */
export function clientToSvgCoords(
  clientX: number,
  clientY: number,
  svgEl: SVGSVGElement
): { x: number; y: number } {
  const rect = svgEl.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}
