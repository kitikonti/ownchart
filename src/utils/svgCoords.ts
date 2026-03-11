/**
 * SVG coordinate conversion utilities.
 * getBoundingClientRect() already reflects the scroll position of the parent
 * container, so no scroll-offset correction is needed.
 */

/**
 * Convert client coordinates to SVG-local coordinates.
 *
 * @param clientX - Horizontal client coordinate (e.g. from MouseEvent.clientX)
 * @param clientY - Vertical client coordinate (e.g. from MouseEvent.clientY)
 * @param svgEl   - The SVG element whose local coordinate space is the target
 * @returns `{ x, y }` in SVG-local pixels
 */
export function clientToSvgCoords(
  clientX: number,
  clientY: number,
  svgEl: SVGSVGElement
): { x: number; y: number } {
  const rect = svgEl.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}
