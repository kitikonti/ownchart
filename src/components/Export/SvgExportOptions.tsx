/**
 * SVG-specific export options.
 * Timeline scale is handled by ScaleOptions.
 *
 * @remarks Placeholder — returns null until SVG-specific options are implemented
 * (e.g. responsiveMode, includeAccessibility). Keep in sync with PdfExportOptions
 * as the parallel component for the SVG format slot.
 */
export function SvgExportOptions(): JSX.Element | null {
  // No SVG-specific options currently - timeline scale is handled by ScaleOptions
  return null;
}
